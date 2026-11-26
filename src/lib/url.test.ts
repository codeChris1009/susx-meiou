import { describe, expect, it } from "vitest"

import { isWebUrl } from "./url"

describe("isWebUrl", () => {
  it("accepts absolute http and https URLs", () => {
    expect(isWebUrl("https://fovea.susx.workers.dev/")).toBe(true)
    expect(isWebUrl("http://example.com/a?b=c")).toBe(true)
  })

  it("rejects script, data and relative URLs, and empty values", () => {
    for (const bad of [
      "javascript:alert(1)",
      " JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:x",
      "//example.com",
      "example.com",
      "/relative",
      "",
      null,
      undefined,
    ])
      expect(isWebUrl(bad)).toBe(false)
  })
})
