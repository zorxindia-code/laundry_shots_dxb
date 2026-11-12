"use client";

import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import { Logo } from "@/components/ui/Logo";
import { journeyStages } from "@/config/journey";
import { frameSrc, laundryFrames, type FrameBands } from "@/config/video-frames";
import { acquireFrameStore, FrameStore, releaseFrameStore } from "@/lib/frame-store";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn, formatStep } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */
/*
 * The laundry journey video (public/videos/Web.mp4), played frame by frame
 * from its lossless WebP sequence on ONE canvas, driven by scroll:
 *
 *   scroll progress p (0 → 1)  ⇒  frame index = p × (count − 1)
 *
 * Scrolling down plays forward, up plays backward; nothing autoplays and the
 * wheel is never intercepted (native scrolling + ScrollTrigger progress). A
 * short rAF ease toward the exact target frame softens wheel steps; it always
 * settles on the frame the scroll position maps to.
 */

const { count: FRAME_COUNT, width: SOURCE_W, height: SOURCE_H, bands: FRAME_BANDS, scenes: SCENES } = laundryFrames;

/** Page scroll (in svh) across the whole sequence: ~12 px per frame at 900 px. */
const SCROLL_SVH = 420;

/** Easing toward the target frame per animation frame (1 = none). */
const FOLLOW = 0.22;

/**
 * Frames needed before the experience becomes interactive: the opening second
 * plus a sparse spread across the sequence (every 12th frame), so any scroll
 * position already has a nearby frame. The rest streams in afterwards.
 */
const REQUIRED_FRAMES = Array.from(
  new Set([...Array.from({ length: 24 }, (_, i) => i), ...Array.from({ length: Math.ceil(FRAME_COUNT / 12) }, (_, k) => Math.min(FRAME_COUNT - 1, k * 12)), FRAME_COUNT - 1]),
).sort((a, b) => a - b);

/**
 * Decoded-frame memory: at most 128 MB of RGBA bitmaps and 48 frames
 * (≈15 full-HD frames on desktop; 48 smaller ones on phones).
 */
const DECODED_BUDGET = 128 * 1024 * 1024;
const MAX_DECODED = 48;

/** Edge bands thinner than this (source rows) are ignored for letterbox fills (source edge artefacts). */
const MIN_FILL_BAND = 12;

const SCENE_LABELS = SCENES.length === journeyStages.length;

/**
 * Content version of the frame set (hash of the generated manifest: sizes,
 * per-frame colour bands, scenes). Frame URLs carry it as `?v=…`, so they can
 * be cached as immutable: regenerated frames get new URLs automatically.
 */
const FRAME_VERSION = (() => {
  const text = JSON.stringify([laundryFrames.count, laundryFrames.totalBytes, laundryFrames.subject, laundryFrames.scenes, laundryFrames.bands]);
  let hash = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(36);
})();
const versionedFrameSrc = (index: number) => `${frameSrc(index)}?v=${FRAME_VERSION}`;

/** Shared frame store key, and how long it survives once no page shows it. */
const STORE_KEY = `laundry-frames:${FRAME_VERSION}`;
const STORE_IDLE_MS = 10 * 60 * 1000;
/** Decoded frames kept while the page is hidden (the rest are released). */
const HIDDEN_DECODED = 6;

const isYellow = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r > 160 && g > 160 && b < 120;
};

/** Colour bands of a frame, ignoring thin artefact bands at the bottom edge. */
function fillBands(bands: FrameBands) {
  const list = bands.map(([start, color], k) => ({
    start,
    end: k + 1 < bands.length ? bands[k + 1][0] : SOURCE_H,
    color,
  }));
  while (list.length > 1 && list[list.length - 1].end - list[list.length - 1].start < MIN_FILL_BAND) {
    const thin = list.pop()!;
    list[list.length - 1].end = thin.end;
  }
  return list;
}

