/**
 * Sparks for the trailers, after the 3D gallery's (demo-3js-Gallery0 cursor.js) and the site's loader: round embers, a
 * bright core in a soft glow, flying straight out and slowing, shrinking and fading.
 *
 * Unlike the site's pool, nothing here is stateful: a spark is a pure function of its burst, its index and the time, so
 * any frame can be drawn on its own, in any order. A Stream is unrolled into Bursts once, ahead of time.
 */
import { useLayoutEffect, useMemo, useRef } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"

import { between, generator } from "./random"

type Range = readonly [number, number]

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface Spray {
  /** "area": anywhere inside the box, toward angle. "edge": just outside a side, straight out */
  from: "area" | "edge"
  angle?: number
  spread: number
  distance: Range
  /** seconds */
  life: Range
  /** core diameter, px */
  size: Range
  end: number
  halo?: boolean
}

export interface Burst {
  /** seconds */
  at: number
  count: number
  box: Box
  spray: Spray
  seed: number
}

/** A run of bursts: how often, how many and how far, each as a function of the run's progress 0..1 */
export interface Stream {
  from: number
  to: number
  every: (p: number) => number
  count: (p: number) => number
  box: (p: number) => Box
  spray: (p: number) => Spray
  seed: number
}

export function unroll(stream: Stream): Burst[] {
  const out: Burst[] = []
  let k = 0
  for (let t = stream.from; t < stream.to; k++) {
    const p = (t - stream.from) / (stream.to - stream.from)
    out.push({
      at: t,
      count: stream.count(p),
      box: stream.box(p),
      spray: stream.spray(p),
      seed: stream.seed * 1000 + k,
    })
    t += stream.every(p)
  }
  return out
}

const flight = (t: number) => 1 - (1 - t) ** 2
const fade = (t: number) => (1 - t) ** 1.6

/** Where spark k of a burst is at time `now`, or null once it has burnt out */
export function sparkAt(burst: Burst, k: number, now: number, tones: number) {
  const age = now - burst.at
  if (age < 0) return null
  const rnd = generator(((burst.seed + 1) * 2654435761 + k * 40503) >>> 0)
  const { spray, box } = burst
  const life = between(rnd(), ...spray.life)
  if (age >= life) return null
  let x: number
  let y: number
  let angle: number
  if (spray.from === "edge") {
    const side = Math.min(3, Math.floor(rnd() * 4))
    const gap = between(rnd(), 6, 18)
    const along = rnd()
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
  const distance = between(rnd(), ...spray.distance)
  const size = between(rnd(), ...spray.size)
  const tone = Math.min(tones - 1, Math.floor(rnd() * tones))
  const t = age / life
  const e = flight(t)
  return {
    x: x + Math.cos(angle) * distance * e,
    y: y + Math.sin(angle) * distance * e,
    size: size * (1 + (spray.end - 1) * e),
    alpha: fade(t),
    tone,
    halo: !!spray.halo,
  }
}

const GLOW = 3
const HALO_SCALE = 1.45
const SPRITE = 96

function rgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(h.slice(at, at + 2), 16))
  const own = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return `rgba(${r}, ${g}, ${b}, ${(alpha * own).toFixed(3)})`
}

function sprite(colour: string, halo: string | null) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = SPRITE
  const ctx = canvas.getContext("2d")!
  const r = SPRITE / 2
  const reach = halo ? 1 / HALO_SCALE : 1
  if (halo) {
    const cool = ctx.createRadialGradient(r, r, 0, r, r, r)
    cool.addColorStop(0, rgba(halo, 0.16))
    cool.addColorStop(0.5, rgba(halo, 0.05))
    cool.addColorStop(1, rgba(halo, 0))
    ctx.fillStyle = cool
    ctx.fillRect(0, 0, SPRITE, SPRITE)
  }
  const core = 0.5 / GLOW
  const warm = ctx.createRadialGradient(r, r, 0, r, r, r * reach)
  warm.addColorStop(0, rgba(colour, 1))
  warm.addColorStop(core * 0.8, rgba(colour, 1))
  warm.addColorStop(core * 1.25, rgba(colour, 0.55))
  warm.addColorStop(0.45, rgba(colour, 0.16))
  warm.addColorStop(1, rgba(colour, 0))
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, SPRITE, SPRITE)
  return canvas
}

/** Draws every live spark of the given bursts at the current frame, additively, over whatever is beneath */
export function SparkField({
  bursts,
  colours,
  halo,
}: {
  bursts: readonly Burst[]
  colours: readonly string[]
  halo: string
}) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const ref = useRef<HTMLCanvasElement>(null)
  const sprites = useMemo(
    () => [
      ...colours.map((c) => sprite(c, null)),
      ...colours.map((c) => sprite(c, halo)),
    ],
    [colours, halo]
  )
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d")
    if (!ctx) return
    const now = frame / fps
    ctx.clearRect(0, 0, width, height)
    ctx.globalCompositeOperation = "lighter"
    for (const burst of bursts) {
      if (now < burst.at || now > burst.at + burst.spray.life[1]) continue
      for (let k = 0; k < burst.count; k++) {
        const s = sparkAt(burst, k, now, colours.length)
        if (!s) continue
        const r = s.size * GLOW * (s.halo ? HALO_SCALE : 1)
        ctx.globalAlpha = s.alpha
        ctx.drawImage(
          sprites[s.tone + (s.halo ? colours.length : 0)]!,
          s.x - r,
          s.y - r,
          r * 2,
          r * 2
        )
      }
    }
    ctx.globalAlpha = 1
  }, [frame, fps, width, height, bursts, colours, sprites])
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
    />
  )
}
