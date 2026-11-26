/**
 * The camera and the lights for every frame of the 3D shots: a pure function of time, so any frame renders alone.
 */
import { Easing } from "remotion"

import type { StageState } from "./stage"
import { CUE, HANG, SHOT, SPOT_ON, TURNS, TURN_SECONDS } from "./timeline"

type Vec = readonly [number, number, number]
const TAU = Math.PI * 2
const STEP = TAU / HANG.length
const FRONT: Vec = [0, 0.02, -3.45]

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = Easing.inOut(Easing.cubic)
const sine = Easing.inOut(Easing.sin)
/** 0..1 across [a, b] with an easing */
const span = (t: number, a: number, b: number, ease = smooth) =>
  ease(clamp01((t - a) / (b - a)))
const mix = (a: number, b: number, p: number) => a + (b - a) * p
const mixV = (a: Vec, b: Vec, p: number): Vec => [
  mix(a[0], b[0], p),
  mix(a[1], b[1], p),
  mix(a[2], b[2], p),
]

/** The ring: every turn so far (Cubic.Out, as the gallery's arrows), then the spin-up into the cut */
export function ringAt(t: number) {
  let ring = 0
  for (const turn of TURNS)
    ring +=
      turn.steps *
      STEP *
      Easing.out(Easing.cubic)(clamp01((t - turn.at) / TURN_SECONDS))
  const rise = clamp01((t - SHOT.rise[0]) / (SHOT.rise[1] - SHOT.rise[0]))
  return ring - rise ** 3 * TAU * 1.2
}

/** Index of the painting facing the camera at time t */
export function frontAt(t: number) {
  const i = Math.round(-ringAt(t) / STEP)
  return ((i % HANG.length) + HANG.length) % HANG.length
}

/** The strike: a lamp catching, failing once, and holding */
function strike(t: number) {
  const d = t - SPOT_ON
  if (d < 0) return 0
  if (d < 0.05) return 1
  if (d < 0.11) return 0.12
  if (d < 0.16) return 0.85
  if (d < 0.2) return 0.3
  return 1
}

/** A flash of over-exposure on each montage cut, gone in a quarter second */
function flash(t: number) {
  let f = 0
  for (const at of CUE.braam) {
    const d = t - at
    if (d >= 0 && d < 0.4) f = Math.max(f, Math.exp(-d * 14))
  }
  return f
}

const base = (t: number) => ({
  ring: ringAt(t),
  time: t,
  spot: 1,
  beam: 1,
  candles: 0.4,
  exposure: 1 + flash(t) * 0.9,
})

export function stageAt(t: number): StageState | null {
  const within = ([a, b]: readonly [number, number]) => t >= a && t < b
  if (within(SHOT.reveal)) {
    const p = span(t, 4, 9, sine)
    return {
      ...base(t),
      camera: {
        position: mixV([0.45, -0.18, 1.6], [0.08, -0.04, -0.6], p),
        target: FRONT,
        fov: mix(40, 36, p),
      },
      spot: strike(t),
      candles: 0.32 * span(t, 6, 8.5),
    }
  }
  if (within(SHOT.room)) {
    const p = span(t, 9, 13.8)
    const drift = span(t, 13.8, 15, sine) * 0.25
    return {
      ...base(t),
      camera: {
        position: mixV([0.08, -0.04, -0.6], [drift, 3.4, 2.6], p),
        target: mixV(FRONT, [0, -0.7, -1.4], p),
        fov: mix(36, 52, p),
      },
      beam: mix(1, 0.35, p),
      candles: mix(0.32, 0.9, p),
    }
  }
  if (within(SHOT.light)) {
    const p = span(t, 15, 17, sine)
    return {
      ...base(t),
      camera: {
        position: mixV([-0.7, 0.05, -0.2], [-0.5, 0.08, -0.5], p),
        target: [0.15, 0, -3.45],
        fov: 42,
      },
      spotTarget: [mix(-2.4, 2.4, p), 0.1, -3.8],
      spotAngle: 0.2,
      beam: 0,
      candles: 0.35,
    }
  }
  if (within(SHOT.mirror)) {
    const p = span(t, 17, 19, sine)
    return {
      ...base(t),
      camera: {
        position: mixV([1.9, -0.88, 0.3], [1.1, -0.9, -0.4], p),
        target: [0, -0.75, -3.45],
        fov: 50,
      },
      beam: 0.6,
      candles: 0.6,
    }
  }
  if (within(SHOT.turn)) {
    const p = span(t, 19, 21, sine)
    return {
      ...base(t),
      camera: {
        position: mixV([0, 0.12, 0.9], [0, 0.12, 0.5], p),
        target: [0, 0, -3.4],
        fov: 62,
      },
      beam: 0.5,
      candles: 0.7,
    }
  }
  if (within(SHOT.script)) {
    const p = span(t, 21, 23, sine)
    return {
      ...base(t),
      camera: {
        position: mixV([0.25, 0.3, 0.2], [0.12, 0.3, -0.25], p),
        target: [0.05, 0.95, -3.45],
        fov: 40,
      },
      spot: 0.9,
      beam: 0.4,
      candles: 0.4,
      exposure: 0.85 + flash(t) * 0.9,
    }
  }
  if (within(SHOT.rise)) {
    const p = span(t, SHOT.rise[0], SHOT.rise[1], Easing.in(Easing.quad))
    // The lamp stutters faster as the spin climbs
    const stutter = 0.75 + 0.25 * Math.cos(t * mix(6, 40, p))
    return {
      ...base(t),
      camera: {
        position: mixV([0, 0.15, 0.7], [0, 0.1, -0.3], p),
        target: [0, 0, -3.45],
        fov: mix(58, 44, p),
      },
      spot: stutter,
      candles: 1,
      exposure: 1 + p ** 4 * 0.9,
    }
  }
  return null
}
