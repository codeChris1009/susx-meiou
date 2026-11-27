import { describe, expect, it } from "vitest"

import { QUICK, SLOW, frame, graphemes, plan } from "./decode"

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

const text = (cells: { glyph: string }[]) => cells.map((c) => c.glyph).join("")
const POOL = Array.from("abcdefghijklmnopqrstuvwxyz")

describe("graphemes", () => {
  it("keeps a Tibetan stack and its vowel as one letter", () => {
    expect(graphemes("བཀྲ་ཤིས")).toEqual(["བ", "ཀྲ", "་", "ཤི", "ས"])
  })

  it("keeps a Vietnamese vowel with both its marks as one letter", () => {
    expect(graphemes("thế")).toHaveLength(3)
  })
})

describe("plan", () => {
  it("covers the longer of the two texts", () => {
    expect(plan("Drag", "View", QUICK).starts).toHaveLength(4)
    expect(plan("Hello world", "Hej", SLOW, seeded(1)).ends).toHaveLength(11)
  })

  it("resolves in reading order, give or take the jitter", () => {
    const p = plan("", "Bonjour le monde", SLOW, seeded(2))
    const first = p.ends[0]!
    const last = p.ends[p.ends.length - 1]!
    expect(last - first).toBeGreaterThan(SLOW.spread - SLOW.jitter)
    for (let i = 0; i < p.ends.length; i++)
      expect(p.ends[i]).toBeGreaterThan(p.starts[i]! + SLOW.scramble - 1)
  })

  it("stays under half a second for a label", () => {
    for (let s = 0; s < 20; s++)
      expect(plan("Drag", "View", QUICK, seeded(s)).total).toBeLessThan(500)
  })
})

describe("frame", () => {
  it("shows the old text before, and the new text once it ends", () => {
    const p = plan("Drag", "View", QUICK, seeded(3))
    expect(text(frame(p, POOL, -1, QUICK))).toBe("Drag")
    expect(text(frame(p, POOL, p.total, QUICK))).toBe("View")
  })

  it("grows and shrinks to the new length", () => {
    const grow = plan("Wait", "Open it", QUICK, seeded(4))
    expect(text(frame(grow, POOL, grow.total, QUICK))).toBe("Open it")
    const shrink = plan("Hello world", "Hej", SLOW, seeded(5))
    expect(text(frame(shrink, POOL, shrink.total, SLOW))).toBe("Hej")
  })

  it("scrambles in the pool, in the case of the letter to come, and keeps spaces", () => {
    const p = plan("", "Ab cd", SLOW, seeded(6))
    const mid = frame(p, POOL, SLOW.start + 1, SLOW, 9)
    expect(mid.map((c) => c.state)).toEqual(Array(5).fill("scramble"))
    expect(mid[0]!.glyph).toMatch(/^[A-Z]$/)
    expect(mid[1]!.glyph).toMatch(/^[a-z]$/)
    expect(mid[2]!.glyph).toBe(" ")
  })

  it("holds a glyph through a step and is repeatable", () => {
    const p = plan("", "abcdef", SLOW, seeded(7))
    const t = SLOW.start + 2
    expect(frame(p, POOL, t, SLOW, 1)).toEqual(frame(p, POOL, t + 1, SLOW, 1))
    expect(frame(p, POOL, t, SLOW, 1)).toEqual(frame(p, POOL, t, SLOW, 1))
  })
})
