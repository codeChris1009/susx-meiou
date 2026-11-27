/**
 * Takes a film's pictures from the live site: stills, tall full-page stills and live clips, as its capture.ts lists them.
 * Clips are recorded from Chrome's screencast (every repaint, with its timestamp), resampled to 30 fps and encoded with
 * Remotion's ffmpeg; the pointer's glides are saved beside them so the film can draw a cursor in its own style.
 *
 *   node scripts/capture.ts anthology                 → public/anthology/capture/*.jpg|.mp4|.json
 *   node scripts/capture.ts anthology artisanal-drag  → only the shots named
 *   node scripts/capture.ts scan https://… [--dark] [--step=1080] [--max=40]
 *                                                     → out/scan/<host>.jpg, a contact sheet of the page, a screen a tile
 *
 * Uses the installed Chrome (playwright-core, channel "chrome"): nothing to download, and WebGL/WebGPU as a visitor sees it.
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { type Page, chromium } from "playwright-core"

import type {
  CapturePlan,
  PointerTrack,
  Step,
  Target,
} from "../src/kit/capture-plan.ts"

const ROOT = join(import.meta.dirname, "..")
const FPS = 30
const FFMPEG = join(ROOT, "node_modules", ".bin", "remotion")

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** The pointer, moved in small eased steps so the page sees a hand rather than a teleport, every position logged */
class Hand {
  x = 0
  y = 0
  down = false
  log: { at: number; x: number; y: number; down: boolean }[] = []
  private readonly page: Page
  constructor(page: Page) {
    this.page = page
  }

  private note() {
    this.log.push({
      at: Date.now() / 1000,
      x: this.x,
      y: this.y,
      down: this.down,
    })
  }

  async point(target: Target) {
    if (typeof target !== "string") return { x: target[0], y: target[1] }
    const box = await this.page.locator(target).first().boundingBox()
    if (!box) throw new Error(`Nothing on the page matches ${target}`)
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  async glide(to: { x: number; y: number }, ms: number) {
    const from = { x: this.x, y: this.y }
    const n = Math.max(1, Math.round(ms / 16))
    for (let i = 1; i <= n; i++) {
      const k = ease(i / n)
      this.x = from.x + (to.x - from.x) * k
      this.y = from.y + (to.y - from.y) * k
      await this.page.mouse.move(this.x, this.y)
      this.note()
      await this.page.waitForTimeout(ms / n)
    }
  }

  async press(on: boolean) {
    this.down = on
    await (on ? this.page.mouse.down() : this.page.mouse.up())
    this.note()
  }
}

async function run(page: Page, hand: Hand, step: Step) {
  if ("wait" in step) await page.waitForTimeout(step.wait)
  else if ("wheel" in step) {
    const ms = step.ms ?? 900
    const n = Math.max(1, Math.round(ms / 16))
    for (let i = 0; i < n; i++) {
      await page.mouse.wheel(0, step.wheel / n)
      await page.waitForTimeout(ms / n)
    }
  } else if ("scrollTo" in step) {
    if (typeof step.scrollTo === "number")
      await page.evaluate((y) => window.scrollTo(0, y), step.scrollTo)
    else await page.locator(step.scrollTo).first().scrollIntoViewIfNeeded()
  } else if ("move" in step)
    await hand.glide(await hand.point(step.move), step.ms ?? 700)
  else if ("click" in step) {
    await hand.glide(await hand.point(step.click), step.ms ?? 600)
    await hand.press(true)
    await page.waitForTimeout(70)
    await hand.press(false)
  } else if ("drag" in step) {
    const [a, b] = step.drag
    await hand.glide(await hand.point(a), 500)
    await hand.press(true)
    await hand.glide(await hand.point(b), step.ms ?? 1200)
    await hand.press(false)
  } else if ("type" in step) {
    if (step.into) await page.locator(step.into).first().click()
    await page.keyboard.type(step.type, { delay: step.delay ?? 70 })
  } else if ("press" in step) await page.keyboard.press(step.press)
  else await page.evaluate(step.run)
}

/** Records the screen while `act` runs, for `seconds`, then resamples it to FPS and encodes it */
async function record(
  page: Page,
  hand: Hand,
  seconds: number,
  act: () => Promise<void>,
  out: string
) {
  const cdp = await page.context().newCDPSession(page)
  const frames: { at: number; data: string }[] = []
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({ at: metadata.timestamp ?? Date.now() / 1000, data })
    void cdp
      .send("Page.screencastFrameAck", { sessionId })
      .catch(() => undefined)
  })
  const { width, height } = page.viewportSize()!
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: width,
    maxHeight: height,
  })
  const start = Date.now() / 1000
  hand.log = []
  const acting = act()
  await page.waitForTimeout(seconds * 1000)
  await acting
  await cdp.send("Page.stopScreencast")
  if (!frames.length) throw new Error(`No frames for ${out}`)

  // Each output frame shows the last repaint before its time
  const tmp = `${out}.frames`
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp)
  frames.forEach((f, i) =>
    writeFileSync(join(tmp, `${i}.jpg`), Buffer.from(f.data, "base64"))
  )
  const list: string[] = []
  let shown = -1
  let held = 0
  for (let i = 0; i < seconds * FPS; i++) {
    const t = start + i / FPS
    let k = 0
    while (k + 1 < frames.length && frames[k + 1]!.at <= t) k++
    if (k !== shown && shown >= 0) {
      list.push(`file '${shown}.jpg'`, `duration ${(held / FPS).toFixed(5)}`)
      held = 0
    }
    shown = k
    held++
  }
  list.push(
    `file '${shown}.jpg'`,
    `duration ${(held / FPS).toFixed(5)}`,
    `file '${shown}.jpg'`
  )
  writeFileSync(join(tmp, "list.txt"), list.join("\n"))
  execFileSync(
    FFMPEG,
    [
      "ffmpeg",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      join(tmp, "list.txt"),
      "-vf",
      "format=yuv420p",
      "-r",
      String(FPS),
      "-fps_mode",
      "cfr",
      "-c:v",
      "libx264",
      "-crf",
      "14",
      "-preset",
      "medium",
      "-t",
      String(seconds),
      `${out}.mp4`,
    ],
    { stdio: ["ignore", "ignore", "inherit"] }
  )
  rmSync(tmp, { recursive: true, force: true })

  const track: PointerTrack = {
    width,
    height,
    points: hand.log.map((p) => ({
      t: +(p.at - start).toFixed(3),
      x: Math.round(p.x),
      y: Math.round(p.y),
      down: p.down,
    })),
  }
  if (track.points.length) writeFileSync(`${out}.json`, JSON.stringify(track))
  console.log(`${out}.mp4  ${frames.length} repaints in ${seconds}s`)
}

