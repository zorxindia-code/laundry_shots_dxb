import type { FrameVariantId } from "@/config/video-frames-optimized";

/**
 * Chooses which optimised frame variant (and motion level) a visitor gets.
 *
 * Signals, in order: Save-Data and very slow connections (Network Information
 * API), device memory and CPU cores, screen size, and this device's own
 * measured performance on earlier visits (a tier cap stored after slow
 * loading/decoding). Missing APIs simply don't constrain the choice.
 *
 * The plan is decided once per page session and then kept, so quality never
 * switches while the visitor is scrolling; measured problems only lower the
 * tier for the next visit.
 */

export interface FramePlan {
  tier: FrameVariantId;
  /** Limited motion: only every 4th frame is loaded (~¼ of the data). */
  lite: boolean;
  reasons: string[];
}

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

const ORDER: FrameVariantId[] = ["low", "standard", "high"];
const lower = (a: FrameVariantId, b: FrameVariantId) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b);

const CAP_KEY = "shots:frames-tier-cap";
const CAP_DAYS = 7;

function readCap(): FrameVariantId | null {
  try {
    const raw = localStorage.getItem(CAP_KEY);
    if (!raw) return null;
    const { tier, until } = JSON.parse(raw) as { tier: FrameVariantId; until: number };
    if (Date.now() > until || !ORDER.includes(tier)) {
      localStorage.removeItem(CAP_KEY);
      return null;
    }
    return tier;
  } catch {
    return null;
  }
}

/** Remember that this device struggled with `tier`: next visits start one tier lower. */
export function recordStruggle(tier: FrameVariantId, why: string) {
  const index = ORDER.indexOf(tier);
  if (index <= 0) return;
  try {
    localStorage.setItem(CAP_KEY, JSON.stringify({ tier: ORDER[index - 1], until: Date.now() + CAP_DAYS * 864e5, why }));
  } catch {
    // Storage unavailable (private mode): the next visit decides from signals again.
  }
}

let sessionPlan: FramePlan | null = null;

export function getFramePlan(): FramePlan {
  if (sessionPlan) return sessionPlan;

  const nav = navigator as Navigator & { connection?: NetworkInformationLike; deviceMemory?: number };
  const connection = nav.connection;
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  const reasons: string[] = [];

  // Screen: phones never need more than the standard variant.
  let tier: FrameVariantId = window.innerWidth < 768 ? "standard" : "high";
  reasons.push(window.innerWidth < 768 ? "phone viewport" : "large viewport");
  let lite = false;

  if (connection?.saveData) {
    tier = "low";
    lite = true;
    reasons.push("Save-Data");
  }
  const type = connection?.effectiveType;
  if (type === "slow-2g" || type === "2g") {
    tier = "low";
    lite = true;
    reasons.push(`connection ${type}`);
  } else if (type === "3g") {
    tier = lower(tier, "low");
    reasons.push("connection 3g");
  }

  if (memory !== undefined) {
    if (memory <= 2) tier = lower(tier, "low");
    else if (memory <= 4) tier = lower(tier, "standard");
    reasons.push(`deviceMemory ${memory}GB`);
  }
  if (cores !== undefined) {
    if (cores <= 2) tier = lower(tier, "low");
    else if (cores <= 4) tier = lower(tier, "standard");
    reasons.push(`${cores} cores`);
  }

  const cap = readCap();
  if (cap) {
    tier = lower(tier, cap);
    reasons.push(`measured cap ${cap}`);
  }

  sessionPlan = { tier, lite, reasons };
  return sessionPlan;
}
