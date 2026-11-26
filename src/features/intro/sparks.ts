/**
 * Sparks for the entry loader, in two layers:
 *
 * - ParticlePool: the physics, with no DOM, so it is unit-tested. A fixed pool stored struct-of-arrays in one
 *   Float32Array: a burst allocates nothing and garbage collection never lands mid-animation. (The 3D gallery this
 *   borrows from made one DOM node per spark; at a hundred sparks that is a hundred layers to style and composite.)
 * - Sparks: draws the pool on a 2D canvas. Each spark is a short streak along its velocity, a thin bright core over a
 *   wide faint halo, which reads as a hot fleck of metal rather than a dot. Gravity and drag bend it into an arc.
 */
export const CAPACITY = 360
const FIELDS = 7
const [X, Y, VX, VY, AGE, LIFE, SIZE] = [0, 1, 2, 3, 4, 5, 6] as const

/** px per ms², a gentle fall: sparks arc rather than drop */
const GRAVITY = 0.00065
/** Fraction of velocity kept per ms */
const DRAG = 0.9985
/** Streak length, in ms of travel behind the spark */
const TRAIL_MS = 26
/** Halo width and strength relative to the core */
const HALO_WIDTH = 4
const HALO_ALPHA = 0.16

type Range = readonly [number, number]

/** How a spray leaves its source; where it leaves from is given per emit */
export interface Spray {
  /** Direction in radians (0 = right, -π/2 = up) and the spread around it */
  angle: number
  spread: number
  /** px per ms */
  speed: Range
  /** ms */
  life: Range
  /** px */
  size: Range
}

export interface Source {
  x: number
  y: number
  /** Horizontal jitter around x, in px */
  width?: number
}

export class ParticlePool {
  readonly state = new Float32Array(CAPACITY * FIELDS)
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
  emit(n: number, from: Source, spray: Spray) {
    const rnd = this.random
    const between = ([min, max]: Range) => min + rnd() * (max - min)
    for (let k = 0; k < n && this.live < CAPACITY; k++) {
      const p = this.live++
      const i = p * FIELDS
      const angle = spray.angle + (rnd() - 0.5) * spray.spread
      const speed = between(spray.speed)
      this.state[i + X] = from.x + (rnd() - 0.5) * (from.width ?? 0)
      this.state[i + Y] = from.y
      this.state[i + VX] = Math.cos(angle) * speed
      this.state[i + VY] = Math.sin(angle) * speed
      this.state[i + AGE] = 0
      this.state[i + LIFE] = between(spray.life)
      this.state[i + SIZE] = between(spray.size)
      this.tone[p] = Math.min(this.tones - 1, Math.floor(rnd() * this.tones))
    }
  }

  /** Advance by dt ms; expired sparks are swap-removed, so the live ones stay packed at the front */
  step(dt: number) {
    const s = this.state
    const keep = DRAG ** dt
    for (let p = 0; p < this.live;) {
      const i = p * FIELDS
      s[i + AGE]! += dt
      if (s[i + AGE]! >= s[i + LIFE]!) {
        const last = --this.live
        s.copyWithin(i, last * FIELDS, last * FIELDS + FIELDS)
        this.tone[p] = this.tone[last]!
        continue
      }
      s[i + VY]! += GRAVITY * dt
      s[i + VX]! *= keep
      s[i + VY]! *= keep
      s[i + X]! += s[i + VX]! * dt
      s[i + Y]! += s[i + VY]! * dt
      p++
    }
  }

  clear() {
    this.live = 0
  }

  /** One spark as an object, for tests and debugging; the renderer reads `state` directly and allocates nothing */
  read(p: number) {
    const i = p * FIELDS
    const s = this.state
    return {
      x: s[i + X]!,
      y: s[i + Y]!,
      vx: s[i + VX]!,
      vy: s[i + VY]!,
      t: s[i + AGE]! / s[i + LIFE]!,
      size: s[i + SIZE]!,
      tone: this.tone[p]!,
    }
  }
}

export class Sparks {
  private readonly pool: ParticlePool
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly colours: readonly string[]
  /** Additive light on a dark ground; on paper the sparks are dark metal dust and simply paint over */
  private readonly additive: boolean

  constructor(
    canvas: HTMLCanvasElement,
    colours: readonly string[],
    additive: boolean
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.colours = colours
    this.additive = additive
    this.pool = new ParticlePool(colours.length)
    this.resize()
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  emit(n: number, from: Source, spray: Spray) {
    this.pool.emit(n, from, spray)
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
    ctx.lineCap = "round"
    const s = this.pool.state
    for (let p = 0; p < this.pool.count; p++) {
      const i = p * FIELDS
      const x = s[i + X]!
      const y = s[i + Y]!
      const vx = s[i + VX]!
      const vy = s[i + VY]!
      const t = s[i + AGE]! / s[i + LIFE]!
      const size = s[i + SIZE]!
      const tone = this.pool.tone[p]!
      const fade = (1 - t) ** 1.6
      const width = size * (1 - t * 0.6)
      ctx.strokeStyle = this.colours[tone]!
      ctx.beginPath()
      ctx.moveTo(x - vx * TRAIL_MS, y - vy * TRAIL_MS)
      ctx.lineTo(x, y)
      ctx.globalAlpha = fade * HALO_ALPHA
      ctx.lineWidth = width * HALO_WIDTH
      ctx.stroke()
      ctx.globalAlpha = fade
      ctx.lineWidth = width
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}