async function open(
  plan: Pick<CapturePlan, "scheme" | "viewport" | "css" | "time">
) {
  const browser = await chromium.launch({
    channel: "chrome",
    args: [
      "--enable-unsafe-webgpu",
      "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required",
    ],
  })
  const context = await browser.newContext({
    viewport: plan.viewport ?? { width: 1920, height: 1080 },
    colorScheme: plan.scheme ?? "light",
    reducedMotion: "no-preference",
  })
  if (plan.time) await context.clock.install({ time: new Date(plan.time) })
  if (plan.css)
    await context.addInitScript((css) => {
      addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style")
        s.textContent = css
        document.head.append(s)
      })
    }, plan.css)
  return { browser, page: await context.newPage() }
}

async function settle(page: Page, url: string) {
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 60000 })
    .catch(() => undefined)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(2500)
}

async function shoot(id: string, only: string[]) {
  const { CAPTURE } = (await import(join(ROOT, "src", id, "capture.ts"))) as {
    CAPTURE: CapturePlan
  }
  if (!CAPTURE.base)
    throw new Error(
      `${id}: no base address (a private site reads it from promo/.env.local)`
    )
  const dir = join(ROOT, "public", id, "capture")
  mkdirSync(dir, { recursive: true })
  const { browser, page } = await open(CAPTURE)
  const hand = new Hand(page)
  for (const shot of CAPTURE.shots) {
    // A shot continues on the last one's page, so a skipped shot still walks its steps to keep the state
    if (shot.url) await settle(page, new URL(shot.url, CAPTURE.base).href)
    for (const step of shot.steps ?? []) await run(page, hand, step)
    if (only.length && !only.includes(shot.name)) continue
    const out = join(dir, shot.name)
    if (shot.clip) {
      const { seconds, steps = [] } = shot.clip
      await record(
        page,
        hand,
        seconds,
        async () => {
          for (const step of steps) await run(page, hand, step)
        },
        out
      )
    } else {
      await page.screenshot({
        path: `${out}.jpg`,
        type: "jpeg",
        quality: 92,
        fullPage: !!shot.full,
      })
      console.log(`${out}.jpg`)
    }
  }
  await browser.close()
}

/** A page, a screen at a time, as one contact sheet: for choosing shots */
async function scan(url: string, flags: string[]) {
  const flag = (name: string, fallback: number) =>
    Number(
      flags.find((f) => f.startsWith(`--${name}=`))?.split("=")[1] ?? fallback
    )
  const { browser, page } = await open({
    scheme: flags.includes("--dark") ? "dark" : "light",
  })
  await settle(page, url)
  await page.mouse.move(960, 540)
  const tiles: string[] = []
  let last = ""
  for (let i = 0; i < flag("max", 40); i++) {
    const shot = (
      await page.screenshot({ type: "jpeg", quality: 60 })
    ).toString("base64")
    if (shot === last) break
    last = shot
    tiles.push(shot)
    await page.mouse.wheel(0, flag("step", 1080))
    await page.waitForTimeout(1400)
  }
  const sheet = await browser.newPage({
    viewport: { width: 1800, height: 300 },
  })
  await sheet.setContent(
    `<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:4px;font:14px sans-serif;color:#ddd}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:4px;top:2px;background:#000a;padding:0 4px}</style>` +
      tiles
        .map(
          (t, i) =>
            `<figure><img src="data:image/jpeg;base64,${t}"><figcaption>${i}</figcaption></figure>`
        )
        .join("")
  )
  const dir = join(ROOT, "out", "scan")
  mkdirSync(dir, { recursive: true })
  const out = join(
    dir,
    `${new URL(url).host}${new URL(url).pathname.replace(/\W+/g, "-")}.jpg`.replace(
      /-\.jpg$/,
      ".jpg"
    )
  )
  await sheet.screenshot({
    path: out,
    type: "jpeg",
    quality: 80,
    fullPage: true,
  })
  console.log(`${out}  ${tiles.length} screens`)
  await browser.close()
}

const [first = "", ...rest] = process.argv.slice(2)
if (first === "scan") await scan(rest[0] ?? "", rest.slice(1))
else if (first) await shoot(first, rest)
else console.log(readFileSync(import.meta.filename, "utf8").split("*/")[0])
