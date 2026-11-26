import { describe, expect, it } from "vitest"

import { byFileStem } from "./assets"

describe("byFileStem", () => {
  it("keys asset URLs by file name, dots in the name included", () => {
    expect(
      byFileStem({
        "/src/assets/shots/fovea.jpg": "/assets/fovea-abc.jpg",
        "/src/assets/shots/name-0.0.0.jpg": "/assets/n-1.jpg",
        "/src/assets/gallery/yi-64.webp": "/assets/yi-64-2.webp",
      })
    ).toEqual({
      fovea: "/assets/fovea-abc.jpg",
      "name-0.0.0": "/assets/n-1.jpg",
      "yi-64": "/assets/yi-64-2.webp",
    })
  })
})
