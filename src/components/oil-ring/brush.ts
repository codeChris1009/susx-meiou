/**
 * One stroke of oil paint laid round a circle, as data: where the brush travels, how hard it presses, how each
 * bristle carries paint until it runs dry, and where paint flicks off in tendrils and drops. Seeded, so the same seed
 * paints the same ring, and free of the canvas, so it can be tested. Lengths are in units of the ring's radius;
 * `u` is how far along the stroke, 0 where the brush lands to 1 where it lifts.
 */

export interface Bristle {
  /** Place across the stroke, -0.5 on the inner edge to 0.5 on the outer */
  offset: number
  /** Width of its line, as a share of the stroke's width; the shares overlap so the body reads solid */
  share: number
  /** Which paint it picked up, 0 the darkest tone to 1 the lightest */
  tone: number
  /** Paint it starts with; it skips (dry brush) once the stroke's dryness overtakes it */
  load: number
  /** Where it first touches the ground: the edges land a little after the middle, so the stroke starts round */
  land: number
  /** How far it trails the head, in u: the edge bristles drag behind, so the head is round, not cut square */
  lag: number
  /** Phase of the streaks along its line */
  phase: number
}

export interface Drop {
  /** Beyond the tendril's tip, along its direction */
  along: number
  /** Off to the side of that line */
  aside: number
  radius: number
}

/** Paint thrown off the brush: a tapering tendril, and drops past its tip */
export interface Flick {
  at: number
  /** 1 thrown outward, -1 inward */
  side: 1 | -1
  length: number
  /** Lean toward the direction of travel, in radians off the normal: paint is flung forward */
  lean: number
  /** Curvature, as a share of the length the tip drifts sideways */
  bend: number
  /** A second, later turn the other way: tendrils of thrown paint whip, they do not arc */
  curl: number
  /** Width at the root, as a share of the stroke's width there */
  width: number
  tone: number
  /** How long it takes to fly out, in ms */
  grow: number
  drops: readonly Drop[]
}

/** A fleck of spatter beside the stroke */
export interface Fleck {
  at: number
  /** Distance off the stroke's centre line, signed (outward positive) */
  off: number
  radius: number
  tone: number
}

/** Where the brush bears down and the paint pools */
export interface Swell {
  at: number
  gain: number
  spread: number
}

export interface Stroke {
  /** Angle where the brush lands, radians, clockwise from 3 o'clock on screen */
  start: number
  /** Angle travelled: a little over a turn, so the tail runs past the head and the ring closes */
  sweep: number
  /** Stroke width where the pressure is 1 */
  width: number
  /** How far outward the tail has drifted by the end, so it passes beside the head instead of over it */
  drift: number
  wobble: readonly { k: number; amp: number; phase: number }[]
  swells: readonly Swell[]
  bristles: readonly Bristle[]
  flicks: readonly Flick[]
  flecks: readonly Fleck[]
}

/** mulberry32: small, fast, and the same sequence for the same seed everywhere */
export function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * The brush's pace through a stroke, time share → distance share: it lands slowly, gathers speed, sweeps fastest two
 * thirds of the way round and slows to close. The same slow-fast-slow as the site's loader.
 */
export function pace(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 0.15 * x + 0.85 * (4 * x ** 3 - 3 * x ** 4)
}

const BRISTLES = 26
/** Paint never reaches further than this from the centre (flicks and drops included): the canvas is sized to it */
export const REACH = 1.75
/** The longest any bristle trails the head (see Bristle.lag) */
export const MAX_LAG = 0.018

