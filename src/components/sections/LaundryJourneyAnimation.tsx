"use client";

import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useLayoutEffect, useRef } from "react";

import { elements } from "@/config/elements";
import { journeyStages } from "@/config/journey";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn, formatStep } from "@/lib/utils";
import type { JourneyStageId } from "@/types/journey";

/* -------------------------------------------------------------------------- */
/*  Choreography                                                              */
/* -------------------------------------------------------------------------- */
/*
 * Five scenes, each a full-width background block with its product centred in
 * the central track. The blocks are stacked and move together as one column,
 * so a product and its background can never drift apart.
 *
 * - Sizing: every product is shown at the same VISIBLE width (`--journey-w`,
 *   the dirty shirt's size in the original design), normalised from each PNG's
 *   measured visible bounds. A product taller than MAX_PRODUCT_HEIGHT (the
 *   van) is capped so it still fits on screen.
 * - Blocks: each scene block is ~80% of the viewport tall (taller when its
 *   product needs it). When a scene is active, its block's top sits at the top
 *   of the viewport: the previous scene has fully exited, the active colour
 *   fills the top ~80%, the next scene previews below it with its product
 *   emerging directly beneath the active one, and the scene after that shows
 *   as a thin background-only strip. The last scene's colour simply
 *   continues to the bottom.
 * - Motion: each product moves with its background but at its own scroll-
 *   linked pace — it previews right under the active product, then settles
 *   into its presented position as its scene becomes active, with a subtle
 *   product-specific lag/tilt (PRODUCT_MOTION). All of it is zero at holds.
 * - Holds: scroll progress is divided into moves and brief holds. At each hold
 *   the active scene rests while the user keeps scrolling; moves ease in and
 *   out of the holds. Everything stays tied to native scroll.
 */

const STAGE_COUNT = journeyStages.length;

/** Active scene block height (fraction of stage height); the rest previews upcoming scenes. */
const SCENE_BLOCK = 0.78;

/**
 * Thickness of the follow-on strip (fraction of stage height): below the
 * next-scene preview, the scene after it shows as a thin band of background
 * only. Scenes further ahead stay hidden until it is their turn.
 */
const PREVIEW_STRIP = 0.04;

/** Bottom of the follow-on strip stack: everything waits at or below this line. */
const STRIP_LINE = 1 - PREVIEW_STRIP;

/**
 * Product placement inside its scene block (fraction of stage height):
 * - presented: the product sits PAD_BOTTOM above its block's bottom edge;
 * - previewing: the next product sits PREVIEW_PAD below its band's top edge,
 *   i.e. directly beneath the active product (gap = PAD_BOTTOM + PREVIEW_PAD).
 * Between the two it travels at its own scroll-linked pace relative to its
 * background, settling exactly into the presented position.
 */
const PAD_TOP = 0.03;
const PAD_BOTTOM = 0.03;
const PREVIEW_PAD = 0.02;

/**
 * Product-specific motion during moves (zero at every presentation hold, so
 * presented positions and sizes never change):
 * - `lag`: how far the product trails its background while entering and
 *   leads it while exiting (fraction of the panel's own travel). It is zero
 *   at both rest points (previewing below, presented at the top), so it only
 *   shows mid-move — the product visibly travels at its own pace, most
 *   strongly for the van;
 * - `tilt`: a slight rotation in degrees at the start/end of a move.
 */
const PRODUCT_MOTION: Record<JourneyStageId, { lag: number; tilt: number }> = {
  "dirty-clothes": { lag: 0.12, tilt: 1.5 },
  "washing-machine": { lag: 0.16, tilt: 0 },
  ironing: { lag: 0.1, tilt: 0 },
  delivery: { lag: 0.4, tilt: 0 },
  "fresh-clothes": { lag: 0.14, tilt: -2 },
};

/** Page scroll (in svh) per stage height of travel. */
const SCROLL_PER_UNIT = 110;

/** Length of each presentation hold, in the same units as travel (subtle). */
const HOLD = 0.25;

/**
 * Desktop defaults of two responsive values that CSS and layout share:
 * - maximum visible product height (`--journey-max-h`): keeps the tall van's
 *   block close to SCENE_BLOCK so the next scene can still preview;
 * - top inset (`--journey-inset`): space reserved for the overlay copy above
 *   a presented product (0 on desktop, where the copy sits beside it).
 */
