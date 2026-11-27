/**
 * Drawn layers a film can lay over or under its product: a turning globe of meridians, rings of a signal, rules and
 * ticks that draw across the frame, drifting dust and a counting number. All pure functions of the frame, seeded, so
 * any frame renders alone. Times are frames within the enclosing Sequence.
 */
import type { CSSProperties } from "react"
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion"

import { generator } from "./random"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
const RAD = Math.PI / 180

/** Draw-on progress for a stroke that starts at `at` and takes `frames` */
export const drawn = (frame: number, at: number, frames: number) =>
  Easing.inOut(Easing.cubic)(
    interpolate(frame, [at, at + frames], [0, 1], clamp)
  )

/**
 * A globe in fine line: meridians and parallels of an orthographic sphere, turning, the far side left out, with a
 * scatter of seeded points on its face. Draws itself on from `at`.
 */
export function Graticule({
  cx = 0.5,
  cy = 0.5,
  r = 0.4,
  tilt = 18,
  spin = 0.25,
  step = 15,
  colour,
  width = 1,
  at = 0,
  draw = 40,
  dots = 0,
  dotColour,
  style,
}: {
  /** Centre, shares of the frame; radius, a share of the frame height */
  cx?: number
  cy?: number
  r?: number
  tilt?: number
  /** Degrees a frame */
  spin?: number
  step?: number
  colour: string
  width?: number
  at?: number
  draw?: number
  dots?: number
  dotColour?: string
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const R = r * H
  const X = cx * W
  const Y = cy * H
  const lon0 = frame * spin
  const p = drawn(frame, at, draw)
  const sinT = Math.sin(tilt * RAD)
  const cosT = Math.cos(tilt * RAD)
  const project = (lat: number, lon: number) => {
    const la = lat * RAD
    const lo = (lon - lon0) * RAD
    const z = cosT * Math.cos(la) * Math.cos(lo) + sinT * Math.sin(la)
    return {
      x: X + R * Math.cos(la) * Math.sin(lo),
      y: Y - R * (cosT * Math.sin(la) - sinT * Math.cos(la) * Math.cos(lo)),
      front: z > 0,
    }
  }
  const paths: string[] = []
  const line = (pts: { x: number; y: number; front: boolean }[]) => {
    let d = ""
    let pen = false
    for (const q of pts) {
      if (!q.front) {
        pen = false
        continue
      }
      d += `${pen ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
      pen = true
    }
    if (d) paths.push(d)
  }
  for (let lon = 0; lon < 360; lon += step) {
    const pts = []
    for (let lat = -90; lat <= 90 * (2 * p - 1) + 1e-6 && lat <= 90; lat += 3)
      pts.push(project(lat, lon))
    line(pts)
  }
  for (let lat = -90 + step; lat < 90; lat += step) {
    const pts = []
    for (let lon = 0; lon <= 360 * p; lon += 3) pts.push(project(lat, lon))
    line(pts)
  }
  const rnd = generator(77)
  const points = Array.from({ length: dots }, () => ({
    lat: Math.asin(rnd() * 2 - 1) / RAD,
    lon: rnd() * 360,
    s: 0.6 + rnd() * 1.8,
    k: rnd(),
  }))
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, ...style }}
    >
      <circle
        cx={X}
        cy={Y}
        r={R}
        fill="none"
        stroke={colour}
        strokeWidth={width * 1.2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={colour}
          strokeWidth={width}
          opacity={0.55}
        />
      ))}
      {points.map((q, i) => {
        const v = project(q.lat, q.lon)
        if (!v.front || q.k > p) return null
        return (
          <circle
            key={`d${i}`}
            cx={v.x}
            cy={v.y}
            r={q.s}
            fill={dotColour ?? colour}
          />
        )
      })}
    </svg>
  )
}

/** A signal: rings widening from a point and fading, one every `period` frames */
export function Rings({
  cx = 0.5,
  cy = 0.5,
  colour,
  period = 40,
  reach = 0.6,
  count = 4,
  width = 1,
  from = 0,
}: {
  cx?: number
  cy?: number
  colour: string
  period?: number
  reach?: number
  count?: number
  width?: number
  from?: number
}) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const t = frame - from
  if (t < 0) return null
  const rings = []
  for (let k = 0; k < count; k++) {
    const age = (t - k * period) % (period * count)
    if (age < 0 || t < k * period) continue
    const q = age / (period * count)
    rings.push(
      <circle
        key={k}
        cx={cx * W}
        cy={cy * H}
        r={Easing.out(Easing.cubic)(q) * reach * H}
        fill="none"
        stroke={colour}
        strokeWidth={width}
        opacity={(1 - q) ** 1.5}
      />
    )
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {rings}
    </svg>
  )
}

export interface Rule {
  /** Horizontal at y, or vertical at x, as a share of the frame */
  y?: number
  x?: number
  at: number
  draw?: number
  /** Small mono label at its start */
  label?: string
  ticks?: number
}

/** Thin rules drawing across the frame, with ticks and small labels: the margin of a technical drawing */
export function Rules({
  rules,
  colour,
  font,
  width = 1,
  size = 14,
}: {
  rules: readonly Rule[]
  colour: string
  font: string
  width?: number
  size?: number
}) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {rules.map((rule, i) => {
        const p = drawn(frame, rule.at, rule.draw ?? 30)
        if (p <= 0) return null
        const horizontal = rule.y !== undefined
        const pos = horizontal ? rule.y! * H : (rule.x ?? 0) * W
        const length = horizontal ? W : H
        const ticks = Array.from(
          { length: rule.ticks ?? 0 },
          (_, k) => ((k + 1) / ((rule.ticks ?? 0) + 1)) * length
        ).filter((v) => v <= length * p)
        return (
          <g key={i} stroke={colour} strokeWidth={width}>
            {horizontal ? (
              <line x1={0} y1={pos} x2={W * p} y2={pos} />
            ) : (
              <line x1={pos} y1={0} x2={pos} y2={H * p} />
            )}
            {ticks.map((v, k) =>
              horizontal ? (
                <line key={k} x1={v} y1={pos - 5} x2={v} y2={pos + 5} />
              ) : (
                <line key={k} x1={pos - 5} y1={v} x2={pos + 5} y2={v} />
              )
            )}
            {rule.label && (
              <text
                x={horizontal ? 24 : pos + 10}
                y={horizontal ? pos - 10 : 30}
                fill={colour}
                stroke="none"
                fontFamily={font}
                fontSize={size}
                letterSpacing="0.2em"
                opacity={p}
              >
                {rule.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Seeded motes drifting up through the frame, twinkling */
export function Dust({
  count = 80,
  colour,
  seed = 5,
  size = 2,
  speed = 0.4,
  opacity = 0.6,
}: {
  count?: number
  colour: string
  seed?: number
  size?: number
  speed?: number
  opacity?: number
}) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const rnd = generator(seed)
  const motes = Array.from({ length: count }, () => ({
    x: rnd(),
    y: rnd(),
    s: 0.4 + rnd(),
    v: 0.3 + rnd(),
    ph: rnd() * 6.28,
  }))
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {motes.map((m, i) => {
        const y = (((m.y * H - frame * speed * m.v * 2) % H) + H) % H
        const x = m.x * W + Math.sin(frame * 0.02 + m.ph) * 12
        const tw = 0.5 + 0.5 * Math.sin(frame * 0.07 + m.ph)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={size * m.s}
            fill={colour}
            opacity={opacity * tw}
          />
        )
      })}
    </svg>
  )
}

/** A number counting from `from` to `to` between frames `at` and `at + frames`, slowing as it lands */
export function Count({
  from = 0,
  to,
  at = 0,
  frames = 30,
  pad = 0,
  style,
}: {
  from?: number
  to: number
  at?: number
  frames?: number
  pad?: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const k = Easing.out(Easing.cubic)(
    interpolate(frame, [at, at + frames], [0, 1], clamp)
  )
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {String(Math.round(from + (to - from) * k)).padStart(pad, "0")}
    </span>
  )
}