export function makeStroke(seed: number): Stroke {
  const rnd = random(seed)
  const between = (lo: number, hi: number) => lo + (hi - lo) * rnd()

  // Where the brush bears down paint pools in masses; where it lifts the line runs thin
  const swells: Swell[] = [
    ...Array.from({ length: 2 + Math.floor(rnd() * 2) }, () => ({
      at: between(0.06, 0.86),
      gain: between(0.7, 1.7),
      spread: between(0.025, 0.075),
    })),
    ...Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => ({
      at: between(0.1, 0.8),
      gain: between(-0.5, -0.3),
      spread: between(0.04, 0.09),
    })),
  ]
  const masses = swells.filter((w) => w.gain > 0)

  const bristles: Bristle[] = Array.from({ length: BRISTLES }, (_, i) => {
    const offset = (i + 0.5) / BRISTLES - 0.5 + between(-0.4, 0.4) / BRISTLES
    return {
      offset,
      share: between(1.3, 2.4) / BRISTLES,
      tone: Math.min(1, Math.max(0, 0.5 + (rnd() + rnd() - 1) * 0.85)),
      load: between(0.6, 1),
      land: between(0, 0.012) + 0.03 * Math.abs(2 * offset) ** 2,
      lag: 0.014 * (2 * offset) ** 2 + between(0, 0.004),
      phase: between(0, 100),
    }
  })

  // Paint flies where it pooled: most flicks start near a swell, the rest anywhere along the stroke
  const flicks: Flick[] = Array.from(
    { length: 9 + Math.floor(rnd() * 6) },
    () => {
      const near = masses[Math.floor(rnd() * masses.length)]!
      const at =
        rnd() < 0.6
          ? near.at + between(-1, 1) * near.spread * 1.6
          : between(0.03, 0.95)
      const long = rnd() < 0.35
      return {
        at: Math.min(0.97, Math.max(0.02, at)),
        side: rnd() < 0.65 ? (1 as const) : (-1 as const),
        length: long ? between(0.26, 0.44) : between(0.08, 0.22),
        lean: between(0.15, 0.95),
        bend: between(-0.6, 0.6),
        curl: between(-0.5, 0.5),
        width: between(0.1, 0.3),
        tone: between(0.3, 1),
        grow: between(170, 380),
        drops: Array.from({ length: Math.floor(rnd() * 5) }, () => ({
          along: between(0.02, 0.15),
          aside: between(-0.04, 0.04),
          radius: between(0.006, 0.022),
        })),
      }
    }
  ).sort((a, b) => a.at - b.at)

  // Spatter gathers round the masses, as it does round the heavy parts of an ink logogram; a little falls anywhere
  const flecks: Fleck[] = Array.from({ length: 70 }, () => {
    const side = rnd() < 0.6 ? 1 : -1
    const near = masses[Math.floor(rnd() * masses.length)]!
    const clustered = rnd() < 0.7
    return {
      at: clustered
        ? near.at + (rnd() + rnd() - 1) * near.spread * 2.2
        : between(0.02, 0.98),
      off: side * (clustered ? between(0.06, 0.3) : between(0.1, 0.4)),
      radius: rnd() < 0.15 ? between(0.014, 0.03) : between(0.003, 0.012),
      tone: rnd(),
    }
  })
    .map((f) => ({ ...f, at: Math.min(0.99, Math.max(0.01, f.at)) }))
    .sort((a, b) => a.at - b.at)

  return {
    start: -Math.PI / 2 - between(0.2, 0.7),
    sweep: Math.PI * 2 + between(0.1, 0.22),
    width: between(0.085, 0.11),
    drift: between(0.04, 0.07),
    wobble: [2, 3, 5].map((k) => ({
      k,
      amp: between(0.006, 0.016) / Math.sqrt(k / 2),
      phase: between(0, Math.PI * 2),
    })),
    swells,
    bristles,
    flicks,
    flecks,
  }
}

export function angleAt(s: Stroke, u: number) {
  return s.start + s.sweep * u
}

/** Distance of the stroke's centre line from the ring's centre: a hand's circle, never quite round */
export function radiusAt(s: Stroke, u: number) {
  const a = angleAt(s, u)
  let r = 1 + s.drift * u * u
  for (const w of s.wobble) r += w.amp * Math.sin(w.k * a + w.phase)
  return r
}

/** Width of the stroke: a quick press on landing, pools where it swells, thinning as paint runs out, a tapered lift */
export function widthAt(s: Stroke, u: number) {
  const land = 0.35 + 0.65 * smoothstep(0, 0.06, u)
  const spend = 1.15 - 0.45 * u
  const lift = 1 - 0.72 * smoothstep(0.88, 1, u)
  let pool = 1
  for (const w of s.swells)
    pool += w.gain * Math.exp(-(((u - w.at) / w.spread) ** 2))
  return s.width * land * spend * lift * Math.max(0.3, pool)
}

/** How dry the brush has run by u: wet through most of the turn, then quickly broken into streaks */
export function dryness(u: number) {
  return 0.12 + 0.95 * Math.max(0, u) ** 2.6
}

/** Paint a bristle lays at u, 0 to 1: zero where it skips and leaves the ground showing */
export function paintAt(b: Bristle, u: number) {
  if (u < b.land) return 0
  const streak =
    Math.sin(u * 61 + b.phase) * Math.sin(u * 23 + b.phase * 1.7) * 0.28
  return smoothstep(-0.04, 0.24, b.load - dryness(u) + streak)
}

/** A point of the stroke at u, `across` its width (-0.5 inner edge to 0.5 outer), in ring radii from the centre */
export function pointAt(s: Stroke, u: number, across: number) {
  const a = angleAt(s, u)
  const r = radiusAt(s, u) + across * widthAt(s, u)
  return { x: r * Math.cos(a), y: r * Math.sin(a) }
}

/** How far the paint reaches from the centre at most, flicks and drops included, to size the canvas around it */
export function reach(s: Stroke) {
  let far = 1 + s.drift
  for (const f of s.flicks) {
    if (f.side < 0) continue
    const drop = Math.max(0, ...f.drops.map((d) => d.along + d.radius))
    far = Math.max(far, 1.05 + f.length + drop)
  }
  return far + 0.08
}
