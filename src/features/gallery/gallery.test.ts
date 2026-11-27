import { describe, expect, it } from "vitest"

import type { SyncedProject } from "@/features/projects/types"

import { HANG, buildGallery } from "./pieces"
import {
  TAU,
  angleFor,
  fitFov,
  focusOf,
  indexAt,
  nearestAngle,
  offFront,
  ringTouches,
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

  it("counts the cursor ring as on the frame while its edge touches it", () => {
    const frame = { x: 500, y: 300, w: 600, h: 400 }
    expect(ringTouches(500, 300, 0, frame)).toBe(true)
    // Right edge at x 800: a 38 px ring 30 px out still touches, 50 px out does not
    expect(ringTouches(830, 300, 38, frame)).toBe(true)
    expect(ringTouches(850, 300, 38, frame)).toBe(false)
    // Off the corner (800, 500) by 30 px each way: 42 px away
    expect(ringTouches(830, 530, 38, frame)).toBe(false)
    expect(ringTouches(825, 525, 38, frame)).toBe(true)
  })
})

describe("buildGallery", () => {
  const images = Object.fromEntries(HANG.map((p) => [p.id, `/a/${p.id}.webp`]))

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

  it("never links a site whose address is not http(s)", () => {
    const bad = { ...project("fovea"), url: "javascript:alert(1)" }
    const gallery = buildGallery(HANG, [bad], images)
    expect(gallery.find((p) => p.id === "fovea")?.href).toBeNull()
  })

  it("leaves out a piece whose image is missing", () => {
    const some = Object.fromEntries(Object.entries(images).slice(0, 2))
    expect(buildGallery(HANG, [], some)).toHaveLength(2)
  })

  it("gives a piece its film by id, and the rest none", () => {
    const gallery = buildGallery(HANG, [], images, {
      "art-gallery": "/f/art-gallery.mp4",
    })
    expect(gallery.find((p) => p.id === "art-gallery")?.film).toBe(
      "/f/art-gallery.mp4"
    )
    expect(gallery.filter((p) => p.film)).toHaveLength(1)
  })

  it("hangs nine pieces, titles in Latin for the script face", () => {
    expect(HANG).toHaveLength(9)
    for (const { title } of HANG) expect(title).toMatch(/^[ -ÿ]+$/)
  })

  it("labels every piece without punctuation, an English name over a Chinese line", () => {
    for (const { title, name, caption } of HANG) {
      for (const text of [title, name, caption])
        expect(text).not.toMatch(/\p{P}/u)
      expect(name).toMatch(/^[\p{Script=Latin}\d ]+$/u)
      expect(caption).toMatch(/\p{Script=Han}/u)
    }
  })
})
