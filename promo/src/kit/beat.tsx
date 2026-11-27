/**
 * One beat of a film: a Sequence placed in seconds, with the way it arrives and leaves. Beats may overlap, so a later
 * one can open over an earlier one (an iris, a wipe) instead of cutting.
 */
import type { ReactNode } from "react"
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

import { hash } from "./random"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

export interface Turn {
  kind:
    | "cut"
    | "fade"
    | "flash"
    | "iris"
    | "wipe"
    | "blur"
    | "glitch"
    | "zoom"
    | "ink"
    | "boss"
  frames?: number
  /** Flash colour; iris centre (shares of the frame); wipe direction */
  colour?: string
  at?: readonly [number, number]
  from?: "left" | "right" | "top" | "bottom"
}

interface BeatProps {
  /** Seconds */
  from: number
  to: number
  enter?: Turn
  exit?: Turn
  bg?: string
  children: ReactNode
  name?: string
}

export function Beat({ from, to, enter, exit, bg, children, name }: BeatProps) {
  const { fps } = useVideoConfig()
  const start = Math.round(from * fps)
  const length = Math.max(1, Math.round(to * fps) - start)
  return (
    <Sequence from={start} durationInFrames={length} name={name}>
      <Turned length={length} enter={enter} exit={exit} bg={bg}>
        {children}
      </Turned>
    </Sequence>
  )
}

function Turned({
  length,
  enter,
  exit,
  bg,
  children,
}: {
  length: number
  enter?: Turn
  exit?: Turn
  bg?: string
  children: ReactNode
}) {
  const frame = useCurrentFrame()
  const style: React.CSSProperties = { background: bg }
  const overlays: ReactNode[] = []
  const apply = (turn: Turn | undefined, p: number, arriving: boolean) => {
    if (!turn || turn.kind === "cut" || p >= 1) return
    const e = Easing.inOut(Easing.cubic)(p)
    switch (turn.kind) {
      case "fade":
        style.opacity = ((style.opacity as number | undefined) ?? 1) * e
        break
      // A focus pull: the picture is there at once, out of focus, and sharpens (no dip through black)
      case "blur":
        style.filter = `blur(${(1 - e) * 24}px)`
        break
      case "iris": {
        const [x, y] = turn.at ?? [0.5, 0.5]
        style.clipPath = `circle(${e * 120}% at ${x * 100}% ${y * 100}%)`
        break
      }
      case "wipe": {
        const r = (1 - e) * 100
        const side = turn.from ?? "left"
        // Arriving from the left uncovers left to right; leaving takes the same side away
        const inset = arriving
          ? {
              left: `0 ${r}% 0 0`,
              right: `0 0 0 ${r}%`,
              top: `0 0 ${r}% 0`,
              bottom: `${r}% 0 0 0`,
            }[side]
          : {
              left: `0 0 0 ${r}%`,
              right: `0 ${r}% 0 0`,
              top: `${r}% 0 0 0`,
              bottom: `0 0 ${r}% 0`,
            }[side]
        style.clipPath = `inset(${inset})`
        break
      }
      case "zoom":
        style.transform = `scale(${arriving ? 1.25 - 0.25 * e : 1 + 0.15 * (1 - e)})`
        style.opacity = ((style.opacity as number | undefined) ?? 1) * e
        break
      // Ink dropped on wet paper: blots bloom from seeded points at their own speeds until the picture is all through
      case "ink": {
        const [x, y] = turn.at ?? [0.5, 0.5]
        const blots = Array.from({ length: 7 }, (_, k) => {
          const bx = k ? 10 + hash(k, 41) * 80 : x * 100
          const by = k ? 10 + hash(k, 42) * 80 : y * 100
          const r = Math.max(
            0,
            e * (k ? 70 + hash(k, 43) * 60 : 150) - (k ? hash(k, 44) * 30 : 0)
          )
          return `radial-gradient(circle at ${bx}% ${by}%, black ${r * 0.8}%, transparent ${r}%)`
        })
        style.WebkitMaskImage = style.maskImage = blots.join(", ")
        overlays.push(
          <AbsoluteFill
            key={`i${arriving}`}
            style={{
              background: turn.colour ?? "#0b0907",
              opacity: (1 - p) * 0.5,
              mixBlendMode: "multiply",
            }}
          />
        )
        break
      }
      // A boss arrives: the frame lurches in, shakes and settles, a red flare across it
      case "boss": {
        const f = Math.floor(frame / 1.5)
        const shake = (1 - e) * 34
        style.transform = `translate(${(hash(f, 7) - 0.5) * shake}px, ${(hash(f, 8) - 0.5) * shake}px) scale(${1 + 0.14 * (1 - e)})`
        overlays.push(
          <AbsoluteFill
            key={`b${arriving}`}
            style={{
              background: turn.colour ?? "#ff2a1a",
              opacity: (1 - p) * 0.55,
              mixBlendMode: "screen",
            }}
          />
        )
        break
      }
      case "flash":
        overlays.push(
          <AbsoluteFill
            key={`f${arriving}`}
            style={{ background: turn.colour ?? "#fff", opacity: 1 - p }}
          />
        )
        break
      case "glitch": {
        const f = Math.floor(frame / 2)
        style.transform = `translateX(${(hash(f, 1) - 0.5) * 60 * (1 - p)}px) skewX(${(hash(f, 2) - 0.5) * 8 * (1 - p)}deg)`
        style.filter = `contrast(${1 + (1 - p)}) saturate(${1 + 2 * (1 - p)})`
        for (let i = 0; i < 6; i++) {
          if (hash(f, i, 9) > 1 - p * 0.2 - 0.25) continue
          overlays.push(
            <div
              key={`g${i}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${hash(f, i, 3) * 100}%`,
                height: `${2 + hash(f, i, 4) * 9}%`,
                background:
                  i % 2 ? "rgba(255,40,60,0.5)" : "rgba(40,220,255,0.45)",
                mixBlendMode: "screen",
                transform: `translateX(${(hash(f, i, 5) - 0.5) * 200}px)`,
              }}
            />
          )
        }
        break
      }
    }
  }
  const inFrames = enter?.frames ?? 12
  const outFrames = exit?.frames ?? 12
  apply(enter, interpolate(frame, [0, inFrames], [0, 1], clamp), true)
  apply(
    exit,
    interpolate(frame, [length - outFrames, length], [1, 0], clamp),
    false
  )
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {overlays}
    </AbsoluteFill>
  )
}

/** A whole-frame flash or fade of a colour at a moment: `at` frame within the Sequence, rising and falling */
export function Flash({
  at,
  colour = "#fff",
  rise = 2,
  fall = 10,
  peak = 1,
}: {
  at: number
  colour?: string
  rise?: number
  fall?: number
  peak?: number
}) {
  const frame = useCurrentFrame()
  const o =
    rise > 0
      ? interpolate(frame, [at - rise, at, at + fall], [0, peak, 0], clamp)
      : frame < at
        ? 0
        : interpolate(frame, [at, at + fall], [peak, 0], clamp)
  if (o <= 0) return null
  return <AbsoluteFill style={{ background: colour, opacity: o }} />
}
