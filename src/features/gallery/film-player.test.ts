import { describe, expect, it } from "vitest"

import {
  FILM,
  IRIS_FROM,
  pace,
  approach,
  irisAt,
  paintable,
  readiness,
} from "./film-player"
import { coverFrom } from "./ring"

const media = (readyState: number, buffered: number, duration = 31) => ({
  readyState,
  duration,
  buffered: {
    length: buffered ? 1 : 0,
    start: () => 0,
    end: () => buffered,
  } as unknown as TimeRanges,
})

describe("film readiness", () => {
  it("is whole once the browser can play through", () => {
    expect(readiness(media(4, 1))).toBe(1)
  })

  it("is the buffered share of what it needs before that", () => {
    expect(readiness(media(2, FILM.buffer / 2))).toBeCloseTo(0.5)
    expect(readiness(media(1, 0))).toBe(0)
  })

  it("needs no more than the whole of a short film", () => {
    expect(readiness(media(3, 4, 4))).toBe(1)
  })
})

describe("painting the ring while the film loads", () => {
  it("follows the brush's pace once the film is in hand", () => {
    for (const t of [0, 400, 1000, FILM.paint])
      expect(paintable(t, 1)).toBeCloseTo(pace(t / FILM.paint))
  })

  it("holds short of closing until enough has loaded", () => {
    expect(paintable(FILM.paint * 3, 0)).toBeLessThan(0.2)
    expect(paintable(FILM.paint * 3, 0.5)).toBeLessThan(1)
    expect(paintable(FILM.paint * 3, 0.5)).toBeGreaterThan(
      paintable(FILM.paint * 3, 0)
    )
  })

  it("never runs backwards and never snaps shut when the film arrives at once", () => {
    expect(approach(0.6, 0.3, 16)).toBe(0.6)
    const step = approach(0.3, 1, 16) - 0.3
    expect(step).toBeCloseTo(16 * FILM.catchUp)
    expect(approach(0.99, 1, 1000)).toBe(1)
  })

  it("catches up faster than the brush ever moves, so a ready film never waits on it", () => {
    const fastest = Math.max(
      ...Array.from(
        { length: 100 },
        (_, i) => pace((i + 1) / 100) - pace(i / 100)
      )
    )
    expect(FILM.catchUp).toBeGreaterThan(fastest / (FILM.paint / 100))
  })
})

describe("pace", () => {
  it("runs 0 to 1, slow to start, fastest past halfway, slow to close", () => {
    expect(pace(0)).toBe(0)
    expect(pace(1)).toBeCloseTo(1, 10)
    expect(pace(0.1)).toBeLessThan(0.05)
    expect(pace(0.7) - pace(0.6)).toBeGreaterThan(pace(0.2) - pace(0.1))
    for (let t = 0; t < 1; t += 0.01)
      expect(pace(t + 0.01)).toBeGreaterThanOrEqual(pace(t))
  })
})

describe("the opening", () => {
  it("grows from a pinprick under the pointer to cover the piece from there", () => {
    const full = coverFrom(0.2, 0.7)
    expect(irisAt(0, full)).toBe(IRIS_FROM)
    expect(irisAt(1, full)).toBeCloseTo(full)
    for (let k = 0; k < 1; k += 0.05)
      expect(irisAt(k + 0.05, full)).toBeGreaterThan(irisAt(k, full))
  })

  it("reaches further from a corner than from the centre", () => {
    expect(coverFrom(0, 0)).toBeGreaterThan(coverFrom(0.5, 0.5))
    expect(coverFrom(0, 0)).toBeCloseTo(coverFrom(1, 1))
    // From the centre: half the width (1.5 heights wide) and half the height, plus the margin
    expect(coverFrom(0.5, 0.5)).toBeCloseTo(Math.hypot(0.75, 0.5) + 0.08)
  })
})

describe("replay", () => {
  it("opens a closing film again from where it had closed to", () => {
    const full = coverFrom(0.5, 0.5)
    expect(irisAt(0, full, 0.4)).toBe(0.4)
    expect(irisAt(1, full, 0.4)).toBeCloseTo(full)
    expect(irisAt(0.5, full, 0.4)).toBeGreaterThan(irisAt(0.5, full))
  })
})