const MAX_PRODUCT_HEIGHT = 0.8;
const TOP_INSET = 0;

/**
 * Shared visible product width as a fraction of the stage height at desktop
 * sizes: the dirty shirt's visible width in the original design (66% tall).
 */
const NOMINAL_WIDTH = 0.496;

/** A scene's oversized numeral fades in once its edge rises above this line. */
const NUMERAL_FADE_FROM = 0.84;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Visible height ÷ visible width of each scene's product (from measured PNG bounds). */
const PRODUCT_ASPECT = journeyStages.map((stage) => {
  const { visible } = elements[stage.element];
  return visible.height / visible.width;
});

interface Layout {
  /** Visible product heights (fraction of stage height). */
  heights: number[];
  /** Scene block heights (fraction of stage height). */
  blocks: number[];
  /** Space reserved above a presented product for the overlay copy. */
  inset: number;
  /** Travel position at which scene j is active (its block top at the viewport top). */
  tops: number[];
  /** Travel at scroll start (scene 01 just below the viewport) and end. */
  start: number;
  end: number;
  /** Scroll → travel mapping: moves and holds, with scroll weights. */
  segments: { from: number; to: number; weight: number }[];
}

/** Layout for a shared visible width of `width` stage heights. */
function createLayout(width: number, maxHeight = MAX_PRODUCT_HEIGHT, inset = TOP_INSET): Layout {
  const heights = PRODUCT_ASPECT.map((aspect) => Math.min(width * aspect, maxHeight));
  const last = heights.length - 1;
  // Every scene, including the last, is presented in the same position; the
  // last panel still extends to the bottom, so the journey ends on one scene.
  const blocks = heights.map((h) => Math.max(SCENE_BLOCK, inset + PAD_TOP + h + PAD_BOTTOM));
  const tops = [0];
  for (let j = 1; j <= last; j++) tops.push(tops[j - 1] + blocks[j - 1]);
  const start = -1;
  const end = tops[last];

  const segments: Layout["segments"] = [];
  const move = (from: number, to: number) => segments.push({ from, to, weight: Math.abs(to - from) });
  const hold = (at: number) => segments.push({ from: at, to: at, weight: HOLD });
  move(start, tops[0]);
  for (let j = 0; j < last; j++) {
    hold(tops[j]);
    move(tops[j], tops[j + 1]);
  }
  hold(end);

  return { heights, blocks, tops, inset, start, end, segments };
}

/** Total scroll weight of a layout (stage heights of scroll). */
const scrollUnits = (l: Layout) => l.segments.reduce((sum, seg) => sum + seg.weight, 0);

/** Travel position for scroll progress `u` (0–1): eased moves, flat holds. */
function travelAt(l: Layout, u: number): number {
  let remaining = clamp01(u) * scrollUnits(l);
  for (const seg of l.segments) {
    if (remaining <= seg.weight || seg === l.segments[l.segments.length - 1]) {
      const t = seg.weight ? clamp01(remaining / seg.weight) : 0;
      const eased = 0.5 - Math.cos(Math.PI * t) / 2; // sine in-out
      return seg.from + (seg.to - seg.from) * eased;
    }
    remaining -= seg.weight;
  }
  return l.end;
}

/** Layout at nominal desktop proportions (SSR and section height). */
const NOMINAL_LAYOUT = createLayout(NOMINAL_WIDTH);
const SECTION_HEIGHT = Math.round(100 + scrollUnits(NOMINAL_LAYOUT) * SCROLL_PER_UNIT);

/** Top edge of scene `j`'s block (fraction of stage height; < 0 once it has moved up). */
/**
 * Top edges of all scene panels (fraction of stage height; < 0 once moved up).
 *
 * Panels travel together as one stack. A panel that would still be below the
 * strip line waits there as the thin follow-on strip — but only one strip is
 * ever shown: each waiting panel stays at least PREVIEW_STRIP below the panel
 * before it (so further scenes are hidden below the viewport), and slides up
 * into the strip position smoothly as the panel ahead of it rises.
 */
