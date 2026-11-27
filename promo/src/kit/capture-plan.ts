/**
 * What a film shows of its product, as a list of shots taken from the live site by scripts/capture.ts. Pure data, so
 * the capture script (Node) and the film (Remotion) read the same file: a film's `capture.ts`.
 */

/** A point on the page, px from the viewport's top left, or the centre of the first element a selector matches */
export type Target = string | readonly [number, number]

export type Step =
  /** Wait, ms */
  | { wait: number }
  /** Scroll whatever is under the pointer by `wheel` px, over `ms` (smooth, so scroll-driven pages animate) */
  | { wheel: number; ms?: number }
  /** Jump to a y position, or bring an element into view */
  | { scrollTo: number | string }
  /** Glide the pointer there over `ms`; the glide is recorded for the drawn cursor */
  | { move: Target; ms?: number }
  | { click: Target; ms?: number }
  /** Press at the first point, glide to the second, release */
  | { drag: readonly [Target, Target]; ms?: number }
  | { type: string; into?: string; delay?: number }
  | { press: string }
  /** JavaScript run in the page: close a banner, open a state the UI reaches only by a long path */
  | { run: string }

export interface Shot {
  /** File name in public/<film>/capture/, without extension */
  name: string
  /** Opens this page first (relative to the plan's base); without it the shot continues on the last shot's page */
  url?: string
  /** Run before the picture is taken or the recording starts */
  steps?: readonly Step[]
  /** A live clip instead of a still: seconds of screen, with steps run while it records */
  clip?: { seconds: number; steps?: readonly Step[] }
  /** The whole page as one tall still, for a scroll in the film */
  full?: boolean
}

export interface CapturePlan {
  base: string
  scheme?: "light" | "dark"
  viewport?: { width: number; height: number }
  /** CSS added to every page: hide a cookie banner, a dev badge */
  css?: string
  /**
   * The page's clock starts at this instant (ISO) and runs on from there: for a page that lays itself out by the time of
   * day (a globe turned to the sun), so it opens the same way every run. A held clock would also hold its animations.
   */
  time?: string
  shots: readonly Shot[]
}

/** The pointer through a clip, for the cursor the film draws: seconds from the clip's start, px, pressed */
export interface PointerTrack {
  width: number
  height: number
  points: { t: number; x: number; y: number; down: boolean }[]
}
