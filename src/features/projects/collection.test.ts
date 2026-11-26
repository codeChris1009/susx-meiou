import { describe, expect, it } from "vitest"

import {
  DEFAULT_SORT,
  defaultPresentation,
  filterEntries,
  groupEntries,
  isFiltered,
  nextSort,
  number,
  present,
  sortEntries,
  stacksOf,
} from "./collection"
import type { Project } from "./types"

const project = (over: Partial<Project> & { repo: string }): Project => ({
  url: `https://${over.repo}.example`,
  host: "cloudflare",
  sourceUrl: null,
  language: "TypeScript",
  title: over.repo,
  description: "",
  pushedAt: "2026-01-01T00:00:00Z",
  online: true,
  shot: null,
  ...over,
})

const entries = number([
  project({
    repo: "fovea",
    title: "Fovea",
    description: "公司官方長文的閱讀站",
    pushedAt: "2026-11-26T00:00:00Z",
  }),
  project({
    repo: "yi-64",
    title: "YI 64",
    host: "github-pages",
    pushedAt: "2026-09-18T00:00:00Z",
  }),
  project({
    repo: "todo",
    title: "Todo List",
    language: "JavaScript",
    host: "github-pages",
    pushedAt: "2025-08-27T00:00:00Z",
  }),
  project({
    repo: "shelf",
    title: "Neon Bookshelf",
    language: null,
    pushedAt: "2026-01-19T00:00:00Z",
  }),
])

describe("number", () => {
  it("numbers entries in curated order from 1", () => {
    expect(entries.map((e) => e.no)).toEqual([1, 2, 3, 4])
  })
})

describe("stacksOf", () => {
  it("lists stacks most used first and names a missing language Other", () => {
    expect(stacksOf(entries)).toEqual(["TypeScript", "JavaScript", "Other"])
  })
})

describe("filterEntries", () => {
  it("matches every term, case-insensitively, across name, note, stack and host", () => {
    const names = (query: string) =>
      filterEntries(entries, { query, stack: null }).map((e) => e.repo)
    expect(names("FOVEA")).toEqual(["fovea"])
    expect(names("閱讀")).toEqual(["fovea"])
    expect(names("pages javascript")).toEqual(["todo"])
    expect(names("2026")).toEqual(["fovea", "yi-64", "shelf"])
    expect(names("   ")).toHaveLength(4)
    expect(names("nothing-like-this")).toEqual([])
  })

  it("keeps one stack", () => {
    const kept = filterEntries(entries, { query: "", stack: "Other" })
    expect(kept.map((e) => e.repo)).toEqual(["shelf"])
  })
})

describe("sortEntries", () => {
  it("sorts by name and by date, ties keeping the curated order", () => {
    expect(
      sortEntries(entries, { key: "name", dir: "asc" }).map((e) => e.no)
    ).toEqual([1, 4, 3, 2])
    expect(
      sortEntries(entries, { key: "updated", dir: "desc" }).map((e) => e.no)
    ).toEqual([1, 2, 4, 3])
    expect(
      sortEntries(entries, { key: "host", dir: "asc" }).map((e) => e.no)
    ).toEqual([1, 4, 2, 3])
  })

  it("does not mutate its input", () => {
    const before = entries.map((e) => e.no)
    sortEntries(entries, { key: "name", dir: "desc" })
    expect(entries.map((e) => e.no)).toEqual(before)
  })
})

describe("nextSort", () => {
  it("cycles a column ascending, descending, then back to the curated order", () => {
    const a = nextSort(DEFAULT_SORT, "name")
    expect(a).toEqual({ key: "name", dir: "asc" })
    const b = nextSort(a, "name")
    expect(b).toEqual({ key: "name", dir: "desc" })
    expect(nextSort(b, "name")).toEqual(DEFAULT_SORT)
  })

  it("starts dates newest first", () => {
    expect(nextSort(DEFAULT_SORT, "updated")).toEqual({
      key: "updated",
      dir: "desc",
    })
    expect(nextSort({ key: "updated", dir: "desc" }, "updated")).toEqual({
      key: "updated",
      dir: "asc",
    })
  })
})

describe("groupEntries", () => {
  it("puts everything in one unnamed group when ungrouped", () => {
    const groups = groupEntries(entries, "none")
    expect(groups).toHaveLength(1)
    expect(groups[0]!.key).toBe("")
  })

  it("orders years newest first and stacks largest first", () => {
    expect(groupEntries(entries, "year").map((g) => g.key)).toEqual([
      "2026",
      "2025",
    ])
    expect(
      groupEntries(entries, "stack").map((g) => [g.key, g.entries.length])
    ).toEqual([
      ["TypeScript", 2],
      ["JavaScript", 1],
      ["Other", 1],
    ])
    expect(groupEntries(entries, "host").map((g) => g.key)).toEqual([
      "Cloudflare",
      "GitHub Pages",
    ])
  })
})

describe("present", () => {
  it("filters, then sorts, then groups, and counts what is left", () => {
    const { groups, count } = present(entries, {
      ...defaultPresentation("table"),
      query: "2026",
      group: "host",
      sort: { key: "name", dir: "asc" },
    })
    expect(count).toBe(3)
    expect(groups.map((g) => [g.key, g.entries.map((e) => e.repo)])).toEqual([
      ["Cloudflare", ["fovea", "shelf"]],
      ["GitHub Pages", ["yi-64"]],
    ])
  })
})

describe("isFiltered", () => {
  it("ignores the view, notices everything else", () => {
    expect(isFiltered(defaultPresentation("list"))).toBe(false)
    expect(isFiltered({ ...defaultPresentation(), query: " x " })).toBe(true)
    expect(isFiltered({ ...defaultPresentation(), group: "year" })).toBe(true)
    expect(
      isFiltered({ ...defaultPresentation(), sort: { key: "no", dir: "desc" } })
    ).toBe(true)
  })
})
