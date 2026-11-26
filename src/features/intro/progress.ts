/**
 * Entry loader progress: a clock and a curve.
 *
 * - The curve is slow, then medium, then fast, then slow: its speed climbs to a peak two-thirds of the way through and
 *   eases into 100, so the fill gathers itself, rushes, and settles instead of ticking up at one rate.
 * - The clock is honest. It runs on frame time, but stops at HOLD_AT until the real ready signal (fonts and first render)
 *   arrives, so a slow visit waits before the last, slow stretch rather than sitting at a fake 100%. Each frame adds at
 *   most MAX_STEP_MS: the first frames are exactly when the main thread is busiest, and a stalled frame would otherwise
 *   jump the fill from 12 to 90 and the animation would simply not be seen.
 */
export interface IntroTiming {
  /** Time for the curve to run from 0 to 100 when nothing holds it */
  fillMs: number
  /** Pause at 100% before the gate opens, so the full mark is actually seen */
  settleMs: number
}

/** First entry in a session: the whole ceremony */
export const FULL: IntroTiming = { fillMs: 3400, settleMs: 700 }
/** A reload in the same session: the same curve, brisk */
export const QUICK: IntroTiming = { fillMs: 1100, settleMs: 260 }

/** Where the clock waits for the page, as a share of fillMs (the curve stands at about 82% there) */
export const HOLD_AT = 0.8
/** Longest step the clock takes in one frame */
export const MAX_STEP_MS = 48
/** A little constant speed under the curve, so its slow ends still move */
const FLOOR = 0.15

/** 0..1 → 0..1. Speed: 0.15 at the start, about 1.66 at two-thirds, back to 0.15 at the end */
export function ease(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return FLOOR * x + (1 - FLOOR) * (4 * x ** 3 - 3 * x ** 4)
}

/** Advances the clock by one frame's time: capped, never backwards, and not past HOLD_AT until the page is ready */
export function tick(
  clock: number,
  dtMs: number,
  ready: boolean,
  timing: IntroTiming
) {
  const stop = ready ? timing.fillMs : timing.fillMs * HOLD_AT
  const next = clock + Math.min(MAX_STEP_MS, Math.max(0, dtMs))
  return Math.max(clock, Math.min(stop, next))
}

/** The fill, 0..100, at a clock reading */
export function progressAt(clock: number, timing: IntroTiming) {
  return 100 * ease(clock / timing.fillMs)
}
