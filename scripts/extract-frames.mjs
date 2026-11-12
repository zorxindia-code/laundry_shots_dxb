#!/usr/bin/env node
/**
 * Extract every frame of the laundry journey video into lossless WebP, validate
 * the result against the source, and generate the frame manifest.
 *
 *   node scripts/extract-frames.mjs            # probe → extract → encode → validate → manifest
 *   node scripts/extract-frames.mjs --verify   # re-validate existing frames + regenerate manifest
 *
 * Requires: ffmpeg, ffprobe (FFmpeg) and cwebp, dwebp, webpinfo (libwebp).
 * The installed FFmpeg has no libwebp encoder, so the pipeline is:
 *   MP4 ──ffmpeg (bit-exact BT.709 decode → RGB24, lossless PNG)──▶ temp PNG
 *       ──cwebp -lossless -exact──▶ public/images/laundry-frames/frame_%06d.webp
 * Lossless end to end: every WebP is checked pixel-for-pixel against a fresh
 * decode of the source video. The source MP4 is only read, never modified.
 */
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, stat, mkdir, writeFile } from "node:fs/promises";
import { cpus, tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/videos/Web.mp4");
const OUT_DIR = path.join(ROOT, "public/images/laundry-frames");
const MANIFEST = path.join(ROOT, "src/config/video-frames.ts");
const REPORT = path.join(ROOT, "docs/laundry-frames-report.md");
const PUBLIC_DIR = "/images/laundry-frames";
const DIGITS = 6;
const name = (i) => `frame_${String(i).padStart(DIGITS, "0")}.webp`;

/**
 * Untagged HD video: decode as BT.709 limited range (what browsers assume for
 * HD) into full-range RGB, with bit-exact, accurately rounded conversion.
 */
const RGB_FILTER =
  "scale=in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=pc:flags=accurate_rnd+full_chroma_int+full_chroma_inp+bitexact,format=rgb24";
const CWEBP_ARGS = ["-quiet", "-lossless", "-z", "9", "-exact", "-metadata", "none"];

const verifyOnly = process.argv.includes("--verify");
const log = (...args) => console.log(...args);

/* ----------------------------------------------------------------------------
 * Phase 1 — inspect the source
 * ------------------------------------------------------------------------- */
async function probe() {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", SOURCE]);
  const info = JSON.parse(stdout);
  const video = info.streams.find((s) => s.codec_type === "video");
  const audio = info.streams.filter((s) => s.codec_type === "audio");
  const counted = await run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", SOURCE]);
  const pts = (await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pts", "-of", "csv=p=0", SOURCE], { maxBuffer: 64 << 20 })).stdout
    .split("\n").filter(Boolean).map(Number);
  const deltas = new Set(pts.slice(1).map((p, i) => p - pts[i]));
  const [num, den] = video.r_frame_rate.split("/").map(Number);
  const [anum, aden] = video.avg_frame_rate.split("/").map(Number);
  return {
    codec: `${video.codec_name} (${video.profile})`,
    width: video.width,
    height: video.height,
    sar: video.sample_aspect_ratio,
    dar: video.display_aspect_ratio,
    pixFmt: video.pix_fmt,
    color: [video.color_space, video.color_range, video.color_primaries, video.color_transfer].map((v) => v ?? "unknown").join(" / "),
    fps: num / den,
    fpsLabel: video.r_frame_rate,
    avgFps: anum / aden,
    constantFrameRate: deltas.size === 1 && pts.every((p, i) => i === 0 || p > pts[i - 1]),
    duration: Number(video.duration ?? info.format.duration),
    containerFrames: Number(video.nb_frames),
    decodedFrames: Number(counted.stdout.trim()),
    timestamps: pts.length,
    bitrate: Number(info.format.bit_rate),
    size: Number(info.format.size),
    audio: audio.length ? audio.map((a) => a.codec_name).join(", ") : "none",
  };
}

/* ----------------------------------------------------------------------------
 * Phase 2 — extract (lossless PNG) and encode (lossless WebP)
 * ------------------------------------------------------------------------- */
async function extract(tmp) {
  await run("ffmpeg", ["-hide_banner", "-v", "error", "-i", SOURCE, "-map", "0:v:0", "-fps_mode", "passthrough", "-vf", RGB_FILTER, "-c:v", "png", "-compression_level", "1", path.join(tmp, "frame_%06d.png")]);
  return (await readdir(tmp)).filter((f) => f.endsWith(".png")).sort();
}

async function encode(tmp, pngs) {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  let next = 0;
  const worker = async () => {
    while (next < pngs.length) {
      const png = pngs[next++];
      await run("cwebp", [...CWEBP_ARGS, path.join(tmp, png), "-o", path.join(OUT_DIR, png.replace(".png", ".webp"))]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, cpus().length - 1) }, worker));
}

/* ----------------------------------------------------------------------------
 * Phase 3 — validate against a fresh decode of the source + sample edge bands
 * ------------------------------------------------------------------------- */

/** Streams the source as raw RGB24 frames, calling `onFrame(index, buffer)` in order. */
function decodeSource(width, height, onFrame) {
  const frameBytes = width * height * 3;
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-hide_banner", "-v", "error", "-i", SOURCE, "-map", "0:v:0", "-fps_mode", "passthrough", "-vf", RGB_FILTER, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    let pending = Buffer.alloc(0);
    let index = 0;
    let chain = Promise.resolve();
    ff.stdout.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      while (pending.length >= frameBytes) {
        const frame = pending.subarray(0, frameBytes);
        pending = pending.subarray(frameBytes);
        const i = ++index;
        ff.stdout.pause();
        chain = chain.then(() => onFrame(i, Buffer.from(frame))).then(() => ff.stdout.resume(), reject);
      }
    });
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? chain.then(() => resolve(index)) : reject(new Error(`ffmpeg exited ${code}`))));
  });
}

