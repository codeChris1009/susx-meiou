import { describe, expect, it } from "vitest"

import type { SyncedProject } from "@/features/projects/types"

import { HANG, buildGallery, imagesById } from "./pieces"
import {
  TAU,
  angleFor,
  fitFov,
  focusOf,
  indexAt,
  nearestAngle,
  offFront,
} from "./ring"

const project = (repo: string, online = true): SyncedProject => ({
  repo,
  url: `https://example.test/${repo}/`,
  host: "github-pages",
  sourceUrl: null,
  language: null,
  title: repo,
  description: "",
  pushedAt: "2026-01-01T00:00:00Z",
  online,
})

describe("ring", () => {
  it("round-trips index and angle", () => {
    for (let i = 0; i < 9; i++) {
      expect(indexAt(angleFor(i, 9), 9)).toBe(i)
      expect(indexAt(angleFor(i, 9) - TAU * 3, 9)).toBe(i)
    }
  })

  it("takes the short way round", () => {
    // From piece 8 to piece 0 is one step forward, not eight back
    const from = angleFor(8, 9)
    expect(Math.abs(nearestAngle(from, 0, 9) - from)).toBeCloseTo(TAU / 9)
  })

  it("folds the angle off the front into (-π, π]", () => {
    expect(offFront(angleFor(3, 9), 3, 9)).toBeCloseTo(0)
    expect(offFront(angleFor(0, 9), 8, 9)).toBeCloseTo(-TAU / 9)
    expect(offFront(angleFor(0, 9), 1, 9)).toBeCloseTo(TAU / 9)
  })

  it("focuses fully in front and not at all one step away", () => {
    expect(focusOf(0, 9)).toBe(1)
    expect(focusOf(TAU / 9, 9)).toBe(0)
    expect(focusOf(TAU / 18, 9)).toBeCloseTo(0.5)
  })

  it("widens the view on tall screens and keeps it sane", () => {
    expect(fitFov(0.5, 3.6, 5)).toBeGreaterThan(fitFov(1.8, 3.6, 5))
    expect(fitFov(0.2, 3.6, 5)).toBeLessThanOrEqual(78)
    expect(fitFov(4, 3.6, 5)).toBeGreaterThanOrEqual(30)
  })
})

describe("buildGallery", () => {
  const images = imagesById(
    Object.fromEntries(
      HANG.map((p) => [`/src/assets/gallery/${p.id}.webp`, `/a/${p.id}.webp`])
    )
  )

  it("links pieces to their live site and keeps the hang order", () => {
    const gallery = buildGallery(HANG, [project("fovea")], images)
    expect(gallery.map((p) => p.id)).toEqual(HANG.map((p) => p.id))
    expect(gallery.find((p) => p.id === "fovea")?.href).toBe(
      "https://example.test/fovea/"
    )
  })

  it("never links an offline site or a piece without a repository", () => {
    const gallery = buildGallery(HANG, [project("fovea", false)], images)
    expect(gallery.find((p) => p.id === "fovea")?.href).toBeNull()
    expect(gallery.find((p) => p.repo === null)?.href).toBeNull()
  })

  it("leaves out a piece whose image is missing", () => {
    const some = new Map([...images].slice(0, 2))
    expect(buildGallery(HANG, [], some)).toHaveLength(2)
  })

  it("hangs nine pieces, titles in Latin for the script face", () => {
    expect(HANG).toHaveLength(9)
    for (const { title } of HANG) expect(title).toMatch(/^[ -ÿ]+$/)
  })
})
