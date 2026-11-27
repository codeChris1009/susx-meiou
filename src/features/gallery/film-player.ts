/**
 * Plays a piece's launch film when the mouse rests on it: the loader paints its ring over the dimming painting while
 * the film loads, then the ring breathes open into a circle of film that widens until it fills the frame. The film
 * plays where the painting was; when the mouse leaves, or the film ends, the circle closes back onto the painting.
 *
 * One clock drives everything (the ring's progress, the opening in the scene, the ring riding its edge, the sound),
 * so the parts can never drift apart. Timing is kept in pure functions below the class, which the tests read.
 */
import { pace } from "@/components/oil-ring/brush"

import { SCREEN_FULL } from "./ring"
import type { GalleryScene } from "./scene"

export type FilmPhase = "idle" | "painting" | "opening" | "playing" | "closing"

export const FILM = {
  /** The brush's unhurried stroke round the ring, ms: also how long the mouse must rest before anything plays */
  paint: 1900,
  /** Fastest the ring may catch up once the film arrives, progress per ms: it is painted, never snapped shut */
  catchUp: 1 / 420,
  /** Seconds of film in hand before it opens */
  buffer: 6,
  /**
   * Where the film starts, s: past its first moments of pure black, as the gold construction lines begin to draw, so
   * the opening shows something growing out of the ring rather than a hole
   */
  from: 0.6,
  open: 1600,
  close: 950,
  /** A mouse that slips off the piece for less than this (ms) is still watching */
  grace: 450,
  /** Time constant of the painting dimming and coming back, ms */
  dimTau: 220,
} as const

/** The painted ring's centre line, in piece heights from the centre: the opening starts just inside it */
export const RING_RADIUS = 0.31
const IRIS_FROM = RING_RADIUS - 0.035

export interface FilmState {
  phase: FilmPhase
  /** 0 to 1, the ring's painted share */
  progress: number
  /** A new ring every time it starts painting */
  seed: number
}

interface FilmPlayerOptions {
  scene: GalleryScene
  index: number
  video: HTMLVideoElement
  /** Gets the ring's ride on the opening as --ring-scale, --ring-fade and --ring-blur */
  root: HTMLElement
  onChange: (state: FilmState) => void
}

export class FilmPlayer {
  private readonly o: FilmPlayerOptions
  private state: FilmState = { phase: "idle", progress: 0, seed: 0 }
  private since = 0
  private last = 0
  private dim = 0
  private watching = false
  private holding = false
  private lastSeen = -Infinity
  /** Played to the end: it waits for the mouse to leave before playing again */
  private spent = false
  private sound = false
  private frame = 0
  /** How open the film was when it began to close: a film that closes halfway open closes from there */
  private closingFrom = SCREEN_FULL

  constructor(options: FilmPlayerOptions) {
    this.o = options
  }

  /** The mouse is resting on the piece (from the scene), or not */
  watch(on: boolean) {
    this.watching = on
    this.wake()
  }

  /** The mouse is on the film's own controls, which count as still watching */
  hold(on: boolean) {
    this.holding = on
    this.wake()
  }

  setSound(on: boolean) {
    this.sound = on
    const v = this.o.video
    v.muted = !on
    // Unmuting needs the click that asked for it; if the browser still refuses, the film plays on silent
    if (on && !v.paused) v.play().catch(() => (v.muted = true))
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.o.video.pause()
    this.o.scene.setScreening(null)
  }

  private wake() {
    if (!this.frame) {
      this.last = performance.now()
      this.frame = requestAnimationFrame(this.tick)
    }
  }

  private set(next: Partial<FilmState>, now: number) {
    if (next.phase && next.phase !== this.state.phase) this.since = now
    const state = { ...this.state, ...next }
    if (
      state.phase !== this.state.phase ||
      state.seed !== this.state.seed ||
      Math.abs(state.progress - this.state.progress) > 0.001
    ) {
      this.state = state
      this.o.onChange(state)
    }
  }