const sceneAt = (frame: number) => {
  const index = SCENES.findIndex((s) => frame + 1 >= s.start && frame + 1 <= s.end);
  return index === -1 ? SCENES.length - 1 : index;
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function LaundryFrameSequence() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const section: HTMLElement = root;
    const stage = root.querySelector<HTMLElement>("[data-frames-stage]");
    const canvas = root.querySelector<HTMLCanvasElement>("[data-frames-canvas]");
    const poster = root.querySelector<HTMLElement>("[data-frames-poster]");
    const loader = root.querySelector<HTMLElement>("[data-frames-loader]");
    const loaderPercent = root.querySelector<HTMLElement>("[data-frames-percent]");
    const loaderBar = root.querySelector<HTMLElement>("[data-frames-loader-bar]");
    const buffer = root.querySelector<HTMLElement>("[data-frames-buffer]");
    const overlays = Array.from(root.querySelectorAll<HTMLElement>("[data-frames-overlay]"));
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-frames-step]"));
    const fills = Array.from(root.querySelectorAll<HTMLElement>("[data-frames-fill]"));
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-frames-counter]"));
    const hint = root.querySelector<HTMLElement>("[data-frames-hint]");
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!stage || !canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Canvas geometry (CSS px) and the contained frame rectangle within it.
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let rect = { x: 0, y: 0, w: 0, h: 0 };

    let target = 0; // exact frame for the scroll position (float)
    let current = 0; // eased position
    let drawn = -1; // frame currently on the canvas
    let raf = 0;
    let ready = false;
    let activeScene = -1;

    // Shared across visits: returning to the page reuses downloaded frames.
    const store = acquireFrameStore(
      STORE_KEY,
      () =>
        new FrameStore({
          count: FRAME_COUNT,
          src: versionedFrameSrc,
          required: REQUIRED_FRAMES,
          decodedBudget: DECODED_BUDGET,
          maxBitmaps: MAX_DECODED,
        }),
    );
    const wasReady = store.ready;
    store.setListener(() => {
      updateLoading();
      schedule();
    });

    /* ---------------- layout ---------------- */

    const measure = () => {
      cssW = stage.clientWidth;
      cssH = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const backingW = Math.round(cssW * dpr);
      const backingH = Math.round(cssH * dpr);
      // Resizing clears the canvas: only do it when the size really changed
      // (on a return visit the last drawn frame stays until the next one).
      const resized = canvas.width !== backingW || canvas.height !== backingH;
      if (resized) {
        canvas.width = backingW;
        canvas.height = backingH;
      }
      // Fit: the frame is never stretched, and its content (every non-
      // background pixel across all frames, `laundryFrames.subject`) is never
      // cropped. At minimum the whole frame fits (contain); on narrower screens
      // it scales up until the content spans the width, trimming only flat,
      // full-width background at the sides — never beyond filling the height.
      // Anchored to the bottom edge: the video frames its products against the
      // bottom of the picture. Spare height above takes the frame's top colour.
      const { left, right } = laundryFrames.subject;
      const contentW = (right - left + 1) * 1.1;
      const contain = Math.min(cssW / SOURCE_W, cssH / SOURCE_H);
      const scale = Math.min(cssH / SOURCE_H, Math.max(contain, cssW / contentW));
      const w = SOURCE_W * scale;
      const h = SOURCE_H * scale;
      const centred = cssW / 2 - ((left + right) / 2) * scale;
      const x = w > cssW ? Math.min(0, Math.max(cssW - w, centred)) : (cssW - w) / 2;
      rect = { x, y: cssH - h, w, h };
      stage.dataset.rect = [x, rect.y, w, h].map((v) => v.toFixed(2)).join(","); // diagnostics
      // Decode at the drawn size in device pixels (never above the source).
      const decodeScale = Math.min(1, (w * dpr) / SOURCE_W);
      store.setDecodeSize(SOURCE_W * decodeScale, SOURCE_H * decodeScale);
      if (resized) drawn = -1;
      schedule();
    };

    /* ---------------- drawing ---------------- */

    /** Paint frame `index`: letterbox areas extend the frame's own edge colours. */
    const draw = (index: number, bitmap: ImageBitmap) => {
      const bands = fillBands(FRAME_BANDS[index]);
      const k = rect.h / SOURCE_H;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Side areas (wider-than-16:9 screens): each band extended horizontally.
      // Top / bottom areas: the first / last band extended vertically.
      bands.forEach((band, b) => {
        const top = b === 0 ? 0 : rect.y + band.start * k;
        const bottom = b === bands.length - 1 ? cssH : rect.y + band.end * k;
        ctx.fillStyle = band.color;
        ctx.fillRect(0, Math.floor(top), cssW, Math.ceil(bottom - top) + 1);
      });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, rect.x, rect.y, rect.w, rect.h);
      drawn = index;
      stage.dataset.frame = String(index + 1); // drawn frame (1-based), for diagnostics
      updateChrome(index, bands);
      if (poster && !poster.dataset.hidden) {
        poster.dataset.hidden = "true";
        poster.style.opacity = "0";
      }
    };

    /** Overlay copy, scene label, progress and nav tone for the drawn frame. */
    const updateChrome = (index: number, bands: ReturnType<typeof fillBands>) => {
      // Regions in stage CSS px (bars included), with their tone.
      const k = rect.h / SOURCE_H;
      const regions = bands.map((band, b) => ({
        top: b === 0 ? 0 : rect.y + band.start * k,
        bottom: b === bands.length - 1 ? cssH : rect.y + band.end * k,
        yellow: isYellow(band.color),
      }));
      // Light copy shows over navy, dark copy over yellow — clipped at the real wipe edge.
      overlays.forEach((el) => {
        const wantYellow = el.dataset.framesOverlay === "dark";
        const region = regions.find((r) => r.yellow === wantYellow);
        el.style.clipPath = region
          ? `inset(${(region.top / cssH) * 100}% 0% ${(1 - region.bottom / cssH) * 100}% 0%)`
          : "inset(100% 0% 0% 0%)";
      });
      // Navigation tone: the band under the bar (~40 px).
      const navRegion = regions.find((r) => 40 >= r.top && 40 < r.bottom) ?? regions[0];
      stage.dataset.navTone = navRegion.yellow ? "yellow" : "navy";

      // Scene: the one owning the top of the frame.
      const scene = sceneAt(index);
      if (scene !== activeScene) {
        activeScene = scene;
        counters.forEach((el) => (el.textContent = formatStep(scene + 1)));
        steps.forEach((el, i) => {
          const s = i % SCENES.length;
          el.dataset.state = s === scene ? "active" : s < scene ? "done" : "upcoming";
          if (s === scene) el.setAttribute("aria-current", "step");
          else el.removeAttribute("aria-current");
        });
      }
      fills.forEach((el, i) => {
        const s = SCENES[i % SCENES.length];
        const progress = (index + 1 - s.start + 1) / (s.end - s.start + 1);
        el.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      });
      if (hint) hint.style.opacity = String(Math.max(0, 1 - index / 6));
    };

    /* ---------------- render loop ---------------- */

    const frame = () => {
      raf = 0;
      if (!ready) return;
      current = reduceMotion ? target : current + (target - current) * FOLLOW;
      if (Math.abs(target - current) < 0.02) current = target;
      const index = Math.round(current);
      store.focusPlayback(index);

      if (index !== drawn) {
        let show = index;
        // Not decoded yet: show the closest decoded frame on the way to it
        // (never one behind the current one), else keep the previous frame.
        if (!store.has(index) && drawn !== -1) {
          const step = index > drawn ? -1 : 1;
          show = -1;
          for (let i = index + step; i !== drawn; i += step) {
            if (store.has(i)) {
              show = i;
              break;
            }
          }
        }
        const bitmap = show === -1 ? null : store.bitmap(show);
        if (bitmap) draw(show, bitmap);
      }
      if (current !== target || drawn !== index) schedule();
    };

    function schedule() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    /* ---------------- loading ---------------- */

    function updateLoading() {
      const percent = Math.floor((store.requiredLoaded / store.requiredTotal) * 100);
      if (loaderPercent) loaderPercent.textContent = `${percent}%`;
      if (loaderBar) loaderBar.style.transform = `scaleX(${percent / 100})`;
      if (buffer) {
        buffer.style.transform = `scaleX(${store.loadedCount / FRAME_COUNT})`;
        if (store.loadedCount === FRAME_COUNT) buffer.parentElement?.setAttribute("data-complete", "true");
      }
      if (!ready && store.ready) {
        ready = true;
        section.dataset.framesReady = "true";
        loader?.setAttribute("aria-busy", "false");
        if (loader) {
          // Frames already in hand (return visit): no loading transition.
          if (wasReady) gsap.set(loader, { autoAlpha: 0 });
          else
            gsap.to(loader, {
              autoAlpha: 0,
              duration: reduceMotion ? 0 : 0.8,
              ease: "power2.out",
              delay: reduceMotion ? 0 : 0.2,
            });
        }
        current = target; // start exactly where the scroll position is
        schedule();
      }
    }

    /* ---------------- scroll ---------------- */

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        target = self.progress * (FRAME_COUNT - 1);
        store.focus(target, self.direction);
        schedule();
      },
      onRefresh: (self) => {
        target = self.progress * (FRAME_COUNT - 1);
        measure();
      },
    });
    target = trigger.progress * (FRAME_COUNT - 1);
    current = target;

    const resize = new ResizeObserver(() => measure());
    resize.observe(stage);
    measure();
    store.focus(target, 1);
    store.resume();
    updateLoading();

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      trigger.kill();
      // Hidden or unmounted: keep the downloaded frames for the next visit.
      releaseFrameStore(STORE_KEY, { idleMs: STORE_IDLE_MS, keepDecoded: HIDDEN_DECODED });
      if (loader) gsap.killTweensOf(loader);
    };
  }, []);

  const first = laundryFrames.bands[0][0][1];

  return (
    <section
      ref={rootRef}
      aria-labelledby="frames-heading"
      // The site navigation stays clear of the animation inside this zone.
      data-nav-immersive
      className="relative h-[calc((100+var(--frames-scroll))*1vh)] w-full bg-brand-navy supports-[height:100svh]:h-[calc((100+var(--frames-scroll))*1svh)]"
      style={{ ["--frames-scroll" as string]: SCROLL_SVH, backgroundColor: first }}
    >
      <div
        data-frames-stage
        data-nav-tone="navy"
        className="sticky top-0 h-screen w-full overflow-hidden supports-[height:100svh]:h-svh"
        style={{ backgroundColor: first }}
      >
        {/* First frame, shown until the canvas paints (no blank stage, no layout shift). */}
        <div data-frames-poster aria-hidden className="absolute inset-0 transition-opacity duration-300">
          <Image
            src={versionedFrameSrc(1)}
            alt=""
            width={SOURCE_W}
            height={SOURCE_H}
            unoptimized
            preload
            className="size-full object-contain object-bottom"
          />
        </div>

        <canvas
          data-frames-canvas
          role="img"
          aria-label="The Shots laundry journey: a stained shirt is deep cleaned, precisely ironed, delivered and returned fresh and ready to wear."
          className="absolute inset-0 size-full"
        />

        <FramesOverlay variant="light" />
        <FramesOverlay variant="dark" />

        {/* Scroll cue (bottom-left, over background — clear of the centred product) */}
        <p
          data-frames-hint
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-5 z-20 flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-brand-white/75 sm:left-8 lg:bottom-10 lg:left-12"
        >
          <ArrowDown className="size-4 motion-safe:animate-bounce" strokeWidth={1.75} />
          Scroll
        </p>

        {/* Background buffering indicator (real progress; hides when complete) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-0.5 bg-brand-white/10 transition-opacity duration-700 data-[complete=true]:opacity-0"
        >
          <div data-frames-buffer className="h-full origin-left bg-brand-yellow/70" style={{ transform: "scaleX(0)" }} />
        </div>

        <FramesLoader />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loader                                                                    */
/* -------------------------------------------------------------------------- */

function FramesLoader() {
  return (
    <div
      data-frames-loader
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-10 bg-brand-navy px-6 text-center text-brand-white"
    >
      <Logo className="h-14 lg:h-16" />
      <div className="w-[min(18rem,70vw)]">
        <p className="flex items-baseline justify-between text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue">
          <span>Preparing your experience…</span>
          <span data-frames-percent className="font-mono tabular-nums text-brand-white">
            0%
          </span>
        </p>
        <div className="mt-4 h-px overflow-hidden bg-brand-white/15">
          <div
            data-frames-loader-bar
            className="h-full origin-left bg-brand-yellow transition-transform duration-300"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overlay                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Scene label, counter and progress. The "light" copy (white text, read by
 * assistive tech) is clipped to navy areas, the "dark" copy (navy text,
 * aria-hidden) to yellow areas — using the frame's real wipe edges.
 */
function FramesOverlay({ variant }: { variant: "light" | "dark" }) {
  const isLight = variant === "light";

  return (
    <div
      data-frames-overlay={variant}
      aria-hidden={isLight ? undefined : true}
      className={cn("pointer-events-none absolute inset-0 z-20", isLight ? "text-brand-white" : "text-brand-navy")}
      style={{ clipPath: isLight ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
    >
      {/* Offset below the fixed site navigation. On portrait screens the frame
          is letterboxed, so the copy sits in the band above it. */}
      <div className="flex items-start justify-between gap-6 px-5 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <div className="min-w-0">
          <h2
            id={isLight ? "frames-heading" : undefined}
            className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] lg:text-[0.68rem]"
          >
            The Shots Experience
          </h2>
          {SCENE_LABELS && (
            <ol className="mt-4 grid lg:mt-6">
              {journeyStages.map((stage, index) => (
                <li
                  key={stage.id}
                  data-frames-step
                  data-state={index === 0 ? "active" : "upcoming"}
                  aria-current={isLight && index === 0 ? "step" : undefined}
                  className="col-start-1 row-start-1 translate-y-2 opacity-0 transition duration-500 data-[state=active]:translate-y-0 data-[state=active]:opacity-100 motion-reduce:transition-none"
                >
                  <p className="font-mono text-[0.65rem] font-semibold tabular-nums opacity-60">{formatStep(index + 1)}</p>
                  <h3 className="mt-1 text-xl font-semibold uppercase leading-none tracking-[-0.01em] lg:text-2xl">
                    {stage.title}
                  </h3>
                  <p className="mt-2 max-w-[28ch] text-sm leading-snug opacity-75">{stage.description}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {SCENE_LABELS && (
          <div className="w-[clamp(6.5rem,13vw,11rem)] shrink-0" aria-hidden>
            <p className="text-right font-mono text-[0.68rem] font-semibold tabular-nums tracking-[0.2em]">
              <span data-frames-counter>{formatStep(1)}</span>
              <span className="opacity-50"> / {formatStep(SCENES.length)}</span>
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {SCENES.map((scene) => (
                <div key={scene.start} className="h-0.5 overflow-hidden bg-current/20">
                  <div data-frames-fill className="h-full origin-left bg-current" style={{ transform: "scaleX(0)" }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