/** Decodes a WebP to raw RGB24 via dwebp (binary PPM). */
async function decodeWebp(file) {
  const { stdout } = await run("dwebp", ["-quiet", "-ppm", file, "-o", "-"], { encoding: "buffer", maxBuffer: 64 << 20 });
  // PPM header: "P6\n<w> <h>\n255\n"
  let newlines = 0;
  let offset = 0;
  while (newlines < 3) if (stdout[offset++] === 0x0a) newlines++;
  const [w, h] = stdout.subarray(0, offset).toString().split(/\s+/).slice(1, 3).map(Number);
  return { width: w, height: h, data: stdout.subarray(offset) };
}

const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/**
 * Background colour bands down the frame's left edge (x = 4, always background
 * in this video): [[startRow, "#rrggbb"], …]. Rows are grouped by the nearest
 * reference colour; 1–2 px antialiased seams are absorbed into a neighbour.
 */
function edgeBands(rgb, width, height) {
  const x = 4;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const o = (y * width + x) * 3;
    rows.push([rgb[o], rgb[o + 1], rgb[o + 2]]);
  }
  const isYellow = ([r, g, b]) => r > 160 && g > 160 && b < 120;
  const bands = [];
  for (let y = 0; y < height; y++) {
    const kind = isYellow(rows[y]) ? "yellow" : "navy";
    if (!bands.length || bands[bands.length - 1].kind !== kind) bands.push({ kind, start: y, end: y, sum: [0, 0, 0], n: 0 });
    const band = bands[bands.length - 1];
    band.end = y;
    band.sum = band.sum.map((s, k) => s + rows[y][k]);
    band.n++;
  }
  // Absorb antialiased seam slivers (≤ 2 rows) into the following band, then
  // merge neighbours of the same colour.
  for (let k = 0; k < bands.length - 1; k++) {
    if (bands[k].n <= 2) {
      bands[k + 1].start = bands[k].start;
      bands[k + 1].n += bands[k].n;
      bands.splice(k--, 1);
    }
  }
  const merged = [];
  for (const band of bands) {
    const last = merged[merged.length - 1];
    if (last && last.kind === band.kind) {
      last.end = band.end;
      last.n += band.n;
    } else merged.push({ ...band });
  }
  // Representative colour: the band's median row (avoids seam blending).
  return merged.map((band) => {
    const mid = rows[Math.floor((band.start + band.end) / 2)];
    return [band.start, hex(...mid), band.kind];
  });
}

/**
 * Horizontal extent of everything that is not flat background: per row, the
 * first / last pixel differing from the row's left-edge background colour
 * (backgrounds are flat, full-width bands). Rows sampled every 2 px.
 */
function subjectExtent(rgb, width, height) {
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 2) {
    const o = y * width * 3;
    const bg = [rgb[o + 12], rgb[o + 13], rgb[o + 14]]; // x = 4
    const differs = (x) => {
      const i = o + x * 3;
      return Math.abs(rgb[i] - bg[0]) + Math.abs(rgb[i + 1] - bg[1]) + Math.abs(rgb[i + 2] - bg[2]) > 30;
    };
    for (let x = 8; x < Math.min(left, width - 8); x++) if (differs(x)) { left = x; break; }
    for (let x = width - 9; x > Math.max(right, 8); x--) if (differs(x)) { right = x; break; }
  }
  return { left, right };
}

