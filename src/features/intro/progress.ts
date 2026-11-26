/**
 * Entry loader progress: two numbers, after the ANTHOLOGY prepare screen.
 *
 * - target is honest. Time alone pushes it to READY_CAP; only the real ready signal (fonts and first render) takes it
 *   to 100. So a fast visit still sees the fill play, and a slow one never sits at a fake 100%.
 * - shown chases target at a capped speed. The first frames are exactly when the main thread is busiest (bundle parse,
 *   font decode, React's first render), so a few frames go missing; a purely time-based counter would then leap from 12
 *   to 100 and the animation would simply not be seen. Capping the speed turns that leap into a quick run.
 */
export interface IntroTiming {
  /** Time for the timeline alone to reach READY_CAP */
  fillMs: number
  /** Pause at 100% before the curtain lifts, so the full mark is actually seen */
  settleMs: number
}

/** First entry in a session: the whole ceremony */
export const FULL: IntroTiming = { fillMs: 1800, settleMs: 620 }
/** A reload in the same session: the same sequence, brisk */
export const QUICK: IntroTiming = { fillMs: 520, settleMs: 240 }

export const READY_CAP = 92
/** Fastest the shown value may move, in points per millisecond (100 points in 900ms) */
export const MAX_RATE = 100 / 900

export function targetAt(
  elapsedMs: number,
  ready: boolean,
  timing: IntroTiming
) {
  const timed = Math.min(
    READY_CAP,
    (Math.max(0, elapsedMs) / timing.fillMs) * READY_CAP
  )
  return ready && timed >= READY_CAP ? 100 : timed
}

export function chase(shown: number, target: number, dtMs: number) {
  if (shown >= target) return shown
  return Math.min(target, shown + Math.max(0, dtMs) * MAX_RATE)
}
