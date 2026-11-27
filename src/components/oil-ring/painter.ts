/**
 * Lays a Stroke (brush.ts) onto a 2D canvas as oil paint, a little more each time it is asked: bristle by bristle,
 * each line toned lighter where its ridge faces the light and darker where it turns away, so the ring stands up off
 * the ground like a bead of impasto. Painting only ever adds, so each frame draws just the new length of stroke and
 * the paint still in flight; going backwards starts the canvas over.
 */
import {
  MAX_LAG,
  REACH,
  type Stroke,
  angleAt,
  makeStroke,
  paintAt,
  radiusAt,
  widthAt,
} from "./brush"

export interface OilPalette {
  /** The paint, darkest tone to lightest */
  tones: readonly string[]
  /** The glint on a ridge that faces the light */
  light: string
}

/**
 * Gilt: raw sienna through yellow ochre and Naples yellow to lead white, for a dark ground (the gallery's champagne
 * gold, as paint). Ink: near-black oil with a grey sheen, for paper.
 */
export const OIL = {
  gilt: {
    tones: ["#6e4a1c", "#9a6c2c", "#c0903f", "#dcb465", "#ecd497", "#f7ecd0"],
    light: "#fffbf0",
  },
  ink: {
    tones: ["#050505", "#0d0c0a", "#161512", "#201e1a", "#2b2925", "#3a3732"],
    light: "#9a958a",
  },
} as const satisfies Record<string, OilPalette>

export type OilTone = keyof typeof OIL

/** Light from the upper left, a little above */
const LIGHT = { x: -0.5, y: -0.866 }
/** Segments the whole stroke is drawn in */
const STEPS = 900
/** Pieces a tendril is drawn in, root to tip */
const FLICK_STEPS = 18
/** Distinct paint colours: tones are snapped to these, so no colour string is built while painting */
const LEVELS = 32

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

/** The palette's tones, spread evenly over `count` steps */
function ramp(tones: readonly string[], count: number) {
  const rgb = tones.map(hex)
  return Array.from({ length: count }, (_, i) => {
    const t = (i / (count - 1)) * (rgb.length - 1)
    const lo = rgb[Math.floor(t)]!
    const hi = rgb[Math.min(rgb.length - 1, Math.floor(t) + 1)]!
    const f = t - Math.floor(t)
    const mix = lo.map((v, k) => Math.round(v + (hi[k]! - v) * f))
    return `rgb(${mix.join(" ")})`
  })
}

/** Where a bristle is along the stroke when the brush head is at `head`; every bristle reaches the end at head 1 */
const bristleAt = (lag: number, head: number) =>
  Math.min(1, Math.max(0, head * (1 + MAX_LAG) - lag))

export class OilRingPainter {
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly stroke: Stroke
  private readonly levels: string[]
  private readonly light: string
  /** Device px per ring radius, and the centre */
  private readonly unit: number
  private readonly mid: number
  /** The stroke's geometry at each segment boundary, worked out once */
  private readonly cos = new Float32Array(STEPS + 1)
  private readonly sin = new Float32Array(STEPS + 1)
  private readonly radius = new Float32Array(STEPS + 1)
  private readonly width = new Float32Array(STEPS + 1)
  /** Next segment each bristle draws */
  private readonly next: Int32Array
  /** When each flick left the brush (NaN: not yet), and how far out it has been drawn */
  private readonly flung: Float64Array
  private readonly flown: Float32Array
  private flecks = 0
  private head = 0

