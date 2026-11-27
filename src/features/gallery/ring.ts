/**
 * The ring's geometry, kept free of three.js so it can be tested: pieces stand on a circle around the camera, facing
 * it, and the ring turns so one piece at a time stands in front.
 */
export const TAU = Math.PI * 2

/** Angle that brings piece `index` to the front */
export function angleFor(index: number, count: number) {
  return -(index / count) * TAU
}

/** The same angle, unwound to the turn nearest `current`, so the ring always takes the short way round */
export function nearestAngle(current: number, index: number, count: number) {
  const base = angleFor(index, count)
  return base + Math.round((current - base) / TAU) * TAU
}

/** Which piece is in front at ring angle `angle` */
export function indexAt(angle: number, count: number) {
  const i = Math.round((-angle / TAU) * count)
  return ((i % count) + count) % count
}

/** A piece's angle off the front, folded into (-π, π] */
export function offFront(ringAngle: number, index: number, count: number) {
  const a = ringAngle + (index / count) * TAU
  return a - Math.ceil((a - Math.PI) / TAU) * TAU
}

/** 1 in front, falling smoothly to 0 one step away: how much a piece is "the" piece */
export function focusOf(off: number, count: number) {
  const t = Math.min(1, Math.abs(off) / (TAU / count))
  return 1 - t * t * (3 - 2 * t)
}

/** A piece's width over its height (the frames are 1200×800) */
export const ART_ASPECT = 1.5

/**
 * Radius, in piece heights, of a circle centred at (u, v) on a piece (texture coordinates) that covers the whole
 * piece: out to its farthest corner, with room for a ragged edge
 */
export function coverFrom(u: number, v: number) {
  const across = Math.max(u, 1 - u) * ART_ASPECT
  const up = Math.max(v, 1 - v)
  return Math.hypot(across, up) + 0.08
}

/** Front-piece share of the view width, from a phone held upright to a wide screen */
const TALL = { aspect: 0.7, coverage: 0.88 }
const WIDE = { aspect: 1.6, coverage: 0.4 }
const FOV_RANGE = [30, 78] as const

/**
 * Vertical field of view that makes the front piece fill `coverage` of the view's width at `distance`: about 40% on a
 * wide screen, so neighbours show at the sides, and nearly all of it on a phone held upright.
 */
export function fitFov(aspect: number, width: number, distance: number) {
  const t = Math.min(
    1,
    Math.max(0, (aspect - TALL.aspect) / (WIDE.aspect - TALL.aspect))
  )
  const coverage = TALL.coverage + (WIDE.coverage - TALL.coverage) * t
  const halfH = Math.atan(width / (2 * distance * coverage))
  const fov = 2 * Math.atan(Math.tan(halfH) / aspect) * (180 / Math.PI)
  return Math.min(FOV_RANGE[1], Math.max(FOV_RANGE[0], fov))
}

/** A piece's frame on screen, px: its centre and size */
export interface FrameRect {
  x: number
  y: number
  w: number
  h: number
}

/** Whether a ring of radius `r` round (px, py) touches the frame: the cursor's outer edge on it counts */
export function ringTouches(px: number, py: number, r: number, f: FrameRect) {
  const dx = Math.max(Math.abs(px - f.x) - f.w / 2, 0)
  const dy = Math.max(Math.abs(py - f.y) - f.h / 2, 0)
  return dx * dx + dy * dy <= r * r
}
