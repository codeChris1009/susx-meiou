import { describe, expect, it } from "vitest"

import {
  MAX_LAG,
  REACH,
  dryness,
  makeStroke,
  pace,
  paintAt,
  pointAt,
  radiusAt,
  reach,
  widthAt,
} from "./brush"

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 1)

describe("oil ring stroke", () => {
  it("paints the same ring for the same seed, and a different one for another", () => {
    expect(makeStroke(42)).toEqual(makeStroke(42))
    expect(makeStroke(42)).not.toEqual(makeStroke(43))
  })

  it("closes: the brush travels a little over a turn and the tail passes beside the head", () => {
    for (const seed of seeds) {
      const s = makeStroke(seed)
      expect(s.sweep).toBeGreaterThan(Math.PI * 2)
      expect(radiusAt(s, 1)).toBeGreaterThan(radiusAt(s, 0))
    }
  })

  it("keeps every flick, drop and fleck inside the canvas", () => {
    for (const seed of seeds) {
      const s = makeStroke(seed)
      expect(reach(s)).toBeLessThanOrEqual(REACH)
      for (const f of s.flecks)
        expect(radiusAt(s, f.at) + Math.abs(f.off)).toBeLessThan(REACH)
    }
  })

  it("never pinches to nothing and lifts thinner than it lands at its fullest", () => {
    for (const seed of seeds.slice(0, 40)) {
      const s = makeStroke(seed)
      const widths = Array.from({ length: 201 }, (_, i) => widthAt(s, i / 200))
      expect(Math.min(...widths)).toBeGreaterThan(0)
      expect(widthAt(s, 1)).toBeLessThan(Math.max(...widths) / 2)
    }
  })

  it("lays solid paint early and runs dry by the end", () => {
    const s = makeStroke(7)
    const share = (u: number) =>
      s.bristles.filter((b) => paintAt(b, u) > 0.5).length / s.bristles.length
    expect(share(0.2)).toBeGreaterThan(0.8)
    expect(share(0.99)).toBeLessThan(0.35)
    expect(dryness(1)).toBeGreaterThan(dryness(0.5))
  })

  it("trails its edge bristles no further than MAX_LAG, so the head is round", () => {
    const s = makeStroke(11)
    for (const b of s.bristles) expect(b.lag).toBeLessThanOrEqual(MAX_LAG)
    const middle = s.bristles.reduce((a, b) =>
      Math.abs(b.offset) < Math.abs(a.offset) ? b : a
    )
    const edge = s.bristles.reduce((a, b) =>
      Math.abs(b.offset) > Math.abs(a.offset) ? b : a
    )
    expect(edge.lag).toBeGreaterThan(middle.lag)
  })

  it("puts the centre line on the ring and the edges either side of it", () => {
    const s = makeStroke(3)
    const r = (across: number) =>
      Math.hypot(...Object.values(pointAt(s, 0.4, across)))
    expect(r(0)).toBeCloseTo(radiusAt(s, 0.4), 6)
    expect(r(0.5)).toBeGreaterThan(r(0))
    expect(r(-0.5)).toBeLessThan(r(0))
  })
})

describe("pace", () => {
  it("runs 0 to 1, slow to land, fastest past halfway, slow to close", () => {
    expect(pace(0)).toBe(0)
    expect(pace(1)).toBeCloseTo(1, 10)
    expect(pace(0.1)).toBeLessThan(0.05)
    expect(pace(0.7) - pace(0.6)).toBeGreaterThan(pace(0.2) - pace(0.1))
    expect(pace(1) - pace(0.95)).toBeLessThan(pace(0.7) - pace(0.65))
    for (let t = 0; t < 1; t += 0.01)
      expect(pace(t + 0.01)).toBeGreaterThanOrEqual(pace(t))
  })
})
