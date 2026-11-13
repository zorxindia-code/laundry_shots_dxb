#!/usr/bin/env node
/**
 * Build optimised, device-class derivatives of the lossless journey frames.
 *
 *   node scripts/optimize-frames.mjs
 *
 * Reads   public/images/laundry-frames/frame_%06d.webp   (lossless masters — read only)
 * Writes  public/images/laundry-frames-optimized/<variant>/frame_%06d.webp
 *         src/config/video-frames-optimized.ts           (generated manifest)
 *         docs/laundry-frames-optimized-report.md        (sizes + quality report)
 *
 * Same frame count, order and timing as the masters; aspect ratio preserved
 * (16:9 → exact 16:9 sizes); Lanczos3 downscale; lossy WebP. Quality is
 * measured as SSIM against the master scaled to the same size (so only the
 * compression loss is measured), on every 10th frame.
 *
 * Variant choice (benchmarked: size, SSIM, decode time, close-up inspection):
 * WebP over AVIF — AVIF was ~45% smaller but visibly smoothed fabric texture
 * at equal SSIM and lacks support before iOS 16; WebP decodes fast everywhere.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { cpus, tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const MASTER_DIR = path.join(ROOT, "public/images/laundry-frames");
const OUT_ROOT = path.join(ROOT, "public/images/laundry-frames-optimized");
const MANIFEST = path.join(ROOT, "src/config/video-frames-optimized.ts");
const REPORT = path.join(ROOT, "docs/laundry-frames-optimized-report.md");
const PUBLIC_ROOT = "/images/laundry-frames-optimized";

/** Device-class variants. */
const VARIANTS = [
  { id: "high", width: 1920, height: 1080, quality: 85, use: "Desktop / large screens" },
  { id: "standard", width: 1280, height: 720, quality: 82, use: "Phones and tablets" },
  { id: "low", width: 640, height: 360, quality: 75, use: "Low-end devices, slow networks, Save-Data" },
];
const WEBP = { effort: 6, smartSubsample: true };
const SSIM_EVERY = 10;

const name = (i) => `frame_${String(i).padStart(6, "0")}.webp`;

// Safety: never write into (or over) the master directory.
if (path.resolve(OUT_ROOT).startsWith(path.resolve(MASTER_DIR) + path.sep) || path.resolve(OUT_ROOT) === path.resolve(MASTER_DIR)) {
  throw new Error("Output directory must not be inside the master frame directory.");
}

const masters = (await readdir(MASTER_DIR)).filter((f) => /^frame_\d{6}\.webp$/.test(f)).sort();
if (!masters.length) throw new Error(`No master frames found in ${MASTER_DIR}`);
masters.forEach((f, k) => {
  if (f !== name(k + 1)) throw new Error(`Master sequence gap at ${f} (expected ${name(k + 1)})`);
});
const masterMeta = await sharp(path.join(MASTER_DIR, masters[0])).metadata();
let masterBytes = 0;
for (const f of masters) masterBytes += (await stat(path.join(MASTER_DIR, f))).size;
console.log(`Masters: ${masters.length} frames, ${masterMeta.width}×${masterMeta.height}, ${(masterBytes / 1048576).toFixed(1)} MB (read only)`);

const ssimOf = (a, b) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  const m = /All:([\d.]+)/.exec(r.stderr);
  if (!m) throw new Error(`SSIM failed: ${r.stderr.slice(-300)}`);
  return Number(m[1]);
};

