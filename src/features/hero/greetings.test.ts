import { describe, expect, it } from "vitest"

import { FIRST, GREETINGS, HUES, between, shuffleBag } from "./greetings"

/** Deterministic random for repeatable shuffles */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe("shuffleBag", () => {
  it("draws every item once per round", () => {
    const next = shuffleBag([1, 2, 3, 4, 5], seeded(1))
    for (let round = 0; round < 4; round++) {
      const drawn = Array.from({ length: 5 }, next)
      expect([...drawn].sort()).toEqual([1, 2, 3, 4, 5])
    }
  })

  it("never repeats an item back to back, across rounds or after the first", () => {
    for (let seed = 0; seed < 50; seed++) {
      const next = shuffleBag(["a", "b", "c"], seeded(seed), "a")
      let previous = "a"
      for (let i = 0; i < 60; i++) {
        const item = next()
        expect(item).not.toBe(previous)
        previous = item
      }
    }
  })

  it("does not settle into one order", () => {
    const next = shuffleBag([1, 2, 3, 4, 5, 6], seeded(7))
    const rounds = new Set(
      Array.from({ length: 6 }, () => Array.from({ length: 6 }, next).join())
    )
    expect(rounds.size).toBeGreaterThan(1)
  })

  it("refuses an empty list", () => {
    expect(() => shuffleBag([])).toThrow()
  })
})

describe("greetings", () => {
  it("opens with English and lists each language once", () => {
    expect(GREETINGS[0]).toBe(FIRST)
    const langs = GREETINGS.map((g) => g.lang)
    expect(new Set(langs).size).toBe(langs.length)
  })

  it("keeps to scripts Geist and Noto Sans TC can set", () => {
    // Latin (incl. Vietnamese), Cyrillic, CJK ideographs and kana, spaces
    const covered =
      /^[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana} ]+$/u
    for (const g of GREETINGS) expect(g.text).toMatch(covered)
  })

  it("has no punctuation in any greeting", () => {
    for (const g of GREETINGS) expect(g.text).not.toMatch(/\p{P}/u)
  })

  it("gives every palette three valid hues", () => {
    for (const hues of HUES) {
      expect(hues).toHaveLength(3)
      for (const h of hues) expect(h >= 0 && h < 360).toBe(true)
    }
  })
})

describe("between", () => {
  it("stays in range", () => {
    const random = seeded(3)
    for (let i = 0; i < 100; i++) {
      const v = between(2, 3, random)
      expect(v >= 2 && v < 3).toBe(true)
    }
  })
})
