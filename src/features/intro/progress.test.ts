import { describe, expect, it } from "vitest"

import { FULL, MAX_RATE, READY_CAP, chase, targetAt } from "./progress"

describe("targetAt", () => {
  it("follows time up to the cap while not ready", () => {
    expect(targetAt(0, false, FULL)).toBe(0)
    expect(targetAt(FULL.fillMs / 2, false, FULL)).toBeCloseTo(READY_CAP / 2)
    expect(targetAt(FULL.fillMs * 10, false, FULL)).toBe(READY_CAP)
  })

  it("reaches 100 only once ready and the timeline has played", () => {
    expect(targetAt(100, true, FULL)).toBeLessThan(READY_CAP)
    expect(targetAt(FULL.fillMs, true, FULL)).toBe(100)
  })

  it("treats a clock that runs backwards as zero", () => {
    expect(targetAt(-50, true, FULL)).toBe(0)
  })
})

describe("chase", () => {
  it("never passes the target", () => {
    expect(chase(90, 92, 1000)).toBe(92)
  })

  it("never moves faster than MAX_RATE, so a stalled frame cannot jump", () => {
    // The main thread was blocked for two seconds and the target leapt to 100
    expect(chase(12, 100, 16)).toBeCloseTo(12 + 16 * MAX_RATE)
  })

  it("never goes backwards", () => {
    expect(chase(50, 40, 16)).toBe(50)
    expect(chase(50, 60, -16)).toBe(50)
  })
})