  constructor(canvas: HTMLCanvasElement, seed: number, palette: OilPalette) {
    this.ctx = canvas.getContext("2d")
    this.stroke = makeStroke(seed)
    this.levels = ramp(palette.tones, LEVELS)
    this.light = palette.light
    this.mid = canvas.width / 2
    this.unit = this.mid / REACH
    for (let k = 0; k <= STEPS; k++) {
      const u = k / STEPS
      const a = angleAt(this.stroke, u)
      this.cos[k] = Math.cos(a)
      this.sin[k] = Math.sin(a)
      this.radius[k] = radiusAt(this.stroke, u)
      this.width[k] = widthAt(this.stroke, u)
    }
    this.next = new Int32Array(this.stroke.bristles.length)
    this.flung = new Float64Array(this.stroke.flicks.length).fill(NaN)
    this.flown = new Float32Array(this.stroke.flicks.length)
    if (this.ctx) {
      this.ctx.lineCap = "round"
      this.ctx.lineJoin = "round"
    }
  }

  /**
   * Paints up to `progress` (0 to 1 of the stroke) and moves any paint in flight on to time `now` (ms). Returns true
   * while paint is still flying, so the caller knows to ask again next frame even if the progress has not moved.
   */
  paint(progress: number, now: number) {
    const head = Math.min(1, Math.max(0, progress))
    if (head < this.head) this.reset()
    if (head > this.head) {
      this.lay(head)
      this.head = head
    }
    return this.fling(now)
  }

  reset() {
    this.ctx?.clearRect(0, 0, this.mid * 2, this.mid * 2)
    this.next.fill(0)
    this.flung.fill(NaN)
    this.flown.fill(0)
    this.flecks = 0
    this.head = 0
  }

  private tone(t: number) {
    const i = Math.round(Math.min(1, Math.max(0, t)) * (LEVELS - 1))
    return this.levels[i]!
  }

