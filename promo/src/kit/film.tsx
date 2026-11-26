/**
 * What makes a frame read as film: 2.39:1 bars, grain that changes every frame, a vignette, and fades through black.
 */
import { useLayoutEffect, useMemo, useRef } from "react"
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

import { generator, hash } from "./random"

/** Scope: the picture inside 2.39:1, the bars outside it */
export function Letterbox({ ratio = 2.39 }: { ratio?: number }) {
  const { width, height } = useVideoConfig()
  const bar = Math.max(0, (height - width / ratio) / 2)
  const style = {
    position: "absolute",
    left: 0,
    right: 0,
    height: bar,
    background: "#000",
  } as const
  return (
    <AbsoluteFill>
      <div style={{ ...style, top: 0 }} />
      <div style={{ ...style, bottom: 0 }} />
    </AbsoluteFill>
  )
}

const TILE = 256

/** Monochrome grain: one seeded noise tile, laid at a new random offset every frame */
export function Grain({ strength = 0.07 }: { strength?: number }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const ref = useRef<HTMLCanvasElement>(null)
  const tile = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = TILE
    const ctx = canvas.getContext("2d")!
    const data = ctx.createImageData(TILE, TILE)
    const rnd = generator(35)
    for (let i = 0; i < TILE * TILE; i++) {
      const v = Math.floor(rnd() * 255)
      data.data.set([v, v, v, 255], i * 4)
    }
    ctx.putImageData(data, 0, 0)
    return canvas
  }, [])
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d")
    if (!ctx) return
    const pattern = ctx.createPattern(tile, "repeat")
    if (!pattern) return
    const dx = Math.floor(hash(frame, 1) * TILE)
    const dy = Math.floor(hash(frame, 2) * TILE)
    ctx.setTransform(1, 0, 0, 1, -dx, -dy)
    ctx.fillStyle = pattern
    ctx.fillRect(dx, dy, width, height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }, [frame, tile, width, height])
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        opacity: strength,
        mixBlendMode: "overlay",
      }}
    />
  )
}

export function Vignette({ strength = 0.75 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 70% at 50% 48%, transparent 45%, rgba(0, 0, 0, ${strength}) 100%)`,
      }}
    />
  )
}

/** Fades through black at the ends of [from, to) in frames: in over `inFrames`, out over `outFrames`; nothing outside */
export function Dip({
  from,
  to,
  inFrames = 0,
  outFrames = 0,
}: {
  from: number
  to: number
  inFrames?: number
  outFrames?: number
}) {
  const frame = useCurrentFrame()
  // Only inside its own window: outside it, clamped ramps would hold the picture black
  if (frame < from || frame >= to) return null
  const fadeIn = inFrames
    ? interpolate(frame, [from, from + inFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0
  const fadeOut = outFrames
    ? interpolate(frame, [to - outFrames, to], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0
  const opacity = Math.max(fadeIn, fadeOut)
  if (!opacity) return null
  return <AbsoluteFill style={{ background: "#000", opacity }} />
}