async function validate(meta) {
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".webp")).sort();
  const expected = Array.from({ length: meta.decodedFrames }, (_, k) => name(k + 1));
  const missing = expected.filter((f) => !files.includes(f));
  const extra = files.filter((f) => !expected.includes(f));

  const invalid = [];
  const notLossless = [];
  const badDims = [];
  const mismatched = [];
  const bands = [];
  const subject = { left: meta.width, right: -1 };
  let totalBytes = 0;
  const sizes = [];

  const decoded = await decodeSource(meta.width, meta.height, async (i, rgb) => {
    bands[i - 1] = edgeBands(rgb, meta.width, meta.height);
    const extent = subjectExtent(rgb, meta.width, meta.height);
    subject.left = Math.min(subject.left, extent.left);
    subject.right = Math.max(subject.right, extent.right);
    const file = path.join(OUT_DIR, name(i));
    try {
      const { stdout } = await run("webpinfo", [file]);
      if (!/Format: Lossless/.test(stdout)) notLossless.push(i);
      const out = await decodeWebp(file);
      if (out.width !== meta.width || out.height !== meta.height) badDims.push(i);
      else if (!out.data.equals(rgb)) mismatched.push(i);
      const { size } = await stat(file);
      totalBytes += size;
      sizes.push(size);
    } catch {
      invalid.push(i);
    }
    if (i % 50 === 0) log(`  validated ${i}/${meta.decodedFrames}`);
  });

  return { files: files.length, decoded, missing, extra, invalid, notLossless, badDims, mismatched, bands, subject, totalBytes, sizes };
}

/* ----------------------------------------------------------------------------
 * Phase 4 — manifest
 * ------------------------------------------------------------------------- */

/** Scenes in order: a new scene owns the top of the frame whenever the top band's colour changes. */
function detectScenes(bands) {
  const scenes = [];
  bands.forEach((frameBands, k) => {
    const kind = frameBands[0][2];
    if (!scenes.length || scenes[scenes.length - 1].kind !== kind) scenes.push({ kind, start: k + 1, end: k + 1 });
    else scenes[scenes.length - 1].end = k + 1;
  });
  return scenes;
}

async function writeManifest(meta, result, scenes) {
  const bandsLiteral = result.bands
    .map((frameBands) => `[${frameBands.map(([y, c]) => `[${y},"${c}"]`).join(",")}]`)
    .join(",\n    ");
  const source = `/*
 * GENERATED by scripts/extract-frames.mjs — do not edit by hand.
 * Source: public/videos/Web.mp4 (sha256 ${meta.sha256.slice(0, 16)}…)
 */

/** Scene owning the top of the frame: frames [start, end] (1-based, inclusive). */
export interface FrameScene {
  start: number;
  end: number;
  tone: "navy" | "yellow";
}

/**
 * Background colour bands down the frame's left edge, top → bottom, as
 * [startRow, "#rrggbb"] in source pixels. The video's backgrounds are flat brand
 * colours, so these give the exact colour at each edge (letterbox fill) and the
 * wipe positions (overlay clipping) without reading pixels at runtime.
 */
export type FrameBands = readonly (readonly [number, string])[];

export const laundryFrames = {
  /** Total frames (1-based: frame_000001 … frame_${String(meta.decodedFrames).padStart(DIGITS, "0")}). */
  count: ${meta.decodedFrames},
  width: ${meta.width},
  height: ${meta.height},
  /** Constant frame rate of the source (timestamps verified). */
  fps: ${meta.fps},
  duration: ${meta.duration},
  dir: "${PUBLIC_DIR}",
  digits: ${DIGITS},
  extension: "webp",
  /** Total size of all frames in bytes. */
  totalBytes: ${result.totalBytes},
  /**
   * Horizontal extent (source px) of all non-background content across every
   * frame. Outside it every frame is flat, full-width background, so narrow
   * screens may trim beyond it without losing any picture content.
   */
  subject: { left: ${result.subject.left}, right: ${result.subject.right} },
  scenes: [
    ${scenes.map((s) => `{ start: ${s.start}, end: ${s.end}, tone: "${s.kind}" }`).join(",\n    ")},
  ] as readonly FrameScene[],
  /** One entry per frame (index 0 = frame 1). */
  bands: [
    ${bandsLiteral},
  ] as readonly FrameBands[],
};

/** Public URL of frame \`index\` (1-based). */
export const frameSrc = (index: number) =>
  \`\${laundryFrames.dir}/frame_\${String(index).padStart(laundryFrames.digits, "0")}.\${laundryFrames.extension}\`;
`;
  await writeFile(MANIFEST, source);
}

