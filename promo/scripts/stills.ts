/**
 * Contact sheet frames for review: bundles once, then renders the given frames as stills.
 *
 *   node scripts/stills.ts 3d-art 60 165 400   → out/stills/3d-art-<frame>.jpg
 */
import { mkdirSync } from "node:fs"
import { join } from "node:path"

import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"

const [id = "3d-art", ...frames] = process.argv.slice(2)
const root = join(import.meta.dirname, "..")
const out = join(root, "out", "stills")
mkdirSync(out, { recursive: true })

const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts") })
const chromiumOptions = { gl: "angle" } as const
const composition = await selectComposition({ serveUrl, id, chromiumOptions })
for (const frame of frames.map(Number)) {
  const output = join(out, `${id}-${frame}.jpg`)
  await renderStill({
    serveUrl,
    composition,
    frame,
    output,
    imageFormat: "jpeg",
    jpegQuality: 88,
    chromiumOptions,
  })
  console.log(output)
}
