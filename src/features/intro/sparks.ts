/**
 * Sparks for the entry loader, after the 3D gallery's intro (demo-3js-Gallery0): round embers of warm light, a bright
 * core in a soft glow, that fly straight out from where they are thrown, slowing as they go, shrinking and fading. Two
 * layers:
 *
 * - ParticlePool: the motion, with no DOM, so it is unit-tested. A fixed pool stored struct-of-arrays in one
 *   Float32Array, so a burst allocates nothing. A spark's place is a pure function of its age (origin + travel ×
 *   flight(t)), as the gallery's CSS keyframes were: a dropped frame can never fling one.
 * - Sparks: draws the pool on a 2D canvas from glow sprites rendered once per colour (the gallery made one DOM node with
 *   a box-shadow per spark; at a hundred sparks that is a hundred layers to composite).
 */
export const CAPACITY = 420
const FIELDS = 8
const [X, Y, DX, DY, AGE, LIFE, SIZE, END] = [0, 1, 2, 3, 4, 5, 6, 7] as const

/** Where an edge spark starts, outside the box: the gallery's 6–18px */
const EDGE_GAP: Range = [6, 18]

type Range = readonly [number, number]

/** A rectangle in viewport px */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/** How sparks leave a box */
export interface Spray {
  /** "area": from anywhere inside it, toward `angle`. "edge": from just outside one of its sides, straight out */
  from: "area" | "edge"
  /** Radians, 0 = right, -π/2 = up. Area sprays only */
  angle?: number
  /** Scatter around the direction, in radians (2π: all round) */
  spread: number
  /** px travelled over the whole life */
  distance: Range
  /** ms */
  life: Range
  /** Core diameter, px */
  size: Range
  /** Scale at the end of the flight */
  end: number
  /** A cool outer halo, as on the gallery's frame sparks */
  halo?: boolean
}

/** The flight: CSS ease-out, near enough. Fast off the mark, slowing to a drift */
export const flight = (t: number) => 1 - (1 - t) ** 2
/** Brightness over the life: the flash, then a long fade */
export const fade = (t: number) => (1 - t) ** 1.6

export class ParticlePool {
  readonly state = new Float32Array(CAPACITY * FIELDS)
  /** Index into the renderer's sprites: a colour, plus `tones` for its halo variant */
  readonly tone = new Uint8Array(CAPACITY)
  private live = 0
  private readonly tones: number
  private readonly random: () => number

  constructor(tones: number, random: () => number = Math.random) {
    this.tones = tones
    this.random = random
  }

  get count() {
    return this.live
  }

  /** Adds up to n sparks; past CAPACITY the extra are dropped, never an old spark cut short */
  emit(n: number, box: Box, spray: Spray) {
    const rnd = this.random
    const between = ([min, max]: Range) => min + rnd() * (max - min)
    for (let k = 0; k < n && this.live < CAPACITY; k++) {
      let x: number
      let y: number
      let angle: number
      if (spray.from === "edge") {
        const side = Math.min(3, Math.floor(rnd() * 4))
        const gap = between(EDGE_GAP)
        const along = rnd()
        // top, right, bottom, left; each sends its sparks out along its normal
        const normal = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][side]!
        x =
          side === 1
            ? box.left + box.width + gap
            : side === 3
              ? box.left - gap
              : box.left + along * box.width
        y =
          side === 0
            ? box.top - gap
            : side === 2
              ? box.top + box.height + gap
              : box.top + along * box.height
        angle = normal + (rnd() - 0.5) * spray.spread
      } else {
        x = box.left + rnd() * box.width
        y = box.top + rnd() * box.height
        angle = (spray.angle ?? 0) + (rnd() - 0.5) * spray.spread
      }
      const distance = between(spray.distance)
      const p = this.live++
      const i = p * FIELDS
      this.state[i + X] = x
      this.state[i + Y] = y
      this.state[i + DX] = Math.cos(angle) * distance
      this.state[i + DY] = Math.sin(angle) * distance
      this.state[i + AGE] = 0
      this.state[i + LIFE] = between(spray.life)
      this.state[i + SIZE] = between(spray.size)
      this.state[i + END] = spray.end
      const colour = Math.min(this.tones - 1, Math.floor(rnd() * this.tones))
      this.tone[p] = colour + (spray.halo ? this.tones : 0)
    }
  }

  /** Ages every spark by dt ms; expired ones are swap-removed, so the live ones stay packed at the front */
  step(dt: number) {
    const s = this.state
    for (let p = 0; p < this.live;) {
      const i = p * FIELDS
      s[i + AGE]! += Math.max(0, dt)
      if (s[i + AGE]! >= s[i + LIFE]!) {
        const last = --this.live
        s.copyWithin(i, last * FIELDS, last * FIELDS + FIELDS)
        this.tone[p] = this.tone[last]!
        continue
      }
      p++
    }
  }

  clear() {
    this.live = 0
  }

  /** Spark p as drawn: where it is, how large and how bright */
  read(p: number) {
    const i = p * FIELDS
    const s = this.state
    const t = s[i + AGE]! / s[i + LIFE]!
    const f = flight(t)
    return {
      x: s[i + X]! + s[i + DX]! * f,
      y: s[i + Y]! + s[i + DY]! * f,
      /** Core diameter now, px */
      size: s[i + SIZE]! * (1 + (s[i + END]! - 1) * f),
      alpha: fade(t),
      tone: this.tone[p]!,
    }
  }
}