  private readonly tick = (now: number) => {
    const dt = Math.min(64, now - this.last)
    this.last = now
    const { video, scene, index, root } = this.o
    const here = this.watching || this.holding
    if (here) this.lastSeen = now
    const gone = !here && now - this.lastSeen > FILM.grace
    if (gone) this.spent = false
    const t = now - this.since
    const { phase } = this.state
    let dimTo = 0
    let iris = 0
    let fade = 0

    if (phase === "idle") {
      if (here && !this.spent) {
        if (video.preload !== "auto") video.preload = "auto"
        if (
          video.readyState === 0 &&
          video.networkState !== video.NETWORK_LOADING
        )
          video.load()
        this.set(
          { phase: "painting", progress: 0, seed: this.state.seed + 1 },
          now
        )
      }
    } else if (phase === "painting") {
      dimTo = 1
      if (gone) this.set({ phase: "idle" }, now)
      else if (here) {
        const p = approach(
          this.state.progress,
          paintable(t, readiness(video)),
          dt
        )
        this.set({ progress: p }, now)
        if (p >= 1) {
          video.currentTime = FILM.from
          video.muted = !this.sound
          video.volume = 0
          video.play().catch(() => {
            video.muted = true
            return video.play()
          })
          this.set({ phase: "opening" }, now)
        }
      }
    } else if (phase === "opening" || phase === "playing") {
      const k = phase === "opening" ? Math.min(1, t / FILM.open) : 1
      dimTo = 1
      iris = irisAt(k)
      fade = Math.min(1, k / 0.22)
      video.volume = k
      const ride = iris / RING_RADIUS
      root.style.setProperty("--ring-scale", ride.toFixed(4))
      root.style.setProperty(
        "--ring-fade",
        (1 - smooth(0.2, 0.7, k)).toFixed(3)
      )
      root.style.setProperty(
        "--ring-blur",
        `${(smooth(0.15, 0.7, k) * 8).toFixed(2)}px`
      )
      if (video.ended || gone) {
        if (video.ended) this.spent = true
        this.closingFrom = iris
        this.set({ phase: "closing" }, now)
      } else if (k >= 1 && phase === "opening")
        this.set({ phase: "playing" }, now)
    } else {
      const k = Math.min(1, t / FILM.close)
      dimTo = 1 - k
      iris = this.closingFrom * (1 - easeInOut(k))
      fade = 1 - smooth(0.75, 1, k)
      video.volume = Math.max(0, 1 - k)
      if (k >= 1) {
        video.pause()
        this.set({ phase: "idle", progress: 0 }, now)
      }
    }

    this.dim += (dimTo - this.dim) * (1 - Math.exp(-dt / FILM.dimTau))
    const live = this.state.phase !== "idle" || this.dim > 0.002
    scene.setScreening(
      live ? { index, video, dim: this.dim, iris, fade } : null
    )

    this.frame = live || here ? requestAnimationFrame(this.tick) : 0
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2

/**
 * How much of the film is in hand, 0 to 1: all of it once the browser says it can play through or `FILM.buffer`
 * seconds are buffered, else the buffered share of that.
 */
export function readiness(
  v: Pick<HTMLMediaElement, "readyState" | "buffered" | "duration">
) {
  if (v.readyState >= 4) return 1
  const end = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0
  const need = Math.min(FILM.buffer, v.duration || FILM.buffer)
  return Math.min(1, end / need)
}

/** How far the ring may be painted `elapsed` ms in: at the brush's pace, held back by how much film has arrived */
export function paintable(elapsed: number, ready: number) {
  const brush = pace(elapsed / FILM.paint)
  return ready >= 1 ? brush : Math.min(brush, 0.12 + 0.8 * ready)
}

/** Moves the ring's progress toward `target` over `dt` ms, never faster than FILM.catchUp and never backwards */
export function approach(progress: number, target: number, dt: number) {
  if (target <= progress) return progress
  return Math.min(target, progress + dt * FILM.catchUp)
}

/**
 * The opening's radius, `k` 0 to 1 through it: it draws breath just inside the ring, then widens past the frame's
 * corners and settles. Slow, fast, slow.
 */
export function irisAt(k: number) {
  return (
    IRIS_FROM +
    (SCREEN_FULL - IRIS_FROM) * easeInOut(Math.min(1, Math.max(0, k)))
  )
}
