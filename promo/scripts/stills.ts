/**
 * Frames for review: bundles once, renders the frames asked for as stills, and lays them out as one contact sheet.
 *
 *   node scripts/stills.ts 3d-art 60 165 400     → out/stills/3d-art-<frame>.jpg
 *   node scripts/stills.ts anthology --every=2   → a frame every 2 seconds, and out/stills/anthology-sheet.jpg
 */
import { mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"
import { chromium } from "playwright-core"

const [id = "3d-art", ...args] = process.argv.slice(2)
const root = join(import.meta.dirname, "..")
const out = join(root, "out", "stills")
mkdirSync(out, { recursive: true })

const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts") })
const chromiumOptions = { gl: "angle" } as const
const composition = await selectComposition({ serveUrl, id, chromiumOptions })
const every = Number(
  args.find((a) => a.startsWith("--every="))?.split("=")[1] ?? 0
)
const frames = every
  ? Array.from(
      {
        length: Math.floor(
          composition.durationInFrames / (every * composition.fps)
        ),
      },
      (_, k) => Math.round((k + 0.5) * every * composition.fps)
    )
  : args.filter((a) => !a.startsWith("--")).map(Number)

const files: string[] = []
for (const frame of frames) {
  const output = join(out, `${id}-${frame}.jpg`)
  await renderStill({
    serveUrl,
    composition,
    frame,
    output,
    imageFormat: "jpeg",
    jpegQuality: 85,
    chromiumOptions,
    scale: every ? 0.5 : 1,
  })
  files.push(output)
  console.log(output)
}

if (every) {
  const browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage({ viewport: { width: 1200, height: 300 } })
  const fps = composition.fps
  await page.setContent(
    `<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;font:15px sans-serif;color:#eee}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:4px;top:2px;background:#000b;padding:0 5px}</style>` +
      files
        .map(
          (f, k) =>
            `<figure><img src="data:image/jpeg;base64,${readFileSync(f).toString("base64")}"><figcaption>${(frames[k]! / fps).toFixed(1)}s</figcaption></figure>`
        )
        .join("")
  )
  const sheet = join(out, `${id}-sheet.jpg`)
  await page.screenshot({
    path: sheet,
    type: "jpeg",
    quality: 82,
    fullPage: true,
  })
  await browser.close()
  console.log(sheet)
}
