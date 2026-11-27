/**
 * Words on screen, in the voice of the film: each line animates letter by letter or as a whole, by one of a few
 * manners a product might speak in. Times are frames within the enclosing Sequence.
 *
 *   spaced  letters resolve out of a blur, wide tracking (quiet, cinematic)
 *   decode  letters scramble through a pool of glyphs and settle left to right (signals, machines)
 *   slam    words punch in oversized and land (sport, energy)
 *   type    typed out behind a block caret (files, records)
 *   rise    each line slides up out of a mask (editorial)
 *   fade    the line fades and lifts (anything gentle)
 */
import type { CSSProperties } from "react"
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion"

import { hash } from "./random"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

export type Manner = "spaced" | "decode" | "slam" | "type" | "rise" | "fade"

export interface Line {
  text: string
  font: string
  size: number
  colour: string
  weight?: number
  /** Letter spacing, em */
  tracking?: number
  italic?: boolean
  /** Space above, px */
  gap?: number
  /** Overrides the block's manner for this line */
  manner?: Manner
  style?: CSSProperties
}

interface WordsProps {
  lines: readonly Line[]
  manner?: Manner
  /** Frames the words are on screen; they leave over the last `out` */
  duration: number
  out?: number
  /** Frames between one line starting and the next */
  stagger?: number
  /** Where, as shares of the frame: the block's anchor point */
  x?: number
  y?: number
  align?: "left" | "center" | "right"
  /** Glyphs for decode */
  pool?: string
  /** Frames per letter */
  pace?: number
  /** Extra style for the block: a panel behind the words where the picture is busy */
  box?: CSSProperties
}

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>"

export function Words({
  lines,
  manner = "spaced",
  duration,
  out = 14,
  stagger = 10,
  x = 0.5,
  y = 0.5,
  align = "center",
  pool = POOL,
  pace,
  box,
}: WordsProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const leave = out
    ? interpolate(frame, [duration - out, duration], [1, 0], clamp)
    : 1
  const shift = align === "center" ? "-50%" : align === "right" ? "-100%" : "0"
  return (
    <div
      style={{
        position: "absolute",
        left: x * width,
        top: y * height,
        transform: `translate(${shift}, -50%)`,
        textAlign: align,
        opacity: leave,
        whiteSpace: "nowrap",
        ...box,
      }}
    >
      {lines.map((line, i) => (
        <LineOf
          key={i}
          line={line}
          manner={line.manner ?? manner}
          start={i * stagger}
          frame={frame}
          pool={pool}
          pace={pace}
          seed={i}
        />
      ))}
    </div>
  )
}

function LineOf({
  line,
  manner,
  start,
  frame,
  pool,
  pace,
  seed,
}: {
  line: Line
  manner: Manner
  start: number
  frame: number
  pool: string
  pace?: number
  seed: number
}) {
  const t = frame - start
  const letters = [...line.text]
  const base: CSSProperties = {
    fontFamily: line.font,
    fontSize: line.size,
    fontWeight: line.weight ?? 500,
    fontStyle: line.italic ? "italic" : undefined,
    letterSpacing: `${line.tracking ?? 0}em`,
    color: line.colour,
    marginTop: line.gap ?? 0,
    lineHeight: 1.12,
    ...line.style,
  }
  if (t < 0 && manner !== "rise")
    return <div style={{ ...base, opacity: 0 }}>{line.text}</div>

  if (manner === "rise") {
    const p = Easing.out(Easing.exp)(interpolate(t, [0, 22], [0, 1], clamp))
    return (
      <div style={{ ...base, overflow: "hidden", paddingBottom: "0.08em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)` }}>
          {line.text}
        </div>
      </div>
    )
  }
  if (manner === "fade") {
    const p = Easing.out(Easing.cubic)(interpolate(t, [0, 20], [0, 1], clamp))
    return (
      <div
        style={{
          ...base,
          opacity: p,
          transform: `translateY(${(1 - p) * 14}px)`,
        }}
      >
        {line.text}
      </div>
    )
  }
  if (manner === "slam") {
    const words = line.text.split(" ")
    return (
      <div style={base}>
        {words.map((w, k) => {
          const p = interpolate(t, [k * 3, k * 3 + 7], [0, 1], clamp)
          const s = 1 + (1 - Easing.out(Easing.back(2.2))(p)) * 0.5
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                opacity: p > 0 ? 1 : 0,
                transform: `scale(${s})`,
                marginRight: k < words.length - 1 ? "0.25em" : 0,
              }}
            >
              {w}
            </span>
          )
        })}
      </div>
    )
  }
  if (manner === "type") {
    const per = pace ?? 1.2
    const shown = Math.max(0, Math.floor(t / per))
    const caret = Math.floor(t / 8) % 2 === 0 || shown < letters.length
    return (
      <div style={base}>
        {letters.slice(0, shown).join("")}
        <span
          style={{
            opacity: caret ? 1 : 0,
            display: "inline-block",
            width: "0.55em",
            height: "0.95em",
            marginLeft: "0.06em",
            background: line.colour,
            verticalAlign: "-0.1em",
          }}
        />
      </div>
    )
  }
  if (manner === "decode") {
    const per = pace ?? 1.4
    const glyphs = [...pool]
    return (
      <div style={base}>
        {letters.map((ch, k) => {
          const settle = 8 + k * per
          if (ch === " ") return <span key={k}> </span>
          if (t >= settle) return <span key={k}>{ch}</span>
          if (t < k * per * 0.4)
            return (
              <span key={k} style={{ opacity: 0 }}>
                {ch}
              </span>
            )
          const g =
            glyphs[
              Math.floor(hash(seed, k, Math.floor(t / 2)) * glyphs.length)
            ] ?? ch
          return (
            <span key={k} style={{ opacity: 0.55 }}>
              {g}
            </span>
          )
        })}
      </div>
    )
  }
  // spaced
  const per = pace ?? 1.1
  return (
    <div style={base}>
      {letters.map((ch, k) => {
        const p = interpolate(t, [k * per, k * per + 16], [0, 1], clamp)
        return (
          <span
            key={k}
            style={{
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              display: "inline-block",
              transform: `translateY(${(1 - p) * 6}px)`,
              minWidth: ch === " " ? "0.3em" : undefined,
            }}
          >
            {ch}
          </span>
        )
      })}
    </div>
  )
}