async function writeReport(meta, result, scenes, settings) {
  const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
  const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
  const sorted = [...result.sizes].sort((a, b) => a - b);
  const uncompressed = meta.width * meta.height * 3 * meta.decodedFrames;
  const ok =
    !result.missing.length && !result.extra.length && !result.invalid.length && !result.notLossless.length && !result.badDims.length && !result.mismatched.length && result.decoded === meta.decodedFrames;
  const md = `# Laundry journey — frame extraction report

Generated by \`scripts/extract-frames.mjs\` on ${new Date().toISOString()}.

## Source video (\`public/videos/Web.mp4\`, unmodified)

| Property | Value |
| --- | --- |
| SHA-256 | \`${meta.sha256}\` |
| File size | ${mb(meta.size)} |
| Codec | ${meta.codec} |
| Resolution | ${meta.width}×${meta.height} (SAR ${meta.sar}, DAR ${meta.dar}) |
| Frame rate | ${meta.fpsLabel} (${meta.fps} fps; average ${meta.avgFps}) — ${meta.constantFrameRate ? "constant: every timestamp step identical" : "VARIABLE"} |
| Duration | ${meta.duration} s |
| Frames | ${meta.decodedFrames} decoded (container reports ${meta.containerFrames}; ${meta.timestamps} timestamps) |
| Pixel format | ${meta.pixFmt} |
| Colour (space / range / primaries / transfer) | ${meta.color} — untagged; decoded as BT.709 limited range |
| Bitrate | ${(meta.bitrate / 1e6).toFixed(2)} Mb/s |
| Audio | ${meta.audio} |
| Uncompressed RGB24 storage | ${mb(uncompressed)} (${kb(meta.width * meta.height * 3)} per frame) |

## Extraction settings

${settings}

## Output (\`public/images/laundry-frames/\`)

| | |
| --- | --- |
| Frames | ${result.files} (\`frame_000001.webp\` … \`${name(result.files)}\`) |
| Total size | ${mb(result.totalBytes)} (${((result.totalBytes / uncompressed) * 100).toFixed(1)}% of uncompressed) |
| Average frame | ${kb(result.totalBytes / result.files)} (min ${kb(sorted[0])}, median ${kb(sorted[Math.floor(sorted.length / 2)])}, max ${kb(sorted[sorted.length - 1])}) |
| Content extent (all frames) | x ${result.subject.left}–${result.subject.right} of ${meta.width} px; outside it every frame is flat background |
| Scenes detected | ${scenes.map((s, k) => `${k + 1}: ${s.start}–${s.end} (${s.kind})`).join(" · ")} |

## Validation — ${ok ? "PASSED" : "FAILED"}

- Source frames decoded: ${result.decoded}; WebP files: ${result.files}
- Missing: ${result.missing.length ? result.missing.join(", ") : "none"}; unexpected: ${result.extra.length ? result.extra.join(", ") : "none"}
- Invalid / unreadable WebP: ${result.invalid.length ? result.invalid.join(", ") : "none"}
- Not lossless (VP8L): ${result.notLossless.length ? result.notLossless.join(", ") : "none"}
- Wrong dimensions: ${result.badDims.length ? result.badDims.join(", ") : "none"}
- Pixel mismatch vs. source decode: ${result.mismatched.length ? result.mismatched.join(", ") : "none — all frames identical, in order"}
`;
  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, md);
  return ok;
}

/* ------------------------------------------------------------------------- */

const meta = await probe();
meta.sha256 = createHash("sha256").update(await readFile(SOURCE)).digest("hex");
log("Source:", JSON.stringify(meta));
if (!meta.constantFrameRate) {
  console.error("Source has a variable frame rate — review timestamps before extracting.");
  process.exit(1);
}

const settings = `- Decode: \`ffmpeg -i Web.mp4 -map 0:v:0 -fps_mode passthrough -vf "${RGB_FILTER}" -c:v png\` (lossless RGB24, no resize, no frame-rate change; every decoded frame kept)
- Encode: \`cwebp ${CWEBP_ARGS.join(" ")}\` (lossless VP8L, max compression effort, exact pixel values)`;

if (!verifyOnly) {
  const tmp = await mkdtemp(path.join(tmpdir(), "laundry-frames-"));
  try {
    log("Extracting frames…");
    const pngs = await extract(tmp);
    log(`Extracted ${pngs.length} PNG frames. Encoding lossless WebP…`);
    await encode(tmp, pngs);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

log("Validating against a fresh decode of the source…");
const result = await validate(meta);
const scenes = detectScenes(result.bands);
const ok = await writeReport(meta, result, scenes, settings);
if (!ok) {
  console.error(`Validation FAILED — see ${path.relative(ROOT, REPORT)}. Manifest not written.`);
  process.exit(1);
}
await writeManifest(meta, result, scenes);
log(`Validation passed. ${result.files} frames, ${(result.totalBytes / 1024 / 1024).toFixed(1)} MB. Scenes: ${scenes.map((s) => `${s.start}-${s.end}`).join(", ")}`);
log(`Wrote ${path.relative(ROOT, MANIFEST)} and ${path.relative(ROOT, REPORT)}`);
