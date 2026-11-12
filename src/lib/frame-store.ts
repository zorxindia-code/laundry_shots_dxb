/**
 * Progressive loader + bounded decode cache for an image frame sequence.
 *
 * - Fetching: every frame's encoded bytes are downloaded once (in a priority
 *   order that adapts to the current scroll target) and kept as a `Blob`.
 *   Encoded frames are small compared with decoded ones.
 * - Decoding: `createImageBitmap` (off the main thread) on demand, into an LRU
 *   cache bounded by a byte budget — never one bitmap per frame.
 * - Nothing here touches React state; callers poll `bitmap()` from rAF and are
 *   notified via `onChange` when something new is available.
 * - Lifetime: shared per sequence via `acquireFrameStore` / `releaseFrameStore`,
 *   so leaving the page and coming back reuses everything already downloaded
 *   (see the bottom of this file).
 */

export interface FrameStoreOptions {
  count: number;
  src: (index: number) => string;
  /** Frames needed before the sequence is considered ready (0-based indices). */
  required: readonly number[];
  /** Parallel downloads. */
  fetchConcurrency?: number;
  /** Parallel decodes. */
  decodeConcurrency?: number;
  /** Upper bound for decoded bitmaps, in bytes (RGBA). */
  decodedBudget?: number;
  /** Upper bound for the number of decoded bitmaps (small screens decode small frames). */
  maxBitmaps?: number;
  onChange?: () => void;
}

const MAX_RETRIES = 3;

export class FrameStore {
  readonly count: number;
  private readonly src: (index: number) => string;
  private readonly required: Set<number>;
  private readonly fetchConcurrency: number;
  private readonly decodeConcurrency: number;
  private readonly decodedBudget: number;
  private readonly maxBitmaps: number;
  private onChange?: () => void;

  private readonly blobs: (Blob | undefined)[];
  private readonly fetching = new Set<number>();
  private readonly failures = new Map<number, number>();
  private readonly bitmaps = new Map<number, ImageBitmap>(); // insertion order = LRU order
  private readonly decoding = new Set<number>();
  private readonly abort = new AbortController();

  private target = 0;
  private direction = 1;
  private displayed = 0; // frame on the eased playback path (decode focus)
  private decodeSize: { width: number; height: number } | null = null;
  private generation = 0; // bumps when the decode size changes
  private disposed = false;
  private paused = false;

  loadedCount = 0;
  loadedBytes = 0;
  requiredLoaded = 0;

  constructor(options: FrameStoreOptions) {
    this.count = options.count;
    this.src = options.src;
    this.required = new Set(options.required);
    this.fetchConcurrency = options.fetchConcurrency ?? 6;
    this.decodeConcurrency = options.decodeConcurrency ?? 4;
    this.decodedBudget = options.decodedBudget ?? 128 * 1024 * 1024;
    this.maxBitmaps = options.maxBitmaps ?? 48;
    this.onChange = options.onChange;
    this.blobs = new Array(this.count);
  }

  get ready() {
    return this.requiredLoaded >= this.required.size;
  }

  get requiredTotal() {
    return this.required.size;
  }

  start() {
    this.pump();
  }

  /** Replace the change listener (the page that currently shows the sequence). */
  setListener(listener: (() => void) | undefined) {
    this.onChange = listener;
  }

