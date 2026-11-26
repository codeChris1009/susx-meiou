/**
 * Entry loader controller. The markup is static in index.html (it paints with the first frame, before this bundle has
 * even parsed); this drives it: --intro-fill (0..1) for the rising metal, the counter, the sparks and the gate.
 *
 * Sequence, after the 3D gallery's intro (demo-3js-Gallery0):
 *   fill   the mark and the script wordmark fill from below on a slow-medium-fast-slow curve (progress.ts), throwing
 *          sparks off the molten line, more of them, further and quicker as the fill climbs (the gallery's countdown)
 *   100%   a firework off the full mark and a ring of sparks off its frame
 *   ready  ENTER takes the count's place; the page waits for the visitor, and sparks rise off ENTER under the pointer
 *   enter  sparks burst off ENTER, the mark lifts away, and an aperture opens from the centre on the page coming into
 *          focus behind it (intro.css times the exit)
 */
import { EMBER } from "@/theme/palette"

import { FULL, QUICK, progressAt, tick, type IntroTiming } from "./progress"
import { markEntered } from "./entered"
import { Sparks, type Box, type Spray } from "./sparks"

const SEEN_KEY = "intro-seen"
/** Never hold the page longer than this, whatever is still loading */
const MAX_WAIT_MS = 6000
/** The exit is timed by intro.css (~2.4s); this only covers a transitionend that never comes (a hidden tab, say) */
const EXIT_FALLBACK_MS = 3000
/** Frame time cap: a long stall should not age every spark at once */
const MAX_DT = 48

// ---- Sprays, after the gallery's (its cursor.js) ----
const ALL_ROUND = Math.PI * 2
/**
 * While the mark fills, at intensity 1 (empty) to 8 (full): each batch larger, flying further and living longer, as the
 * gallery's countdown sparks grew from 10 to 1. Distances are three-quarters of the gallery's: the mark is smaller than
 * its countdown frame.
 */
const fillSpray = (intensity: number): Spray => ({
  from: "area",
  spread: ALL_ROUND,
  distance: [(10 + intensity * 4) * 1.5, (24 + intensity * 16) * 1.5],
  life: [700 + intensity * 120, 1100 + intensity * 220],
  size: [2.4 + intensity * 0.22, 3.8 + intensity * 0.22],
  end: 0.16,
})
const fillBatch = (intensity: number) => 1 + Math.floor(intensity * 0.68)
/** ms between batches: 240 when the fill starts, 70 as it completes */
const fillEvery = (fill: number) => 240 - 170 * fill
/** At 100%: a firework off the full mark */
const FIREWORK: Spray = {
  from: "area",
  spread: ALL_ROUND,
  distance: [48, 268],
  life: [2600, 4200],
  size: [3.2, 7],
  end: 0.12,
}
const FIREWORK_COUNT = 34
/** …and a ring of sparks thrown off its frame, carrying the cool halo */
const FRAME: Spray = {
  from: "edge",
  spread: 0.8,
  distance: [36, 184],
  life: [1300, 1940],
  size: [4.4, 5.6],
  end: 0.22,
  halo: true,
}
const FRAME_COUNT = 48
/** Under the pointer, ENTER gives off a few sparks at a time */
const HOVER: Spray = {
  from: "edge",
  spread: 1.1,
  distance: [14, 80],
  life: [1600, 2000],
  size: [3, 4],
  end: 0.18,
}
const HOVER_COUNT = 4
const HOVER_EVERY_MS = 220
/** ENTER: a burst off the button, short enough to clear with the curtain */
const DEPART: Spray = {
  ...FIREWORK,
  distance: [40, 220],
  life: [1400, 2400],
  halo: true,
}

