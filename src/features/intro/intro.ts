/**
 * Entry loader controller. The markup is static in index.html (it paints with the first frame, before this bundle has
 * even parsed); this drives it: --intro-fill (0..1) for the rising metal, the counter, the sparks, and the exit.
 *
 * Sequence: fill (the ANTHOLOGY mark and the script wordmark fill from below, sparks thrown off the fill line) → 100%, a burst
 * → a short hold so the full mark is seen → the curtain lifts and the hero's own entrance plays.
 */
import { METAL, type MetalSteps } from "@/theme/palette"

import { FULL, QUICK, chase, targetAt, type IntroTiming } from "./progress"
import { Sparks } from "./sparks"

const SEEN_KEY = "intro-seen"
/** Never hold the page longer than this, whatever is still loading */
const MAX_WAIT_MS = 6000
/** Matches the exit transition in intro.css */
const EXIT_MS = 1000
/** Physics step cap: a long stall should not fling sparks across the screen */
const MAX_DT = 48

function sessionFlag(): boolean {
  try {
    const seen = sessionStorage.getItem(SEEN_KEY) === "1"
    sessionStorage.setItem(SEEN_KEY, "1")
    return seen
  } catch {
    return false
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function sparkColours(metal: MetalSteps) {
  return [metal.photon, metal.hi, metal.hi, metal.mid]
}

/** Resolves when the page behind the curtain is ready: first render committed and the fonts it asked for decoded */
export function pageReady() {
  return new Promise<void>((resolve) => {
    // Two frames: the first lets React commit, the second lets the browser request the fonts that render uses
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        void document.fonts.ready.then(() => resolve())
      })
    )
  })
}

export function startIntro(ready: Promise<unknown>) {
  const root = document.getElementById("intro")
  const html = document.documentElement
  const mark = root?.querySelector<HTMLElement>(".intro-mark")
  const word = root?.querySelector<HTMLElement>(".intro-word")
  const count = root?.querySelector<HTMLElement>(".intro-count-value")
  const canvas = root?.querySelector<HTMLCanvasElement>(".intro-sparks")
  if (!root || !mark || !word || !count || !canvas) {
    root?.remove()
    delete html.dataset.intro
    return
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const timing: IntroTiming = sessionFlag() || reduced ? QUICK : FULL
  const dark = html.classList.contains("dark")
  const sparks = reduced
    ? null
    : new Sparks(canvas, sparkColours(dark ? METAL.dark : METAL.light), dark)

  html.classList.add("intro-lock")

  // The script face downloads only once something asks for it; show the word when its glyphs are in, not before
  void document.fonts
    .load('1em "Stalemate"', "susx.meiou")
    .catch(() => undefined)
    .then(() => root.setAttribute("data-word", "ready"))

  let isReady = false
  void Promise.race([ready, delay(MAX_WAIT_MS)]).then(() => {
    isReady = true
  })

  let markBox = mark.getBoundingClientRect()
  let wordBox = word.getBoundingClientRect()
  const onResize = () => {
    markBox = mark.getBoundingClientRect()
    wordBox = word.getBoundingClientRect()
    sparks?.resize()
  }
  window.addEventListener("resize", onResize)

  const start = performance.now()
  let last = start
  let shown = 0
  let completedAt = 0
  let exitAt = 0

  const frame = (now: number) => {
    const dt = now - last
    last = now

    if (!completedAt) {
      const before = shown
      shown = chase(shown, targetAt(now - start, isReady, timing), dt)
      const fill = shown / 100
      root.style.setProperty("--intro-fill", fill.toFixed(4))
      count.textContent = String(Math.floor(shown)).padStart(3, "0")
      if (sparks) throwFromFillLine(sparks, fill, shown - before)
      if (shown >= 100) {
        completedAt = now
        if (sparks) burst(sparks)
      }
    } else if (!exitAt && now - completedAt >= timing.settleMs) {
      exitAt = now
      root.setAttribute("data-state", "exit")
      // Let the page's own entrance start under the lifting curtain, not after it
      html.classList.remove("intro-lock")
      delete html.dataset.intro
    }

    sparks?.step(Math.min(dt, MAX_DT))

    if (exitAt && now - exitAt >= EXIT_MS) {
      window.removeEventListener("resize", onResize)
      sparks?.clear()
      root.remove()
      return
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  /** Sparks leave the molten edge of both fills, more of them the faster the metal rises */
  function throwFromFillLine(s: Sparks, fill: number, advanced: number) {
    if (fill <= 0.02 || fill >= 1) return
    const rate = advanced * 1.4 + (Math.random() < 0.3 ? 1 : 0)
    const n = Math.floor(rate + Math.random())
    s.emit(n, {
      x: markBox.left + markBox.width / 2,
      y: markBox.bottom - fill * markBox.height,
      width: markBox.width * 0.55,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.9,
      speed: [0.05, 0.3],
      life: [500, 1100],
      size: [0.8, 1.8],
    })
    if (Math.random() < 0.45) {
      s.emit(1, {
        x: wordBox.left + wordBox.width / 2,
        y: wordBox.bottom - fill * wordBox.height,
        width: wordBox.width * 0.8,
        angle: -Math.PI / 2,
        spread: Math.PI * 0.7,
        speed: [0.04, 0.2],
        life: [400, 900],
        size: [0.6, 1.4],
      })
    }
  }

  /** The finish: a ring of sparks off the full mark, a lighter spray off the word */
  function burst(s: Sparks) {
    s.emit(110, {
      x: markBox.left + markBox.width / 2,
      y: markBox.top + markBox.height * 0.45,
      width: markBox.width * 0.7,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: [0.12, 0.62],
      life: [900, 1900],
      size: [0.9, 2.2],
    })
    s.emit(60, {
      x: wordBox.left + wordBox.width / 2,
      y: wordBox.top + wordBox.height / 2,
      width: wordBox.width,
      angle: -Math.PI / 2,
      spread: Math.PI * 1.4,
      speed: [0.08, 0.42],
      life: [800, 1600],
      size: [0.7, 1.7],
    })
  }
}
