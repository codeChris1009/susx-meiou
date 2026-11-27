import { type ReactNode, useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import { OIL, type OilTone, OilRingPainter } from "./painter"

interface OilRingProps {
  /** 0 to 1: how much of the ring is painted. Going back down starts a fresh ring */
  progress: number
  /** Which ring: every seed is a different hand. A new seed starts over */
  seed?: number
  /** Gilt for a dark ground, ink for paper */
  tone?: OilTone
  /** Accessible name of the progress bar */
  label: string
  /** Set in the ring's centre */
  children?: ReactNode
  className?: string
}

/**
 * A loading ring painted in oil, one brush stroke round a circle that flicks paint as it goes, after an ink logogram.
 * Size it with CSS (it is square); the paint and its flicks stay inside the box. Drive it with `progress`, as often
 * as every frame: only the new length of stroke is drawn each time.
 */
export function OilRing({
  progress,
  seed = 1,
  tone = "gilt",
  label,
  children,
  className,
}: OilRingProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const painter = useRef<OilRingPainter | null>(null)
  const latest = useRef(progress)
  const frame = useRef(0)

  // A painter per seed and tone, at the box's size on screen
  useLayoutEffect(() => {
    const el = canvas.current
    if (!el) return
    const scale = Math.min(2, window.devicePixelRatio || 1)
    const side = Math.max(1, Math.round(el.clientWidth * scale))
    el.width = el.height = side
    painter.current = new OilRingPainter(el, seed, OIL[tone])
    return () => {
      cancelAnimationFrame(frame.current)
      painter.current = null
    }
  }, [seed, tone])

  // Paint to the new progress, and keep going while flicks are in the air
  useLayoutEffect(() => {
    latest.current = progress
    const p = painter.current
    if (!p) return
    const run = (now: number) => {
      frame.current = p.paint(latest.current, now)
        ? requestAnimationFrame(run)
        : 0
    }
    cancelAnimationFrame(frame.current)
    run(performance.now())
  }, [progress, seed, tone])

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("oil-ring", className)}
    >
      <canvas ref={canvas} aria-hidden className="oil-ring-paint" />
      {children && <div className="oil-ring-centre">{children}</div>}
    </div>
  )
}