function sceneEdges(l: Layout, p: number): number[] {
  const edges: number[] = [];
  l.tops.forEach((top, j) => {
    const travelling = top - p;
    if (j === 0) {
      edges.push(travelling); // base scene
      return;
    }
    const waiting = Math.max(STRIP_LINE, edges[j - 1] + PREVIEW_STRIP);
    edges.push(Math.min(travelling, waiting, 1));
  });
  return edges;
}

/**
 * Product `j`'s translateY within its own scene panel (fraction of panel
 * height): centred in its block below the inset, plus its product-specific
 * lag while its scene is moving (`edge` ≠ 0). At a hold it is exactly centred,
 * so product and background present together.
 */
function productOffset(l: Layout, j: number, edge = 0, motion = true): number {
  const h = l.heights[j];
  // Product top within its panel (fraction of stage height).
  const presented = l.blocks[j] - PAD_BOTTOM - h;
  let top = presented;
  if (motion && j > 0) {
    const preview = l.blocks[j - 1]; // this scene's edge while it previews
    if (edge >= preview) {
      // Previewing (edge = preview): directly beneath the active product.
      // Further down — as the background-only follow-on strip — the product
      // is kept just out of sight below the viewport.
      const hidden = PREVIEW_PAD + PREVIEW_STRIP + 0.03;
      top = PREVIEW_PAD + (hidden - PREVIEW_PAD) * clamp01((edge - preview) / (STRIP_LINE - preview));
    } else if (edge > 0) {
      // Entering: settle from the preview position to the presented one.
      const t = edge / preview; // 1 at preview → 0 when presented
      top = presented + (PREVIEW_PAD - presented) * t;
    }
    // Product-specific pace (zero at both rest points): strongest for the van.
    const { lag } = PRODUCT_MOTION[journeyStages[j].id];
    top += lag * (edge < 0 ? edge : edge < preview ? edge * (1 - edge / preview) : 0);
  }
  return top + h / 2 - 0.5; // as an offset from the panel's centre
}

/** Whether any part of product `j` is within the viewport (with a small margin). */
const productOnScreen = (l: Layout, j: number, edge: number, offset: number) =>
  Math.abs(edge + offset) < 0.55 + l.heights[j] / 2;

/** Scene caption: labels the next-scene band and the upcoming-process strips. */
const captionOpacity = (edge: number) => clamp01((edge - 0.55) / 0.2) * clamp01((0.995 - edge) / 0.02);

/**
 * Oversized numeral: fades in once its panel rises, and out as its scene
 * starts to exit (so it never slides up behind the progress indicator).
 */
const numeralOpacity = (edge: number, j: number) =>
  (j === 0 ? 1 : clamp01((NUMERAL_FADE_FROM - edge) / 0.3)) * clamp01(1 + edge / 0.12);

/** Active scene: the one whose block top is closest to the viewport top. */
function activeAt(l: Layout, p: number): number {
  let best = 0;
  l.tops.forEach((t, j) => {
    if (Math.abs(t - p) < Math.abs(l.tops[best] - p)) best = j;
  });
  return best;
}

/** Progress (0–1) through step `j`, bounded by the midpoints between scenes. */
function stepProgress(l: Layout, j: number, p: number): number {
  const last = l.tops.length - 1;
  const start = j === 0 ? l.start : (l.tops[j - 1] + l.tops[j]) / 2;
  const end = j === last ? l.end : (l.tops[j] + l.tops[j + 1]) / 2;
  return clamp01((p - start) / (end - start));
}

