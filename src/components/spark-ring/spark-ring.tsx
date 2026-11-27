import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import { spark } from "./sparks"

/** Ring radius in the 40-unit viewBox */
const R = 16
/** Least time between sparks off the head, ms */
const EVERY = 70

interface SparkRingProps {
  /** 0 to 1: how far round the light has come */
  progress: number
  /** Accessible name of the progress bar */
  label: string
  className?: string
}

/**
 * A loading ring in the 3D art gallery's light: a faint track, an arc of white light with a cool halo drawing round
 * it, and sparks thrown off its head as it moves (the gallery's cursor sparks). Size it with CSS; it is square.
 */
export function SparkRing({ progress, label, className }: SparkRingProps) {
  const box = useRef<HTMLDivElement>(null)
  const last = useRef({ progress: 0, at: 0 })
  const p = Math.min(1, Math.max(0, progress))

  useEffect(() => {
    const el = box.current
    if (!el) return
    if (p < last.current.progress) last.current = { progress: p, at: 0 }
    const now = performance.now()
    if (p <= last.current.progress || p >= 1 || now - last.current.at < EVERY)
      return
    last.current = { progress: p, at: now }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const side = el.clientWidth
    const a = -Math.PI / 2 + p * Math.PI * 2
    const r = (side * R) / 40
    for (let i = 0; i < 2; i++)
      spark(el, {
        x: side / 2 + Math.cos(a) * r,
        y: side / 2 + Math.sin(a) * r,
        // Outward and a little behind, as if shed by the moving head
        angle: a + (Math.random() - 0.3) * 1.1,
        distance: 5 + Math.random() * 14,
        size: 2 + Math.random(),
        life: 450 + Math.random() * 300,
      })
  }, [p])

  const head = -Math.PI / 2 + p * Math.PI * 2
  return (
    <div
      ref={box}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className={cn("spark-ring", className)}
    >
      <svg viewBox="0 0 40 40" aria-hidden className="spark-ring-light">
        <circle cx={20} cy={20} r={R} className="spark-ring-track" />
        <circle
          cx={20}
          cy={20}
          r={R}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - p}
          transform="rotate(-90 20 20)"
          opacity={p > 0 ? 1 : 0}
          className="spark-ring-arc"
        />
        <circle
          cx={20 + Math.cos(head) * R}
          cy={20 + Math.sin(head) * R}
          r={1.9}
          opacity={p > 0 && p < 1 ? 1 : 0}
          className="spark-ring-head"
        />
      </svg>
    </div>
  )
}
