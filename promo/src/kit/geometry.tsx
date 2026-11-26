/**
 * Construction lines in gold hairline, the way a Renaissance sheet is laid out before it is drawn: the circle and the
 * square of the proportioned figure, their diagonals, a golden section, the golden spiral, and a ring of degree ticks.
 * Each line draws itself on (stroke-dashoffset over pathLength 1), in its own turn.
 */
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion"

const PHI = (1 + Math.sqrt(5)) / 2
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

/**
 * The golden spiral: a logarithmic spiral growing by φ every quarter turn, r = a · φ^(2θ/π), sampled as a polyline from
 * its eye at (x, y) out to radius `outer`
 */
function spiral(x: number, y: number, outer: number, turns: number) {
  const k = Math.log(PHI) / (Math.PI / 2)
  const end = turns * Math.PI * 2
  const a = outer / Math.exp(k * end)
  const points: string[] = []
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * end
    const r = a * Math.exp(k * t)
    points.push(
      `${(x + r * Math.cos(t + Math.PI)).toFixed(1)} ${(y + r * Math.sin(t + Math.PI)).toFixed(1)}`
    )
  }
  return `M ${points.join(" L ")}`
}

interface GeometryProps {
  /** Frame (within the Sequence) the drawing starts, and how long it takes */
  start: number
  duration: number
  colour: string
  opacity?: number
  /** Radius of the circle, px */
  radius?: number
}

export function Geometry({
  start,
  duration,
  colour,
  opacity = 0.5,
  radius = 330,
}: GeometryProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const cx = width / 2
  const cy = height / 2
  const r = radius
  const sq = r * 1.62
  const lines: { d: string; at: number; len: number; w?: number }[] = [
    // The circle, then the square standing on its lowest point
    {
      d: `M ${cx} ${cy - r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 ${-2 * r}`,
      at: 0,
      len: 0.55,
    },
    {
      d: `M ${cx - sq / 2} ${cy + r} h ${sq} v ${-sq} h ${-sq} Z`,
      at: 0.12,
      len: 0.45,
    },
    {
      d: `M ${cx - sq / 2} ${cy + r} L ${cx + sq / 2} ${cy + r - sq}`,
      at: 0.3,
      len: 0.3,
      w: 0.6,
    },
    {
      d: `M ${cx + sq / 2} ${cy + r} L ${cx - sq / 2} ${cy + r - sq}`,
      at: 0.34,
      len: 0.3,
      w: 0.6,
    },
    // The golden section of the square, across
    {
      d: `M ${cx - sq / 2 - 40} ${cy + r - sq / PHI} h ${sq + 80}`,
      at: 0.42,
      len: 0.25,
      w: 0.6,
    },
    { d: `M ${cx - r * 1.35} ${cy} h ${r * 2.7}`, at: 0.46, len: 0.3, w: 0.5 },
    { d: `M ${cx} ${cy - r * 1.3} v ${r * 2.6}`, at: 0.48, len: 0.3, w: 0.5 },
    // The spiral, out of the upper square
    {
      d: spiral(cx + r * 0.18, cy - r * 0.12, r * 0.92, 2.5),
      at: 0.5,
      len: 0.5,
      w: 0.8,
    },
  ]
  const progress = (at: number, len: number) =>
    interpolate(
      frame,
      [start + duration * at, start + duration * (at + len)],
      [0, 1],
      clamp
    )
  const ticks = interpolate(
    frame,
    [start + duration * 0.25, start + duration * 0.9],
    [0, 72],
    clamp
  )
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        filter: `drop-shadow(0 0 6px ${colour})`,
      }}
    >
      {lines.map(({ d, at, len, w = 1 }, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke={colour}
          strokeWidth={w}
          strokeDasharray="1 1"
          strokeDashoffset={1 - progress(at, len)}
        />
      ))}
      {Array.from({ length: Math.floor(ticks) }, (_, i) => {
        const a = (i / 72) * Math.PI * 2 - Math.PI / 2
        const long = i % 6 === 0
        const r0 = r + 10
        const r1 = r + (long ? 24 : 16)
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * r1}
            y2={cy + Math.sin(a) * r1}
            stroke={colour}
            strokeWidth={long ? 0.9 : 0.5}
          />
        )
      })}
    </svg>
  )
}