/** Panel edges at scroll start, for the server-rendered markup. */
const INITIAL_EDGES = sceneEdges(NOMINAL_LAYOUT, NOMINAL_LAYOUT.start);

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function LaundryJourneyAnimation() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends Element>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    const stage = root.querySelector<HTMLElement>("[data-journey-stage]");
    const panels = q<HTMLElement>("[data-journey-panel]");
    const products = q<HTMLElement>("[data-journey-product]");
    const images = q<HTMLImageElement>("[data-journey-product] img");
    const captions = q<HTMLElement>("[data-journey-caption]");
    const numerals = q<HTMLElement>("[data-journey-numeral]");
    const tracks = q<HTMLElement>("[data-journey-track]");
    const steps = q<HTMLElement>("[data-journey-step]");
    const fills = q<HTMLElement>("[data-journey-fill]");
    const counters = q<HTMLElement>("[data-journey-counter]");
    const hints = q<HTMLElement>("[data-journey-hint]");
    const overlays = q<HTMLElement>("[data-journey-overlay]");
    if (!stage || !images[0]) return;

    /** Shared visible width as rendered (CSS `--journey-w`) + responsive vars → layout. */
    const measureLayout = (): Layout => {
      const first = elements[journeyStages[0].element];
      const visibleWidth = (images[0].offsetWidth * first.visible.width) / first.width;
      const css = getComputedStyle(root);
      const read = (name: string, fallback: number) => {
        const value = parseFloat(css.getPropertyValue(name));
        return Number.isFinite(value) ? value : fallback;
      };
      return createLayout(
        visibleWidth / stage.clientHeight,
        read("--journey-max-h", MAX_PRODUCT_HEIGHT),
        read("--journey-inset", TOP_INSET),
      );
    };

    let activeIndex = -1;

    const setActive = (index: number) => {
      if (index === activeIndex) return;
      activeIndex = index;
      const label = formatStep(index + 1);
      counters.forEach((el) => (el.textContent = label));
      // Steps exist once per overlay copy; `k` is the step number.
      steps.forEach((el, i) => {
        const k = i % STAGE_COUNT;
        el.dataset.state = k === index ? "active" : k < index ? "done" : "upcoming";
        if (k === index) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      });
    };

    const mm = gsap.matchMedia();

    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
        fullMotion: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const reduceMotion = Boolean(context.conditions?.reduceMotion);
        let layout = measureLayout();

        // Hand transforms over from the SSR inline styles to GSAP.
        gsap.set([...panels, ...products], { clearProps: "transform" });

        const render = (progress: number) => {
          const travel = travelAt(layout, progress);
          // Reduced motion: discrete scenes — the active scene fills the stage
          // with its product at rest; no travel.
          const active = activeAt(layout, travel);
          const p = reduceMotion ? layout.tops[active] : travel;

          const edges = sceneEdges(layout, p);
          panels.forEach((panel, j) => {
            const edge = edges[j];
            gsap.set(panel, { yPercent: edge * 100 });
            gsap.set(tracks[j], { "--journey-edge": edge });
            gsap.set(captions[j], { opacity: captionOpacity(edge) });
            gsap.set(numerals[j], { opacity: numeralOpacity(edge, j) });

            const offset = productOffset(layout, j, edge, !reduceMotion);
            gsap.set(products[j], {
              yPercent: offset * 100,
              rotation: reduceMotion ? 0 : PRODUCT_MOTION[journeyStages[j].id].tilt * Math.max(-1, Math.min(1, edge)),
              // Off screen: skip painting it.
              autoAlpha: productOnScreen(layout, j, edge, offset) && (!reduceMotion || j === active) ? 1 : 0,
            });
          });

          // The scene that owns the top of the viewport. A scene only becomes
          // active once its background has reached the top — i.e. once the
          // previous scene has completely exited — so the label, counter and
          // progress never announce a scene while the previous one still shows.
          let top = 0;
          edges.forEach((edge, j) => {
            if (edge * stage.clientHeight <= 1) top = j; // within 1px of the top
          });
          setActive(top);

          // Overlay text colour follows the wipe exactly: the light (white) copy
          // is clipped to navy areas and the dark copy to yellow areas.
          const split = top + 1 < edges.length ? Math.min(edges[top + 1], 1) : 1;
          const topIsNavy = journeyStages[top].tone === "navy";
          const above = `inset(0% 0% ${(1 - split) * 100}% 0%)`;
          const below = `inset(${split * 100}% 0% 0% 0%)`;
          overlays.forEach((el) => {
            const light = el.dataset.journeyOverlay === "light";
            gsap.set(el, { clipPath: light === topIsNavy ? above : below });
          });

          fills.forEach((el, j) =>
            gsap.set(el, { scaleX: stepProgress(layout, j % STAGE_COUNT, travel) }),
          );
          gsap.set(hints, { autoAlpha: 1 - clamp01((travel - layout.start) / 0.2) });
        };

        const proxy = { progress: 0 };
        render(0);

        gsap.to(proxy, {
          progress: 1,
          ease: "none", // holds and easing come from the layout's scroll segments
          onUpdate: () => render(proxy.progress),
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            // Light smoothing only; the page itself scrolls natively.
            scrub: reduceMotion ? true : 0.6,
            invalidateOnRefresh: true,
            // Re-measure product sizes on resize / refresh.
            onRefresh: () => {
              layout = measureLayout();
              render(proxy.progress);
            },
          },
        });
      },
      root,
    );

    // Re-measure once every product image has decoded.
    let cancelled = false;
    Promise.all(images.map((img) => img.decode().catch(() => undefined))).then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-labelledby="journey-heading"
      // svh where supported, so mobile browser chrome doesn't resize the stage.
      // --journey-track: central track width, shared by all five scenes (desktop
      //   matches the product column of the original JPG compositions, ~34%).
      // --journey-w: the ONE visible product width shared by all five products —
      //   the dirty shirt's size in the original design.
      // --journey-max-h / --journey-inset: see MAX_PRODUCT_HEIGHT / TOP_INSET.
      className="relative h-[calc(var(--journey-height)*1vh)] w-full bg-brand-navy [--journey-inset:0.16] [--journey-max-h:0.58] [--journey-track:min(84vw,30rem)] [--journey-w:min(77vw,27.6rem,49.6svh)] supports-[height:100svh]:h-[calc(var(--journey-height)*1svh)] lg:[--journey-inset:0] lg:[--journey-max-h:0.8] lg:[--journey-track:34vw] lg:[--journey-w:min(31.2vw,49.6svh)]"
      style={{ "--journey-height": SECTION_HEIGHT } as CSSProperties}
    >
      <div data-journey-stage className="sticky top-0 h-screen w-full overflow-hidden supports-[height:100svh]:h-svh">
        {/* Scenes: stacked full-width background blocks, each with its product
            in the central track. Later scenes stack above earlier ones, so the
            next block cleanly covers everything below its top edge. */}
        {journeyStages.map((stage, index) => {
          const isNavy = stage.tone === "navy";
          const element = elements[stage.element];
          const { visible } = element;
          const aspect = PRODUCT_ASPECT[index];
          const edge = INITIAL_EDGES[index];
          const offset = productOffset(NOMINAL_LAYOUT, index, edge);
          // Visible product width: the shared width, unless that would make it
          // taller than MAX_PRODUCT_HEIGHT. Render the image so its VISIBLE part
          // has that width, and shift it so the visible box (not the canvas) is
          // centred on the track.
          const visibleWidth = `min(var(--journey-w), calc(var(--journey-max-h) * ${100 / aspect}svh))`;
          const imageWidth = `calc(${visibleWidth} * ${element.width / visible.width})`;
          const shiftX = -((visible.x + visible.width / 2 - element.width / 2) / element.width) * 100;
          const shiftY = -((visible.y + visible.height / 2 - element.height / 2) / element.height) * 100;

          return (
            <div
              key={stage.id}
              data-journey-panel
              className={cn(
                "absolute inset-0 will-change-transform",
                isNavy ? "bg-brand-navy text-brand-white" : "bg-brand-yellow text-brand-navy",
              )}
              style={{ zIndex: index + 1, transform: `translateY(${edge * 100}%)` }}
            >
              {/* Central track: identical width and position in every scene. The
                  track is invisible (no borders); the product is clipped to it
                  horizontally and to its own scene. On small screens a soft fade
                  band, anchored to the viewport (offset by the panel edge), keeps
                  exiting products clear of the overlay copy. */}
              <div
                data-journey-track
                className="absolute inset-y-0 left-1/2 w-[var(--journey-track)] -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_calc((0.12_-_var(--journey-edge,0))*100%),#000_calc((0.19_-_var(--journey-edge,0))*100%))] lg:[mask-image:none]"
                style={{ "--journey-edge": edge } as CSSProperties}
              >
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: isNavy
                      ? "radial-gradient(circle closest-side, rgb(234 245 252 / 0.12), transparent)"
                      : "radial-gradient(circle closest-side, rgb(255 255 255 / 0.5), transparent)",
                  }}
                />
                <div
                  data-journey-product
                  className="absolute inset-0 flex items-center justify-center will-change-transform"
                  style={{
                    transform: `translateY(${offset * 100}%)`,
                  }}
                >
                  <Image
                    src={element.src}
                    width={element.width}
                    height={element.height}
                    alt={element.alt}
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    preload={index === 0}
                    loading={index === 0 ? undefined : "eager"}
                    draggable={false}
                    className="h-auto max-w-none shrink-0 select-none"
                    style={{ width: imageWidth, translate: `${shiftX}% ${shiftY}%` }}
                  />
                </div>
              </div>

              <p
                data-journey-caption
                aria-hidden
                className="pointer-events-none absolute left-12 top-1.5 z-10 hidden items-center gap-3 text-[0.62rem] font-semibold uppercase leading-none tracking-[0.28em] lg:flex"
                style={{ opacity: captionOpacity(edge) }}
              >
                <span className="font-mono tabular-nums">{formatStep(index + 1)}</span>
                <span className="h-px w-6 bg-current opacity-50" />
                {stage.title}
              </p>

              <span
                data-journey-numeral
                aria-hidden
                className="pointer-events-none absolute right-[4%] top-[16%] hidden select-none text-[clamp(8rem,15vw,15rem)] font-semibold leading-none tracking-[-0.06em] text-transparent lg:block"
                style={{
                  opacity: numeralOpacity(edge, index),
                  WebkitTextStroke: isNavy ? "1.5px rgb(255 255 255 / 0.14)" : "1.5px rgb(6 23 94 / 0.16)",
                }}
              >
                {formatStep(index + 1)}
              </span>
            </div>
          );
        })}

        {/* Minimal overlay: scene label, counter and progress. Rendered in a
            light and a dark copy, each clipped to the matching background. */}
        <JourneyOverlay variant="light" />
        <JourneyOverlay variant="dark" />

        {/* Scroll hint, shown before product 01 enters */}
        <p
          data-journey-hint
          aria-hidden
          className="absolute inset-x-0 top-[46%] z-20 flex flex-col items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-brand-white/70"
        >
          Scroll to begin
          <ArrowDown className="size-4" strokeWidth={1.75} />
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overlay                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Scene label, counter and progress. The "light" copy (white text, read by
 * assistive tech) shows over navy; the "dark" copy (navy text, aria-hidden)
 * shows over yellow. The animation clips each copy at the scene wipe edge.
 */
