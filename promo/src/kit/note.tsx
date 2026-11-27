/**
 * A note in the margin of the picture: a short rule that draws itself, a small index, a line saying what the product is
 * doing and its Chinese beneath. The film's way of describing a feature without covering it. Times are frames.
 */
import { useCurrentFrame, useVideoConfig } from "remotion"

import { drawn } from "./lines"
import { type Manner, Words } from "./words"

export interface NoteLook {
  colour: string
  muted: string
  rule: string
  mono: string
  han: string
  /** The EN line's face; the mono face by default */
  face?: string
  size?: number
  weight?: number
  manner?: Manner
  /** Letter spacing of the EN line, em */
  tracking?: number
  /** A panel behind the note, for a picture with no quiet corner */
  panel?: string
}

export function Note({
  index,
  en,
  zh,
  duration,
  look,
  x = 0.055,
  y = 0.82,
  align = "left",
}: {
  index?: string
  en: string
  zh?: string
  duration: number
  look: NoteLook
  x?: number
  y?: number
  align?: "left" | "right" | "center"
}) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const size = look.size ?? 30
  const p = drawn(frame, 0, 16) * (1 - drawn(frame, duration - 12, 12))
  const length = 140 * p
  const x0 = x * width
  const top = y * height - size * (index ? 1.9 : 1.4) - 18
  return (
    <>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <line
          x1={
            align === "left"
              ? x0
              : align === "center"
                ? x0 - length / 2
                : x0 - length
          }
          x2={
            align === "left"
              ? x0 + length
              : align === "center"
                ? x0 + length / 2
                : x0
          }
          y1={top}
          y2={top}
          stroke={look.rule}
          strokeWidth={1}
        />
      </svg>
      <Words
        duration={duration}
        manner={look.manner ?? "decode"}
        x={x}
        y={y}
        align={align}
        stagger={6}
        pace={0.9}
        box={
          look.panel
            ? {
                background: look.panel,
                padding: "12px 24px 14px",
                borderRadius: 14,
                backdropFilter: "blur(10px)",
              }
            : undefined
        }
        lines={[
          ...(index
            ? [
                {
                  text: index,
                  font: look.mono,
                  size: size * 0.46,
                  colour: look.muted,
                  tracking: 0.3,
                },
              ]
            : []),
          {
            text: en,
            font: look.face ?? look.mono,
            size,
            colour: look.colour,
            tracking: look.tracking ?? 0.14,
            weight: look.weight ?? 400,
            gap: index ? 10 : 0,
          },
          ...(zh
            ? [
                {
                  text: zh,
                  font: look.han,
                  size: size * 0.62,
                  colour: look.muted,
                  tracking: 0.24,
                  gap: 10,
                  manner: "fade" as const,
                },
              ]
            : []),
        ]}
      />
    </>
  )
}