  /** Stop starting new downloads/decodes (in-flight ones finish). */
  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.pump();
  }

  get isDisposed() {
    return this.disposed;
  }

  /** Release decoded bitmaps down to `keep` (most recently used first), e.g. while hidden. */
  trim(keep: number) {
    for (const [index, bitmap] of this.bitmaps) {
      if (this.bitmaps.size <= keep) break;
      if (index === this.displayed) continue;
      bitmap.close();
      this.bitmaps.delete(index);
    }
  }

  /** Where the scroll position is heading: reprioritises downloads. */
  focus(index: number, direction: number) {
    this.target = this.clamp(index);
    if (direction) this.direction = Math.sign(direction);
    this.pump();
  }

  /** The frame playback is currently showing: decodes are prioritised along its path. */
  focusPlayback(index: number) {
    this.displayed = this.clamp(index);
    this.pump();
  }

  /** Whether `index` is decoded (without touching LRU order). */
  has(index: number) {
    return this.bitmaps.has(index);
  }

  private clamp(index: number) {
    return Math.max(0, Math.min(this.count - 1, Math.round(index)));
  }

  /**
   * Decoded size (device pixels). Frames are decoded at display size (never
   * larger than the source) to keep memory proportional to the screen.
   */
  setDecodeSize(width: number, height: number) {
    const size = { width: Math.round(width), height: Math.round(height) };
    const current = this.decodeSize;
    if (current && Math.abs(current.width - size.width) < 2 && Math.abs(current.height - size.height) < 2) return;
    this.decodeSize = size;
    this.generation++;
    for (const bitmap of this.bitmaps.values()) bitmap.close();
    this.bitmaps.clear();
    this.pump();
  }

  /** Decoded bitmap for `index` if cached (marks it recently used), else null. */
  bitmap(index: number): ImageBitmap | null {
    const bitmap = this.bitmaps.get(index);
    if (!bitmap) return null;
    this.bitmaps.delete(index);
    this.bitmaps.set(index, bitmap);
    return bitmap;
  }

  isLoaded(index: number) {
    return this.blobs[index] !== undefined;
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    for (const bitmap of this.bitmaps.values()) bitmap.close();
    this.bitmaps.clear();
    this.blobs.length = 0;
  }

  /* ---------------------------------------------------------------------- */

  private pump() {
    if (this.disposed || this.paused) return;
    while (this.fetching.size < this.fetchConcurrency) {
      const next = this.nextToFetch();
      if (next === -1) break;
      void this.fetchFrame(next);
    }
    while (this.decoding.size < this.decodeConcurrency) {
      const next = this.nextToDecode();
      if (next === -1) break;
      void this.decodeFrame(next);
    }
  }

  /**
   * Download priority: required frames first (in order), then frames close
   * to the target — ahead in the scroll direction weighted over behind — with
   * a sparse spread (every 8th frame) pulled forward so fast scrubbing always
   * has a nearby frame.
   */
  private nextToFetch(): number {
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.count; i++) {
      if (this.blobs[i] || this.fetching.has(i) || (this.failures.get(i) ?? 0) >= MAX_RETRIES) continue;
      let score: number;
      if (this.required.has(i)) score = -1e6 + i;
      else {
        const delta = (i - this.target) * this.direction;
        score = delta >= 0 ? delta : -delta * 2.5;
        if (i % 8 === 0) score *= 0.3;
      }
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  /**
   * Decode order: the frames just ahead of the playback position (in the
   * scroll direction), then strided lookahead along the path toward the
   * target — so fast scrubbing keeps drawing intermediate frames — then the
   * target's neighbourhood.
   */
  private nextToDecode(): number {
    if (!this.decodeSize) return -1;
    const from = this.displayed;
    const gap = (this.target - from) * this.direction;
    const candidates = [0, 1, 2, 3, 4, -1, 5, 6, -2, 8].map((s) => from + s * this.direction);
    if (gap > 8) for (let s = 12; s < gap; s += Math.max(4, Math.floor(gap / 10))) candidates.push(from + s * this.direction);
    candidates.push(this.target, this.target + this.direction, this.target - this.direction, this.target + 2 * this.direction);
    for (const i of candidates) {
      if (i < 0 || i >= this.count) continue;
      if (this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i)) return i;
    }
    return -1;
  }

  private async fetchFrame(index: number) {
    this.fetching.add(index);
    try {
      const response = await fetch(this.src(index + 1), { signal: this.abort.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (this.disposed) return;
      this.blobs[index] = blob;
      this.loadedCount++;
      this.loadedBytes += blob.size;
      if (this.required.has(index)) this.requiredLoaded++;
      this.onChange?.();
    } catch (error) {
      if (this.disposed || (error as Error).name === "AbortError") return;
      this.failures.set(index, (this.failures.get(index) ?? 0) + 1);
    } finally {
      this.fetching.delete(index);
      this.pump();
    }
  }

  private async decodeFrame(index: number) {
    const blob = this.blobs[index];
    const size = this.decodeSize;
    if (!blob || !size) return;
    const generation = this.generation;
    this.decoding.add(index);
    try {
      const bitmap = await createImageBitmap(blob, {
        resizeWidth: size.width,
        resizeHeight: size.height,
        resizeQuality: "high",
      });
      if (this.disposed || generation !== this.generation) {
        bitmap.close();
        return;
      }
      this.bitmaps.set(index, bitmap);
      this.evict(size.width * size.height * 4);
      this.onChange?.();
    } catch {
      // Corrupt or unsupported: leave it undecoded; the previous frame stays on screen.
    } finally {
      this.decoding.delete(index);
      this.pump();
    }
  }

  /** Keep decoded bitmaps within the byte budget, evicting least recently used (never the target). */
  private evict(bytesPerBitmap: number) {
    const max = Math.max(4, Math.min(this.maxBitmaps, Math.floor(this.decodedBudget / bytesPerBitmap)));
    for (const [index, bitmap] of this.bitmaps) {
      if (this.bitmaps.size <= max) break;
      if (index === this.target || index === this.displayed) continue;
      bitmap.close();
      this.bitmaps.delete(index);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Shared ownership                                                          */
/* -------------------------------------------------------------------------- */
/*
 * Pages are hidden (React Activity) or unmounted on navigation, which tears
 * down their effects. The store therefore lives here, keyed by sequence +
 * version, instead of in a component: returning to the page reuses every frame
 * already downloaded (and the decoded ones still cached) with no new requests.
 *
 * While no page shows it, the store is paused and trimmed to a few decoded
 * frames; if nobody re-acquires it within `idleMs`, it is disposed so the
 * encoded frames don't stay in memory indefinitely.
 */

interface SharedEntry {
  store: FrameStore;
  users: number;
  timer: ReturnType<typeof setTimeout> | null;
}

const shared = new Map<string, SharedEntry>();

export function acquireFrameStore(key: string, create: () => FrameStore): FrameStore {
  let entry = shared.get(key);
  if (!entry || entry.store.isDisposed) {
    entry = { store: create(), users: 0, timer: null };
    shared.set(key, entry);
  }
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = null;
  entry.users++;
  return entry.store;
}

export function releaseFrameStore(key: string, { idleMs, keepDecoded }: { idleMs: number; keepDecoded: number }) {
  const entry = shared.get(key);
  if (!entry) return;
  entry.users = Math.max(0, entry.users - 1);
  if (entry.users > 0) return;
  entry.store.setListener(undefined);
  entry.store.pause();
  entry.store.trim(keepDecoded);
  entry.timer = setTimeout(() => {
    if (entry.users > 0) return;
    entry.store.dispose();
    shared.delete(key);
  }, idleMs);
}
