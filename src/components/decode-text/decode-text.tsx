import { useEffect, useRef, useState } from "react"

import { type Cell, type DecodeTiming, QUICK, frame, plan } from "./decode"

interface DecodeTextProps {
  text: string
  /** Glyphs the letters pass through while they resolve, one per entry */
  pool: readonly string[]
  timing?: DecodeTiming
  /** Change it to play the decode again on the same text */
  replay?: number
}

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Text that changes by decoding (decode.ts): it dissolves into glyphs from `pool` and resolves into the new words.
 * Between changes it is plain text. Scrambling letters carry data-decode="scramble" for styling; readers who ask
 * for less motion get the new text at once.
 */
export function DecodeText({
  text,
  pool,
  timing = QUICK,
  replay = 0,
}: DecodeTextProps) {
  const [cells, setCells] = useState<Cell[] | null>(null)
  /** What is on screen now, so a change mid-decode starts from there rather than from the last full text */
  const shown = useRef(text)
  const latest = useRef({ pool, timing })
  useEffect(() => {
    latest.current = { pool, timing }
  })

  useEffect(() => {
    // Never animated, so nothing to clear: the plain text renders
    if (still()) {
      shown.current = text
      return
    }
    const { pool, timing } = latest.current
    const p = plan(shown.current, text, timing)
    const seed = Math.floor(Math.random() * 2 ** 31)
    const begin = performance.now()
    let last = ""
    let raf = 0
    const run = (now: number) => {
      const t = now - begin
      if (t >= p.total) {
        shown.current = text
        setCells(null)
        return
      }
      const next = frame(p, pool, t, timing, seed)
      const key = next.map((c) => c.state[0] + c.glyph).join("")
      if (key !== last) {
        last = key
        shown.current = next.map((c) => c.glyph).join("")
        setCells(next)
      }
      raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [text, replay])

  if (!cells) return text
  return cells.map((c, i) =>
    c.state === "scramble" ? (
      <span key={i} data-decode="scramble">
        {c.glyph}
      </span>
    ) : (
      <span key={i}>{c.glyph}</span>
    )
  )
}
