/**
 * Checks a film's captures before it is cut: each live clip's start, middle and end, and every still, laid out as one
 * contact sheet, so an interaction that never happened (a click that missed, a page still loading) shows at a glance.
 *
 *   node scripts/peek.ts gym-leaders              → out/peek/gym-leaders.jpg
 *   node scripts/peek.ts gym-leaders kalos list   → only those captures
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"

import { chromium } from "playwright-core"

const [id, ...only] = process.argv.slice(2)
if (!id) throw new Error("Which film? node scripts/peek.ts <id> [capture…]")
const root = join(import.meta.dirname, "..")
const dir = join(root, "public", id, "capture")
const tmp = join(root, "out", "peek", id)
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })
const ffmpeg = join(root, "node_modules", ".bin", "remotion")

const tiles: { label: string; file: string }[] = []
for (const name of readdirSync(dir).sort()) {
  const stem = name.replace(/\.\w+$/, "")
  if (only.length && !only.includes(stem)) continue
  if (name.endsWith(".jpg")) tiles.push({ label: stem, file: join(dir, name) })
  if (!name.endsWith(".mp4")) continue
  // Remotion's bundled ffmpeg has no select or thumbnail filter: seek by the clip's own length
  const length = Number(
    execFileSync(ffmpeg, [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      join(dir, name),
    ]).toString()
  )
  for (const [tag, at] of [
    ["start", 0.3],
    ["mid", length / 2],
    ["end", length - 0.3],
  ] as const) {
    const file = join(tmp, `${stem}-${tag}.jpg`)
    execFileSync(ffmpeg, [
      "ffmpeg",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      at.toFixed(2),
      "-i",
      join(dir, name),
      "-vf",
      "scale=480:-1",
      "-frames:v",
      "1",
      file,
    ])
    tiles.push({ label: `${stem} ${tag}`, file })
  }
}

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1200, height: 300 } })
await page.setContent(
  `<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;font:13px sans-serif;color:#eee}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:4px;top:2px;background:#000b;padding:0 4px}</style>` +
    tiles
      .map(
        (t) =>
          `<figure><img src="data:image/jpeg;base64,${readFileSync(t.file).toString("base64")}"><figcaption>${t.label}</figcaption></figure>`
      )
      .join("")
)
const out = join(root, "out", "peek", `${id}.jpg`)
await page.screenshot({ path: out, type: "jpeg", quality: 75, fullPage: true })
await browser.close()
console.log(out)