/** Sprite radius as a multiple of the core diameter: the glow reaches about three cores out */
const GLOW = 3
/** Halo sprites are drawn this much larger, the cool ring outside the warm glow */
const HALO_SCALE = 1.45
const SPRITE_PX = 64

function rgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(h.slice(at, at + 2), 16))
  const own = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return `rgba(${r}, ${g}, ${b}, ${(alpha * own).toFixed(3)})`
}

/** One ember: a solid core and a glow falling away from it; on ink it glows wide, on paper it stays close */
function sprite(colour: string, wide: boolean, halo: string | null) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = SPRITE_PX
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  const r = SPRITE_PX / 2
  // The warm part fills the whole sprite, or its inner share when a halo surrounds it
  const reach = halo ? 1 / HALO_SCALE : 1
  if (halo) {
    const cool = ctx.createRadialGradient(r, r, 0, r, r, r)
    // Faint: halos overlap and add up, and a hundred of them at full strength read as fog
    cool.addColorStop(0, rgba(halo, 0.16))
    cool.addColorStop(0.5, rgba(halo, 0.05))
    cool.addColorStop(1, rgba(halo, 0))
    ctx.fillStyle = cool
    ctx.fillRect(0, 0, SPRITE_PX, SPRITE_PX)
  }
  const core = 0.5 / GLOW
  const warm = ctx.createRadialGradient(r, r, 0, r, r, r * reach)
  warm.addColorStop(0, rgba(colour, 1))
  warm.addColorStop(core * 0.8, rgba(colour, 1))
  warm.addColorStop(core * 1.25, rgba(colour, wide ? 0.55 : 0.4))
  warm.addColorStop(0.45, rgba(colour, wide ? 0.16 : 0.06))
  warm.addColorStop(1, rgba(colour, 0))
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, SPRITE_PX, SPRITE_PX)
  return canvas
}

export class Sparks {
  private readonly pool: ParticlePool
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly sprites: HTMLCanvasElement[]
  /** Additive light on ink; on paper the gilt simply paints over */
  private readonly additive: boolean

  /**
   * @param colours  the spark palette (EMBER.dark or EMBER.light)
   * @param halo  colour of the cool halo some sprays carry, or null for none (paper)
   */
  constructor(
    canvas: HTMLCanvasElement,
    colours: readonly string[],
    halo: string | null,
    additive: boolean
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.additive = additive
    this.pool = new ParticlePool(colours.length)
    const plain = colours.map((c) => sprite(c, additive, null))
    this.sprites = [
      ...plain,
      ...(halo ? colours.map((c) => sprite(c, additive, halo)) : plain),
    ]
    this.resize()
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /** Sparks still in the air */
  get live() {
    return this.pool.count
  }

  emit(n: number, box: Box, spray: Spray) {
    this.pool.emit(n, box, spray)
  }

  /** Advance by dt ms and redraw */
  step(dt: number) {
    this.pool.step(dt)
    this.draw()
  }

  clear() {
    this.pool.clear()
    this.ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }

  private draw() {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.globalCompositeOperation = this.additive ? "lighter" : "source-over"
    const half = this.sprites.length / 2
    for (let p = 0; p < this.pool.count; p++) {
      const { x, y, size, alpha, tone } = this.pool.read(p)
      const r = size * GLOW * (tone >= half ? HALO_SCALE : 1)
      ctx.globalAlpha = alpha
      ctx.drawImage(this.sprites[tone]!, x - r, y - r, r * 2, r * 2)
    }
    ctx.globalAlpha = 1
  }
}