/** Records this visit and reports whether the session had already seen the intro */
function seenBeforeThisSession(): boolean {
  try {
    const seen = sessionStorage.getItem(SEEN_KEY) === "1"
    sessionStorage.setItem(SEEN_KEY, "1")
    return seen
  } catch {
    return false
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
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

/** @param ready  resolves when the page behind the curtain is ready (see pageReady) */
export function startIntro(ready: Promise<unknown>) {
  const root = document.getElementById("intro")
  const page = document.getElementById("root")
  const html = document.documentElement
  const mark = root?.querySelector<HTMLElement>(".intro-mark")
  const word = root?.querySelector<HTMLElement>(".intro-word")
  const count = root?.querySelector<HTMLElement>(".intro-count-value")
  const canvas = root?.querySelector<HTMLCanvasElement>(".intro-sparks")
  const enter = root?.querySelector<HTMLButtonElement>(".intro-enter")
  const status = root?.querySelector<HTMLElement>(".intro-status")
  if (!root || !page || !mark || !word || !count || !canvas || !enter) {
    root?.remove()
    delete html.dataset.intro
    markEntered()
    return
  }

  // From here this script owns the curtain: the CSS failsafe stands down, and the page behind it cannot take focus
  root.setAttribute("data-armed", "")
  page.inert = true
  html.classList.add("intro-lock")

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const timing: IntroTiming = seenBeforeThisSession() || reduced ? QUICK : FULL
  const dark = html.classList.contains("dark")
  const sparks = reduced
    ? null
    : new Sparks(
        canvas,
        dark ? EMBER.dark : EMBER.light,
        dark ? EMBER.halo : null,
        dark
      )

  // The script face downloads only once something asks for it; show the word when its glyphs are in, not before
  void document.fonts
    .load('1em "Stalemate"', "susx.meiou")
    .catch(() => undefined)
    .then(() => root.setAttribute("data-word", "ready"))

  let isReady = false
  void Promise.race([ready, delay(MAX_WAIT_MS)]).then(() => {
    isReady = true
  })

  let markBox = boxOf(mark)
  const onResize = () => {
    markBox = boxOf(mark)
    sparks?.resize()
  }
  window.addEventListener("resize", onResize)

  type Phase = "loading" | "ready" | "entering"
  let phase: Phase = "loading"
  let finished = false
  const finish = () => {
    finished = true
    wake()
  }
  root.addEventListener("transitionend", (e) => {
    if (e.target === root && e.propertyName === "opacity") finish()
  })

  // ---- The gate ----
  let hoverTimer = 0
  const hoverSparks = () => {
    sparks?.emit(HOVER_COUNT, boxOf(enter), HOVER)
    wake()
  }
  const startHover = () => {
    if (!sparks || hoverTimer) return
    hoverSparks()
    hoverTimer = window.setInterval(hoverSparks, HOVER_EVERY_MS)
  }
  const stopHover = () => {
    window.clearInterval(hoverTimer)
    hoverTimer = 0
  }
  /**
   * Not focused for the visitor (a focus ring on arrival reads as an error); Enter or Space anywhere does what the
   * button does, and Tab reaches it as the only focusable thing left on the screen.
   */
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    // A focused ENTER fires its own click; acting here too would only race it
    if (document.activeElement === enter) return
    e.preventDefault()
    go()
  }
  const open = () => {
    phase = "ready"
    root.setAttribute("data-state", "ready")
    if (status) status.textContent = "Ready. Press Enter to come in"
    root.addEventListener("click", go)
    window.addEventListener("keydown", onKey)
    enter.addEventListener("pointerenter", startHover)
    enter.addEventListener("pointerleave", stopHover)
  }

  /** The page is handed back at once, so its entrance plays as the aperture opens on it */
  const go = () => {
    if (phase !== "ready") return
    phase = "entering"
    stopHover()
    root.removeEventListener("click", go)
    window.removeEventListener("keydown", onKey)
    enter.removeEventListener("pointerenter", startHover)
    enter.removeEventListener("pointerleave", stopHover)
    root.setAttribute("data-state", "enter")
    sparks?.emit(FIREWORK_COUNT, boxOf(enter), DEPART)
    wake()
    page.inert = false
    html.classList.remove("intro-lock")
    delete html.dataset.intro
    markEntered()
    setTimeout(finish, EXIT_FALLBACK_MS)
  }

  // ---- The loop ----
  let last = performance.now()
  /** The loop stops while the gate waits with nothing in the air; a spark or the exit starts it again */
  let sleeping = false
  function wake() {
    if (!sleeping) return
    sleeping = false
    last = performance.now()
    requestAnimationFrame(frame)
  }
  let clock = 0
  let sinceBatch = 0
  let completedAt = 0

  const frame = (now: number) => {
    const dt = Math.min(MAX_DT, Math.max(0, now - last))
    last = now

    if (finished) {
      stopHover()
      window.removeEventListener("resize", onResize)
      sparks?.clear()
      root.remove()
      return
    }

    if (!completedAt) {
      clock = tick(clock, dt, isReady, timing)
      const shown = progressAt(clock, timing)
      const fill = shown / 100
      root.style.setProperty("--intro-fill", fill.toFixed(4))
      count.textContent = String(Math.floor(shown)).padStart(3, "0")
      if (sparks) spray(sparks, fill, dt)
      if (shown >= 100) {
        completedAt = now
        if (sparks) burst(sparks)
      }
    } else if (phase === "loading" && now - completedAt >= timing.settleMs) {
      open()
    }

    sparks?.step(dt)

    // Waiting at the gate, no sparks left to draw: stop asking for frames
    if (phase === "ready" && !sparks?.live) {
      sleeping = true
      return
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  /** Batches off the molten line of the mark, quickening and growing with the fill */
  function spray(s: Sparks, fill: number, dt: number) {
    if (fill <= 0.02 || fill >= 1) return
    sinceBatch += dt
    const every = fillEvery(fill)
    if (sinceBatch < every) return
    sinceBatch -= every
    const intensity = 1 + 7 * fill
    const line = markBox.top + markBox.height * (1 - fill)
    s.emit(
      fillBatch(intensity),
      {
        left: markBox.left + markBox.width * 0.18,
        top: line - markBox.height * 0.04,
        width: markBox.width * 0.64,
        height: markBox.height * 0.1,
      },
      fillSpray(intensity)
    )
  }

  function burst(s: Sparks) {
    s.emit(FIREWORK_COUNT, markBox, FIREWORK)
    s.emit(FRAME_COUNT, markBox, FRAME)
  }
}