function JourneyOverlay({ variant }: { variant: "light" | "dark" }) {
  const isLight = variant === "light";

  return (
    <div
      data-journey-overlay={variant}
      aria-hidden={isLight ? undefined : true}
      className={cn(
        "pointer-events-none absolute inset-0 z-20",
        isLight ? "text-brand-white" : "text-brand-navy",
      )}
      style={{ clipPath: isLight ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
    >
      <div className="flex items-start justify-between gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pt-10">
        <div className="min-w-0">
          <h2
            id={isLight ? "journey-heading" : undefined}
            className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] lg:text-[0.68rem]"
          >
            The Shots Experience
          </h2>
          <ol className="mt-4 grid lg:mt-6">
            {journeyStages.map((stage, index) => (
              <li
                key={stage.id}
                data-journey-step
                data-state={index === 0 ? "active" : "upcoming"}
                aria-current={isLight && index === 0 ? "step" : undefined}
                className="col-start-1 row-start-1 translate-y-2 opacity-0 transition duration-500 data-[state=active]:translate-y-0 data-[state=active]:opacity-100 motion-reduce:transition-none"
              >
                <p className="font-mono text-[0.65rem] font-semibold tabular-nums opacity-60">
                  {formatStep(index + 1)}
                </p>
                <h3 className="mt-1 text-xl font-semibold uppercase leading-none tracking-[-0.01em] lg:text-2xl">
                  {stage.title}
                </h3>
                <p className="mt-2 max-w-[28ch] text-sm leading-snug opacity-75">
                  {stage.description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="w-[clamp(6.5rem,13vw,11rem)] shrink-0" aria-hidden>
          <p className="text-right font-mono text-[0.68rem] font-semibold tabular-nums tracking-[0.2em]">
            <span data-journey-counter>{formatStep(1)}</span>
            <span className="opacity-50"> / {formatStep(STAGE_COUNT)}</span>
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {journeyStages.map((stage) => (
              <div key={stage.id} className="h-0.5 overflow-hidden bg-current/20">
                <div
                  data-journey-fill
                  className="h-full origin-left bg-current"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