  /** Every bristle's line, from where it stopped last time to where `head` brings it */
  private lay(head: number) {
    const ctx = this.ctx
    if (!ctx) return
    const { unit, mid } = this
    this.stroke.bristles.forEach((b, i) => {
      const end = Math.floor(bristleAt(b.lag, head) * STEPS)
      const edge = Math.min(1, Math.abs(b.offset) * 2.2) * Math.sign(b.offset)
      for (let k = this.next[i]!; k < end; k++) {
        const u = (k + 0.5) / STEPS
        const paint = paintAt(b, u)
        if (paint < 0.03) continue
        const w = this.width[k]!
        const r0 = this.radius[k]! + b.offset * w
        const r1 = this.radius[k + 1]! + b.offset * this.width[k + 1]!
        const x0 = mid + r0 * this.cos[k]! * unit
        const y0 = mid + r0 * this.sin[k]! * unit
        const x1 = mid + r1 * this.cos[k + 1]! * unit
        const y1 = mid + r1 * this.sin[k + 1]! * unit
        // How squarely this bristle's ridge faces the light: the outer edge on the upper left, the inner on the lower right
        const facing = (this.cos[k]! * LIGHT.x + this.sin[k]! * LIGHT.y) * edge
        const lineWidth = Math.max(0.6, b.share * w * unit)
        // A brush loaded with more than one paint: each bristle's colour drifts as the paints mix along the stroke
        const mixed =
          b.tone + 0.22 * Math.sin(u * (3 + (b.phase % 4)) + b.phase)

        ctx.globalAlpha = paint
        ctx.strokeStyle = this.tone(mixed + 0.42 * facing)
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()

        // The groove a bristle cuts, darker, on every third bristle
        if (i % 3 === 0 && paint > 0.5) {
          ctx.globalAlpha = 0.55 * paint
          ctx.strokeStyle = this.tone(mixed - 0.45)
          ctx.lineWidth = Math.max(0.5, lineWidth * 0.2)
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
        }

        // Light catches the ridges that face it, not evenly but in glints where the paint stands highest
        const glint =
          Math.sin(u * 150 + b.phase * 3) * Math.sin(u * 37 + b.phase)
        if (facing > 0.25 && paint > 0.3 && glint > -0.1) {
          const lift = lineWidth * 0.3
          ctx.globalAlpha =
            Math.min(0.9, (facing - 0.25) * 1.4) *
            paint *
            Math.min(1, glint + 0.3)
          ctx.strokeStyle = this.light
          ctx.lineWidth = lineWidth * 0.3
          ctx.beginPath()
          ctx.moveTo(x0 + LIGHT.x * lift, y0 + LIGHT.y * lift)
          ctx.lineTo(x1 + LIGHT.x * lift, y1 + LIGHT.y * lift)
          ctx.stroke()
        }
      }
      this.next[i] = Math.max(this.next[i]!, end)
    })

    // Spatter the brush passes
    const flecks = this.stroke.flecks
    while (this.flecks < flecks.length && flecks[this.flecks]!.at <= head) {
      const f = flecks[this.flecks++]!
      const a = angleAt(this.stroke, f.at)
      const r = radiusAt(this.stroke, f.at) + f.off
      ctx.globalAlpha = 0.9
      ctx.fillStyle = this.tone(f.tone)
      ctx.beginPath()
      ctx.arc(
        mid + r * Math.cos(a) * unit,
        mid + r * Math.sin(a) * unit,
        Math.max(0.5, f.radius * unit),
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /** Tendrils the brush has passed fly out over their own time, tapering, and drop beads of paint past their tips */
  private fling(now: number) {
    const ctx = this.ctx
    if (!ctx) return false
    const { unit, mid, stroke } = this
    let flying = false
    stroke.flicks.forEach((f, i) => {
      if (f.at > this.head) return
      if (Number.isNaN(this.flung[i])) this.flung[i] = now
      const done = this.flown[i]!
      if (done >= 1) return
      const g = Math.min(1, (now - this.flung[i]!) / f.grow)
      const reach = 1 - (1 - g) ** 2.2
      if (g < 1) flying = true

      const a = angleAt(stroke, f.at)
      const n = { x: Math.cos(a) * f.side, y: Math.sin(a) * f.side }
      const t = { x: -Math.sin(a), y: Math.cos(a) }
      const dir = {
        x: n.x * Math.cos(f.lean) + t.x * Math.sin(f.lean),
        y: n.y * Math.cos(f.lean) + t.y * Math.sin(f.lean),
      }
      const side = { x: -dir.y, y: dir.x }
      const root =
        radiusAt(stroke, f.at) + f.side * 0.36 * widthAt(stroke, f.at)
      const base = { x: root * Math.cos(a), y: root * Math.sin(a) }
      const at = (s: number) => {
        const sway = f.bend * s * s + f.curl * s * s * s
        return {
          x: mid + (base.x + (dir.x * s + side.x * sway) * f.length) * unit,
          y: mid + (base.y + (dir.y * s + side.y * sway) * f.length) * unit,
        }
      }
      const thick = f.width * widthAt(stroke, f.at) * unit

      ctx.strokeStyle = this.tone(f.tone)
      ctx.globalAlpha = 0.95
      for (
        let s = Math.floor(done * FLICK_STEPS) / FLICK_STEPS;
        s < reach - 1e-6;
        s += 1 / FLICK_STEPS
      ) {
        const s0 = Math.max(s, done)
        const s1 = Math.min(reach, s + 1 / FLICK_STEPS)
        const p0 = at(s0)
        const p1 = at(s1)
        ctx.lineWidth = Math.max(0.5, thick * (1 - (s0 + s1) / 2) ** 1.4)
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
      this.flown[i] = g < 1 ? reach : 1

      if (g >= 1) {
        const tip = at(1)
        for (const d of f.drops) {
          const x = tip.x + (dir.x * d.along + side.x * d.aside) * unit
          const y = tip.y + (dir.y * d.along + side.y * d.aside) * unit
          const r = Math.max(0.6, d.radius * unit)
          ctx.globalAlpha = 0.95
          ctx.fillStyle = this.tone(f.tone)
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 0.55
          ctx.fillStyle = this.light
          ctx.beginPath()
          ctx.arc(
            x + LIGHT.x * r * 0.4,
            y + LIGHT.y * r * 0.4,
            r * 0.35,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }
    })
    ctx.globalAlpha = 1
    return flying
  }
}
