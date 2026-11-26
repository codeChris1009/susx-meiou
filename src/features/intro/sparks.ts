/**
 * Sparks for the entry loader: one 2D canvas and a fixed pool of particles stored struct-of-arrays in a Float32Array,
 * so a burst allocates nothing and garbage collection never lands mid-animation. (The 3D gallery this borrows from made
 * one DOM node per spark; at a hundred sparks that is a hundred layers to style, composite and remove.)
 *
 * A spark is drawn as a short streak along its velocity, a thin bright core over a wide faint halo, which reads as a hot
 * fleck of metal rather than a dot. Gravity and drag bend the streaks into arcs as they cool.
 */
const CAPACITY = 360
const FIELDS = 7
const [X, Y, VX, VY, AGE, LIFE, SIZE] = [0, 1, 2, 3, 4, 5, 6] as const

/** px per ms², a gentle fall: sparks arc rather than drop */
const GRAVITY = 0.00065
/** Fraction of velocity kept per ms */
const DRAG = 0.9985
/** Streak length, in ms of travel behind the spark */
const TRAIL_MS = 26

export interface Emission {
  x: number
  y: number
  /** Horizontal jitter around x, in px */
  width?: number
  /** Direction in radians (0 = right, -π/2 = up) and the spread around it */
  angle: number
  spread: number
  speed: readonly [number, number]
  life: readonly [number, number]
  size: readonly [number, number]
}

const between = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min)

export class Sparks {
  private readonly state = new Float32Array(CAPACITY * FIELDS)
  private readonly hue = new Uint8Array(CAPACITY)
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly canvas: HTMLCanvasElement
  private readonly colours: readonly string[]
  /** Additive light on a dark ground; on paper the sparks are dark metal dust and simply paint over */
  private readonly additive: boolean
  private count = 0

  constructor(
    canvas: HTMLCanvasElement,
    colours: readonly string[],
    additive: boolean
  ) {
    this.canvas = canvas
    this.colours = colours
    this.additive = additive
    this.ctx = canvas.getContext("2d")
    this.resize()
  }

  get alive() {
    return this.count
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  emit(n: number, e: Emission) {
    for (let k = 0; k < n && this.count < CAPACITY; k++) {
      const i = this.count++ * FIELDS
      const angle = e.angle + (Math.random() - 0.5) * e.spread
      const speed = between(e.speed)
      this.state[i + X] = e.x + (Math.random() - 0.5) * (e.width ?? 0)
      this.state[i + Y] = e.y
      this.state[i + VX] = Math.cos(angle) * speed
      this.state[i + VY] = Math.sin(angle) * speed
      this.state[i + AGE] = 0
      this.state[i + LIFE] = between(e.life)
      this.state[i + SIZE] = between(e.size)
      this.hue[this.count - 1] = Math.floor(Math.random() * this.colours.length)
    }
  }

  /** Advance by dt ms and redraw */
  step(dt: number) {
    const s = this.state
    const keep = DRAG ** dt
    for (let p = 0; p < this.count;) {
      const i = p * FIELDS
      s[i + AGE]! += dt
      if (s[i + AGE]! >= s[i + LIFE]!) {
        // Swap-remove: the last spark takes this slot, so the live ones stay packed
        const last = --this.count
        s.copyWithin(i, last * FIELDS, last * FIELDS + FIELDS)
        this.hue[p] = this.hue[last]!
        continue
      }
      s[i + VY]! += GRAVITY * dt
      s[i + VX]! *= keep
      s[i + VY]! *= keep
      s[i + X]! += s[i + VX]! * dt
      s[i + Y]! += s[i + VY]! * dt
      p++
    }
    this.draw()
  }

  private draw() {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.globalCompositeOperation = this.additive ? "lighter" : "source-over"
    ctx.lineCap = "round"
    const s = this.state
    for (let p = 0; p < this.count; p++) {
      const i = p * FIELDS
      const t = s[i + AGE]! / s[i + LIFE]!
      const fade = (1 - t) ** 1.6
      const x = s[i + X]!
      const y = s[i + Y]!
      const tailX = x - s[i + VX]! * TRAIL_MS
      const tailY = y - s[i + VY]! * TRAIL_MS
      const size = s[i + SIZE]! * (1 - t * 0.6)
      ctx.strokeStyle = this.colours[this.hue[p]!]!
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(x, y)
      ctx.globalAlpha = fade * 0.16
      ctx.lineWidth = size * 4
      ctx.stroke()
      ctx.globalAlpha = fade
      ctx.lineWidth = size
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  clear() {
    this.count = 0
    this.ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}
