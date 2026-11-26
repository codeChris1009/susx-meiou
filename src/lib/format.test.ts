import { describe, expect, it } from "vitest"

import { displayDate, displayUrl, pad } from "./format"

describe("format", () => {
  it("pads to two digits and leaves longer numbers alone", () => {
    expect(pad(7)).toBe("07")
    expect(pad(12)).toBe("12")
    expect(pad(120)).toBe("120")
  })

  it("strips scheme and trailing slash from an address", () => {
    expect(displayUrl("https://a.example/b/")).toBe("a.example/b")
    expect(displayUrl("http://a.example")).toBe("a.example")
  })

  it("dots an ISO date", () => {
    expect(displayDate("2026-11-26T12:28:30Z")).toBe("2026.11.26")
  })
})
