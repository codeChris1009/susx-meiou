/**
 * A title card in the trailer's voice: a line of spaced capitals that resolves letter by letter out of a blur, a small
 * Chinese line beneath, both fading together at the end. Times are frames within the enclosing Sequence.
 */
import { interpolate, useCurrentFrame } from "remotion"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

interface CaptionProps {
  en: string
  zh?: string
  /** Frames the card is on screen */
  duration: number
  /** Vertical place, as a share of the frame height */
  y?: number
  size?: number
  fonts: { serif: string; han: string }
  colour: string
  muted: string
}

export function Caption({
  en,
  zh,
  duration,
  y = 0.5,
  size = 46,
  fonts,
  colour,
  muted,
}: CaptionProps) {
  const frame = useCurrentFrame()
  const out = interpolate(frame, [duration - 14, duration], [1, 0], clamp)
  const letters = [...en]
  const zhIn = interpolate(
    frame,
    [letters.length * 1.1 + 6, letters.length * 1.1 + 24],
    [0, 1],
    clamp
  )
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `${y * 100}%`,
        transform: "translateY(-50%)",
        textAlign: "center",
        opacity: out,
      }}
    >
      <div
        style={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: "0.32em",
          textIndent: "0.32em",
          color: colour,
          whiteSpace: "nowrap",
        }}
      >
        {letters.map((ch, i) => {
          const t = interpolate(frame, [i * 1.1, i * 1.1 + 16], [0, 1], clamp)
          return (
            <span
              key={i}
              style={{
                opacity: t,
                filter: `blur(${(1 - t) * 10}px)`,
                display: "inline-block",
                transform: `translateY(${(1 - t) * 6}px)`,
                minWidth: ch === " " ? "0.35em" : undefined,
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
      {zh && (
        <div
          style={{
            marginTop: size * 0.55,
            fontFamily: fonts.han,
            fontSize: size * 0.46,
            letterSpacing: "0.5em",
            textIndent: "0.5em",
            color: muted,
            opacity: zhIn,
            filter: `blur(${(1 - zhIn) * 4}px)`,
          }}
        >
          {zh}
        </div>
      )}
    </div>
  )
}
