/**
 * Screenshots each live site into src/assets/shots/<repo>.jpg, where Vite fingerprints them into the build.
 *
 *   pnpm shots          # only projects that have no screenshot yet (what CI runs after a sync)
 *   pnpm shots --all    # recapture everything, e.g. after a redesign
 *   pnpm shots fovea    # recapture the named repositories
 *
 * None of the sites publish an og:image, so this is the only picture of them we have. WebGL / WebGPU scenes need a
 * real GPU: CI runs headless on software rendering and may capture a blank stage; recapture those locally.
 */
import { existsSync } from "node:fs"
import { mkdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

import type { SyncFile } from "../src/features/projects/types.ts"

const DATA = new URL("../src/data/projects.json", import.meta.url)
const SHOTS = fileURLToPath(new URL("../src/assets/shots/", import.meta.url))
const VIEWPORT = { width: 1280, height: 800 }
// Most of these open on an intro animation; give it time to reach the first real frame
const SETTLE_MS = Number(process.env.SHOT_SETTLE_MS ?? 6000)

const args = process.argv.slice(2)
const all = args.includes("--all")
const named = new Set(args.filter((a) => !a.startsWith("--")))

const { projects } = JSON.parse(await readFile(DATA, "utf8")) as SyncFile
const pathFor = (repo: string) => `${SHOTS}${repo}.jpg`
const targets = projects.filter(
  (p) =>
    p.online &&
    (named.size ? named.has(p.repo) : all || !existsSync(pathFor(p.repo)))
)

if (!targets.length) {
  console.log("Every live project already has a screenshot")
  process.exit(0)
}

await mkdir(SHOTS, { recursive: true })
// The installed Google Chrome, not a downloaded build: nothing to fetch, it is preinstalled on GitHub's Ubuntu
// runners, and it has the GPU paths (WebGPU) a headless shell lacks
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist"],
})
let failed = 0
try {
  for (const p of targets) {
    const page = await browser.newPage({
      viewport: VIEWPORT,
      colorScheme: "dark",
      reducedMotion: "no-preference",
    })
    try {
      await page.goto(p.url, { waitUntil: "load", timeout: 30_000 })
      await page.waitForTimeout(SETTLE_MS)
      await page.screenshot({
        path: pathFor(p.repo),
        type: "jpeg",
        quality: 72,
      })
      console.log(`✓ ${p.repo}`)
    } catch (error) {
      failed++
      console.error(`✘ ${p.repo}: ${(error as Error).message.split("\n")[0]}`)
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
// A missing screenshot is not fatal: the card falls back to a typographic cover
if (failed) console.warn(`${failed} screenshot(s) failed`)
