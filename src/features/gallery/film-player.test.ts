import { describe, expect, it } from "vitest"

import { pace } from "@/components/oil-ring/brush"

import {
  FILM,
  RING_RADIUS,
  approach,
  irisAt,
  paintable,
  readiness,
} from "./film-player"
import { SCREEN_FULL } from "./ring"

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

describe("the opening", () => {
  it("starts just inside the painted ring and ends covering the piece", () => {
    expect(irisAt(0)).toBeLessThan(RING_RADIUS)
    expect(irisAt(0)).toBeGreaterThan(RING_RADIUS - 0.08)
    expect(irisAt(1)).toBeCloseTo(SCREEN_FULL)
    for (let k = 0; k < 1; k += 0.05)
      expect(irisAt(k + 0.05)).toBeGreaterThan(irisAt(k))
  })
})