const results = [];
const tmp = await mkdtemp(path.join(tmpdir(), "frames-ssim-"));
try {
  for (const v of VARIANTS) {
    if (Math.abs(v.width / v.height - masterMeta.width / masterMeta.height) > 1e-3) throw new Error(`${v.id}: aspect ratio differs from the masters`);
    const dir = path.join(OUT_ROOT, v.id);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    // Encode (parallel workers).
    let next = 0;
    const worker = async () => {
      while (next < masters.length) {
        const f = masters[next++];
        await sharp(path.join(MASTER_DIR, f))
          .resize(v.width, v.height, { kernel: "lanczos3", fit: "fill" }) // exact same aspect ratio: no stretch
          .webp({ quality: v.quality, ...WEBP })
          .toFile(path.join(dir, f));
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, cpus().length - 1) }, worker));

    // Validate + measure.
    const files = (await readdir(dir)).filter((f) => f.endsWith(".webp")).sort();
    if (files.length !== masters.length || files.some((f, k) => f !== masters[k])) throw new Error(`${v.id}: frame set does not match the masters`);
    const hash = createHash("sha256");
    const sizes = [];
    const ssims = [];
    for (const [k, f] of files.entries()) {
      const file = path.join(dir, f);
      const buf = await readFile(file);
      hash.update(f).update(buf);
      sizes.push(buf.length);
      const meta = await sharp(buf).metadata();
      if (meta.format !== "webp" || meta.width !== v.width || meta.height !== v.height) throw new Error(`${v.id}/${f}: invalid output`);
      if (k % SSIM_EVERY === 0 || k === files.length - 1) {
        const ref = path.join(tmp, "ref.png");
        const dec = path.join(tmp, "dec.png");
        await sharp(path.join(MASTER_DIR, f)).resize(v.width, v.height, { kernel: "lanczos3", fit: "fill" }).png({ compressionLevel: 1 }).toFile(ref);
        await sharp(buf).png({ compressionLevel: 1 }).toFile(dec);
        ssims.push(ssimOf(dec, ref));
      }
    }
    const total = sizes.reduce((a, b) => a + b, 0);
    const version = hash.digest("hex").slice(0, 12);
    results.push({ ...v, total, sizes, version, ssimMean: ssims.reduce((a, b) => a + b) / ssims.length, ssimMin: Math.min(...ssims), ssimSamples: ssims.length });
    console.log(`${v.id}: ${v.width}×${v.height} q${v.quality} → ${(total / 1048576).toFixed(2)} MB (${((1 - total / masterBytes) * 100).toFixed(1)}% smaller), SSIM mean ${results.at(-1).ssimMean.toFixed(4)} min ${results.at(-1).ssimMin.toFixed(4)}, version ${version}`);
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

/* ---------------------------------------------------------------- manifest */
const manifest = `/*
 * GENERATED by scripts/optimize-frames.mjs — do not edit by hand.
 * Optimised derivatives of the lossless masters in public/images/laundry-frames/
 * (which stay the untouched source of truth).
 */

export type FrameVariantId = ${VARIANTS.map((v) => `"${v.id}"`).join(" | ")};

export interface FrameVariant {
  id: FrameVariantId;
  width: number;
  height: number;
  quality: number;
  /** Public directory of this variant's frames (same names as the masters). */
  dir: string;
  /** Content hash of the variant's files: a URL version for immutable caching. */
  version: string;
  /** Total size of all frames, bytes. */
  totalBytes: number;
  /** Average frame size, bytes. */
  averageBytes: number;
}

export const frameVariants: Record<FrameVariantId, FrameVariant> = {
${results
  .map(
    (r) => `  ${r.id}: {
    id: "${r.id}",
    width: ${r.width},
    height: ${r.height},
    quality: ${r.quality},
    dir: "${PUBLIC_ROOT}/${r.id}",
    version: "${r.version}",
    totalBytes: ${r.total},
    averageBytes: ${Math.round(r.total / r.sizes.length)},
  },`,
  )
  .join("\n")}
};

/** Versioned URL of frame \`index\` (1-based) in \`variant\`. */
export const variantFrameSrc = (variant: FrameVariant, index: number) =>
  \`\${variant.dir}/frame_\${String(index).padStart(6, "0")}.webp?v=\${variant.version}\`;
`;
await writeFile(MANIFEST, manifest);

/* ------------------------------------------------------------------ report */
const mb = (b) => `${(b / 1048576).toFixed(2)} MB`;
const allTotal = results.reduce((s, r) => s + r.total, 0);
const report = `# Laundry journey — optimised frame variants

Generated by \`scripts/optimize-frames.mjs\` on ${new Date().toISOString()}.

Source: ${masters.length} lossless masters (${masterMeta.width}×${masterMeta.height}, ${mb(masterBytes)}) in \`public/images/laundry-frames/\` — read only, unchanged.

| Variant | Size | Encoding | Total | vs. masters | Average frame | SSIM vs. master at same size (mean / min, ${results[0].ssimSamples} frames) | Used for |
| --- | --- | --- | --- | --- | --- | --- | --- |
${results.map((r) => `| \`${r.id}\` | ${r.width}×${r.height} | WebP q${r.quality} | ${mb(r.total)} | −${((1 - r.total / masterBytes) * 100).toFixed(1)}% | ${(r.total / r.sizes.length / 1024).toFixed(1)} KB | ${r.ssimMean.toFixed(4)} / ${r.ssimMin.toFixed(4)} | ${r.use} |`).join("\n")}

All variants together: ${mb(allTotal)} on disk; a visitor downloads one variant.

Settings: Lanczos3 downscale (exact 16:9, no stretching), \`sharp\` WebP effort ${WEBP.effort}, smart chroma subsampling. Frame count, names and order identical to the masters (verified).
`;
await mkdir(path.dirname(REPORT), { recursive: true });
await writeFile(REPORT, report);
console.log(`All variants: ${mb(allTotal)}. Wrote ${path.relative(ROOT, MANIFEST)} and ${path.relative(ROOT, REPORT)}.`);
