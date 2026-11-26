import { describe, expect, it } from "vitest"

import {
  decodeEntities,
  hostOf,
  isApiUrl,
  normalizeSiteUrl,
  parseSiteMeta,
  pickSiteUrl,
} from "./discover.ts"

describe("hostOf", () => {
  it.each([
    ["https://fovea.susx.workers.dev/", "cloudflare"],
    ["https://x.pages.dev/", "cloudflare"],
    ["https://codechris1009.github.io/yi-64/", "github-pages"],
    ["https://x.vercel.app/", "vercel"],
    ["https://example.com/", "other"],
  ])("%s → %s", (url, host) => {
    expect(hostOf(url)).toBe(host)
  })
})

describe("isApiUrl", () => {
  it("flags api subdomains and /api paths", () => {
    expect(isApiUrl("https://pokemon-rivals-api.susx.workers.dev/")).toBe(true)
    expect(isApiUrl("https://api.example.com/")).toBe(true)
    expect(isApiUrl("https://x.workers.dev/api/v1/health")).toBe(true)
  })

  it("keeps sites whose names merely contain api", () => {
    expect(isApiUrl("https://rapid.workers.dev/")).toBe(false)
    expect(isApiUrl("https://x.workers.dev/apiary")).toBe(false)
  })
})

describe("normalizeSiteUrl", () => {
  it("keeps the repository segment of a project Pages site", () => {
    expect(normalizeSiteUrl("https://u.github.io/yi-64/index.html")).toBe(
      "https://u.github.io/yi-64/"
    )
  })

  it("maps deep links on other hosts to the origin", () => {
    expect(normalizeSiteUrl("https://g.susx.workers.dev/leaders")).toBe(
      "https://g.susx.workers.dev/"
    )
  })
})

describe("pickSiteUrl", () => {
  it("prefers homepage, then deployment, then Pages", () => {
    expect(
      pickSiteUrl([
        { source: "pages", url: "https://u.github.io/a/" },
        { source: "deployment", url: "https://a.susx.workers.dev/x" },
      ])
    ).toBe("https://a.susx.workers.dev/")
    expect(
      pickSiteUrl([
        { source: "deployment", url: "https://a.susx.workers.dev/" },
        { source: "homepage", url: "https://a.example.com/" },
      ])
    ).toBe("https://a.example.com/")
  })

  it("skips API deployments and non-http values", () => {
    expect(
      pickSiteUrl([
        { source: "deployment", url: "https://a-api.susx.workers.dev/" },
        { source: "homepage", url: "" },
        { source: "pages", url: "https://u.github.io/a/" },
      ])
    ).toBe("https://u.github.io/a/")
  })

  it("returns null when nothing is a site", () => {
    expect(pickSiteUrl([])).toBeNull()
  })
})

describe("parseSiteMeta", () => {
  it("reads title and description in either attribute order", () => {
    const html = `<head><title> A &amp; B </title>
      <meta content="說明 &middot; 文字" name="description"></head>`
    expect(parseSiteMeta(html)).toEqual({
      title: "A & B",
      description: "說明 · 文字",
    })
  })

  it("ignores og:description and returns null for missing fields", () => {
    const html = `<meta property="og:description" content="x"><title></title>`
    expect(parseSiteMeta(html)).toEqual({ title: null, description: null })
  })
})

describe("decodeEntities", () => {
  it("decodes numeric and named entities, leaves unknown ones", () => {
    expect(decodeEntities("&#8216;x&#x2019; &foo;")).toBe("‘x’ &foo;")
  })
})
