import { describe, expect, it } from "vitest"

import { buildShowcase, shotsByRepo } from "./showcase.ts"
import type { Curation, SyncedProject } from "./types.ts"

const project = (
  repo: string,
  extra: Partial<SyncedProject> = {}
): SyncedProject => ({
  repo,
  url: `https://${repo}.susx.workers.dev/`,
  host: "cloudflare",
  sourceUrl: null,
  language: "TypeScript",
  title: `${repo} title`,
  description: "",
  pushedAt: "2026-01-01T00:00:00Z",
  online: true,
  ...extra,
})

const curation: Curation = {
  practice: ["todo"],
  order: ["b", "a"],
  overrides: { a: { title: "A!" } },
}

describe("buildShowcase", () => {
  const synced = [
    project("a"),
    project("b"),
    project("todo"),
    project("down", { online: false }),
    project("new-old", { pushedAt: "2026-02-01T00:00:00Z" }),
    project("new-new", { pushedAt: "2026-03-01T00:00:00Z" }),
  ]
  const { featured, practice } = buildShowcase(synced, curation, {
    a: "/a.jpg",
  })

  it("orders curated repos first, then the rest by newest push", () => {
    expect(featured.map((p) => p.repo)).toEqual([
      "b",
      "a",
      "new-new",
      "new-old",
    ])
  })

  it("splits practice work into its own section", () => {
    expect(practice.map((p) => p.repo)).toEqual(["todo"])
  })

  it("drops offline repos", () => {
    const all = [...featured, ...practice].map((p) => p.repo)
    expect(all).not.toContain("down")
  })

  it("applies overrides and attaches screenshots", () => {
    const a = featured.find((p) => p.repo === "a")
    expect(a?.title).toBe("A!")
    expect(a?.shot).toBe("/a.jpg")
    expect(featured.find((p) => p.repo === "b")?.shot).toBeNull()
  })
})

describe("shotsByRepo", () => {
  it("keys screenshot URLs by file name, dots in repo names included", () => {
    expect(
      shotsByRepo({
        "/src/assets/shots/fovea.jpg": "/assets/fovea-abc.jpg",
        "/src/assets/shots/dethveiler-0.0.0.jpg": "/assets/d-1.jpg",
      })
    ).toEqual({
      fovea: "/assets/fovea-abc.jpg",
      "dethveiler-0.0.0": "/assets/d-1.jpg",
    })
  })
})
