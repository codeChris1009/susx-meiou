import { describe, expect, it } from "vitest"

import { actionVariants } from "./action"

const tokens = (classes: string) => classes.split(/\s+/)

describe("actionVariants", () => {
  // Regression: overrides used to be appended, and the base utility could win in the stylesheet (the header nav
  // stayed visible on phones because inline-flex outranked hidden)
  it("lets an override replace the base utility it conflicts with", () => {
    const nav = tokens(
      actionVariants({ tone: "quiet", className: "hidden sm:inline-flex" })
    )
    expect(nav).toContain("hidden")
    expect(nav).not.toContain("inline-flex")

    const small = tokens(actionVariants({ tone: "outline", className: "h-9" }))
    expect(small).toContain("h-9")
    expect(small).not.toContain("h-11")
  })

  it("defaults to the outline tone", () => {
    expect(actionVariants()).toBe(actionVariants({ tone: "outline" }))
  })
})
