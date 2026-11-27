/**
 * The decode: text that changes by dissolving into glyph noise and resolving, letter by letter from the start of the
 * line, into the new words. Pure timing and glyph choice, so the tests can read any frame; decode-text.tsx plays it.
 *
 * Every position starts scrambling almost at once (the old words dissolve together, so two scripts never sit
 * reordered side by side), then resolves in reading order, each a little after the one before it.
 */

export interface DecodeTiming {
  /** Positions start scrambling within this long of the start, ms */
  start: number
  /** The least time a position scrambles, ms */
  scramble: number
  /** How much later the last position resolves than the first, ms */
  spread: number
  /** Random extra on each position's resolve, ms */
  jitter: number
  /** How often a scrambling glyph changes, ms */
  step: number
}

/** A label's quick change, under half a second */
export const QUICK: DecodeTiming = {
  start: 40,
  scramble: 110,
  spread: 170,
  jitter: 60,
  step: 42,
}

/** A display line's change: unhurried, so the eye can follow the resolve across it */
export const SLOW: DecodeTiming = {
  start: 120,
  scramble: 320,
  spread: 720,
  jitter: 220,
  step: 58,
}

export interface Plan {
  from: readonly string[]
  to: readonly string[]
  /** Per position, ms: when it starts scrambling, and when it settles */
  starts: readonly number[]
  ends: readonly number[]
  /** When the last position settles, ms */
  total: number
}

export type CellState = "old" | "scramble" | "settled"

export interface Cell {
  glyph: string
  state: CellState
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

/** Splits text into what a reader sees as letters: a Tibetan stack or an accented vowel stays one */
export function graphemes(text: string): string[] {
  if (!segmenter) return Array.from(text)
  return Array.from(segmenter.segment(text), (s) => s.segment)
}

export function plan(
  from: string,
  to: string,
  timing: DecodeTiming,
  random: () => number = Math.random
): Plan {
  const a = graphemes(from)
  const b = graphemes(to)
  const n = Math.max(a.length, b.length)
  const starts: number[] = []
  const ends: number[] = []
  for (let i = 0; i < n; i++) {
    const start = random() * timing.start
    const order = n > 1 ? i / (n - 1) : 0
    starts.push(start)
    ends.push(
      Math.max(start, timing.start) +
        timing.scramble +
        order * timing.spread +
        random() * timing.jitter
    )
  }
  return { from: a, to: b, starts, ends, total: Math.max(0, ...ends) }
}

/** A small integer hash: the same position at the same step always shows the same glyph */
function hash(a: number, b: number, c: number) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f) ^ Math.imul(c, 0x165667b1)
  h ^= h >>> 15
  return h >>> 0
}

const cased = (g: string) => g.toUpperCase() !== g.toLowerCase()

/**
 * The line `t` ms into the plan: old letters until a position starts, glyphs drawn from `pool` while it scrambles
 * (in the case of the letter it becomes; spaces stay spaces, so the words keep their shape), the new letter after.
 */
export function frame(
  p: Plan,
  pool: readonly string[],
  t: number,
  timing: DecodeTiming,
  seed = 0
): Cell[] {
  const tick = Math.floor(t / timing.step)
  const cells: Cell[] = []
  for (let i = 0; i < p.starts.length; i++) {
    const to = p.to[i] ?? ""
    if (t >= p.ends[i]!) {
      if (to) cells.push({ glyph: to, state: "settled" })
      continue
    }
    if (t < p.starts[i]!) {
      const old = p.from[i] ?? ""
      if (old) cells.push({ glyph: old, state: "old" })
      continue
    }
    if (to === " " || !pool.length) {
      cells.push({ glyph: to || " ", state: "scramble" })
      continue
    }
    let glyph = pool[hash(seed, i, tick) % pool.length]!
    if (cased(to) && to === to.toUpperCase()) glyph = glyph.toUpperCase()
    cells.push({ glyph, state: "scramble" })
  }
  return cells
}
