/** Keeps the palette's two homes in step: src/theme/palette.ts (for three.js) and the custom properties in src/index.css */
import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { METAL, NEUTRAL } from "../src/theme/palette.ts"

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
// The 404 page is static, outside the bundle, so it repeats a few palette values by hand
const notFound = readFileSync(
  new URL("../public/404.css", import.meta.url),
  "utf8"
).toLowerCase()

/** The body of the first rule whose selector is exactly `selector` */
function block(selector: string) {
  const start = css.indexOf(`\n${selector} {`)
  expect(start, `${selector} block in index.css`).toBeGreaterThanOrEqual(0)
  return css.slice(start, css.indexOf("\n}", start))
}

const declared = (body: string, name: string) =>
  new RegExp(`--${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim().toLowerCase()

describe("palette", () => {
  it("declares every neutral step in :root with the same value", () => {
    const root = block(":root")
    for (const [step, hex] of Object.entries(NEUTRAL)) {
      expect(declared(root, `meiou-${step}`), `--meiou-${step}`).toBe(hex)
    }
  })

  it("declares the metal steps per theme with the same values", () => {
    for (const [theme, selector] of [
      ["light", ":root"],
      ["dark", ".dark"],
    ] as const) {
      const body = block(selector)
      for (const [step, hex] of Object.entries(METAL[theme])) {
        expect(
          declared(body, `metal-${step}`),
          `${theme} --metal-${step}`
        ).toBe(hex)
      }
    }
  })

  it("keeps the 404 page on palette values", () => {
    const allowed = new Set<string>([
      ...Object.values(NEUTRAL),
      ...Object.values(METAL.light),
      ...Object.values(METAL.dark),
    ])
    const used = notFound.match(/#[0-9a-f]{6}\b/g) ?? []
    expect(used.length).toBeGreaterThan(0)
    for (const hex of used) expect(allowed, hex).toContain(hex)
  })

  it("never uses pure white or pure black", () => {
    const values = [
      ...Object.values(NEUTRAL),
      ...Object.values(METAL.light),
      ...Object.values(METAL.dark),
    ]
    expect(values).not.toContain("#ffffff")
    expect(values).not.toContain("#000000")
    expect(css).not.toMatch(/oklch\((0|1) 0 0/)
  })
})
