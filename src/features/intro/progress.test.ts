import { describe, expect, it } from "vitest"

import { FULL, HOLD_AT, MAX_STEP_MS, ease, progressAt, tick } from "./progress"

/** Speed of the curve around t */
const speed = (t: number) => (ease(t + 0.005) - ease(t - 0.005)) / 0.01

describe("ease", () => {
  it("runs from 0 to 1 and clamps outside", () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(-1)).toBe(0)
    expect(ease(2)).toBe(1)
  })

  it("never goes backwards", () => {
    for (let t = 0; t < 1; t += 0.01)
      expect(ease(t + 0.01)).toBeGreaterThanOrEqual(ease(t))
  })

  it("is slow, then medium, then fast, then slow", () => {
    const start = speed(0.05)
    const middle = speed(0.35)
    const peak = speed(2 / 3)
    const end = speed(0.98)
    expect(start).toBeLessThan(middle)
    expect(middle).toBeLessThan(peak)
    expect(end).toBeLessThan(middle)
    expect(start).toBeGreaterThan(0)
  })
})

describe("tick", () => {
  it("waits at HOLD_AT while the page is not ready", () => {
    let clock = 0
    for (let i = 0; i < 500; i++) clock = tick(clock, 16, false, FULL)
    expect(clock).toBe(FULL.fillMs * HOLD_AT)
    expect(progressAt(clock, FULL)).toBeLessThan(100)
  })

  it("plays the curve to the end once ready", () => {
    let clock = 0
    for (let i = 0; i < 500; i++) clock = tick(clock, 16, true, FULL)
    expect(progressAt(clock, FULL)).toBe(100)
  })

  it("never steps more than MAX_STEP_MS, so a stalled frame cannot jump", () => {
    expect(tick(100, 2000, true, FULL)).toBe(100 + MAX_STEP_MS)
  })

  it("never goes backwards", () => {
    expect(tick(500, -16, true, FULL)).toBe(500)
  })
})
