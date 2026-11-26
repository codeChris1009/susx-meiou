/**
 * Entry loader controller. The markup is static in index.html (it paints with the first frame, before this bundle has
 * even parsed); this drives it: --intro-fill (0..1) for the rising metal, the counter, the sparks, the ring of works,
 * and the gate.
 *
 * Sequence: fill (the mark and the script wordmark fill from below, sparks thrown off the fill line, the works arriving
 * on the ring) → 100%, a burst → READY: ENTER appears and the page waits for the visitor → ENTER: the camera dives
 * through the ring, the mark dissolves and the page focuses behind the thinning curtain (intro.css times it).
 */
import { METAL, type MetalSteps } from "@/theme/palette"

import { FULL, QUICK, chase, targetAt, type IntroTiming } from "./progress"
import { markEntered } from "./entered"
import { Sparks, type Spray } from "./sparks"

const SEEN_KEY = "intro-seen"
/** Never hold the page longer than this, whatever is still loading */
const MAX_WAIT_MS = 6000
/** The dive is timed by intro.css (~1.9s); this only covers a transitionend that never comes (a hidden tab, say) */
const EXIT_FALLBACK_MS = 2600
/** The ring holds this many works at most: more and the near side crowds the mark */
const RING_MAX = 9
/** Physics step cap: a long stall should not fling sparks across the screen */
const MAX_DT = 48

// ---- Sprays: how sparks leave the metal ----
const UP = -Math.PI / 2
/** Off the molten edge of the mark while it fills */
const MARK_SPRAY: Spray = {
  angle: UP,
  spread: Math.PI * 0.9,
  speed: [0.05, 0.3],
  life: [500, 1100],
  size: [0.8, 1.8],
}
/** Off the word's fill line: fewer, smaller, slower */
const WORD_SPRAY: Spray = {
  angle: UP,
  spread: Math.PI * 0.7,
  speed: [0.04, 0.2],
  life: [400, 900],
  size: [0.6, 1.4],
}
/** At 100%: a ring off the full mark */
const MARK_BURST: Spray = {
  angle: UP,
  spread: Math.PI * 2,
  speed: [0.12, 0.62],
  life: [900, 1900],
  size: [0.9, 2.2],
}
/** At 100%: a lighter spray off the word */
const WORD_BURST: Spray = {
  angle: UP,
  spread: Math.PI * 1.4,
  speed: [0.08, 0.42],
  life: [800, 1600],
  size: [0.7, 1.7],
}
/** Sparks per point of progress, and the chance per frame of a stray one while the fill creeps */
const SPARKS_PER_POINT = 1.4
const IDLE_SPARK_CHANCE = 0.3
const WORD_SPARK_CHANCE = 0.45

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

/** Mostly the bright faces of the metal, a few from the middle: sparks are the metal at its hottest */
const sparkColours = (metal: MetalSteps) => [
  metal.photon,
  metal.hi,
  metal.hi,
  metal.mid,
]

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

/** Hangs the works on the ring: one card per image, phase-shifted by its place (intro.css does the orbit) */
function hang(track: HTMLElement, artwork: readonly string[]) {
  const works = artwork.slice(0, RING_MAX)
  track.style.setProperty("--n", String(works.length))
  for (const [i, src] of works.entries()) {
    const card = document.createElement("div")
    card.className = "intro-card"
    card.style.setProperty("--i", String(i))
    const img = new Image()
    img.alt = ""
    img.decoding = "async"
    // The fonts and the first render matter more; the ring fades each work in whenever it lands
    img.fetchPriority = "low"
    img.addEventListener("load", () => img.setAttribute("data-loaded", ""), {
      once: true,
    })
    img.src = src
    card.append(img)
    track.append(card)
  }
}

/**
 * @param ready  resolves when the page behind the curtain is ready (see pageReady)
 * @param artwork  image URLs for the ring, in hanging order
 */
export function startIntro(
  ready: Promise<unknown>,
  artwork: readonly string[]
) {
  const root = document.getElementById("intro")
  const page = document.getElementById("root")
  const html = document.documentElement
  const mark = root?.querySelector<HTMLElement>(".intro-mark")
  const word = root?.querySelector<HTMLElement>(".intro-word")
  const count = root?.querySelector<HTMLElement>(".intro-count-value")
  const canvas = root?.querySelector<HTMLCanvasElement>(".intro-sparks")
  const track = root?.querySelector<HTMLElement>(".intro-ring-track")
  const enter = root?.querySelector<HTMLButtonElement>(".intro-enter")
  const status = root?.querySelector<HTMLElement>(".intro-status")
  if (
    !root ||
    !page ||
    !mark ||
    !word ||
    !count ||
    !canvas ||
    !track ||
    !enter
  ) {
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
    : new Sparks(canvas, sparkColours(dark ? METAL.dark : METAL.light), dark)

  hang(track, artwork)

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

  type Phase = "loading" | "ready" | "entering"
  let phase: Phase = "loading"
  let finished = false
  const finish = () => {
    finished = true
  }
  root.addEventListener("transitionend", (e) => {
    if (e.target === root && e.propertyName === "opacity") finish()
  })

  /**
   * The gate opens: ENTER takes the count's place, and the whole curtain becomes the button. It is not focused for the
   * visitor (a focus ring on arrival reads as an error); Enter or Space anywhere does what the button does, and Tab
   * reaches it as the only focusable thing left on the screen.
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
  }

  /** The dive: the page is handed back at once, so its entrance plays under the curtain as it thins */
  const go = () => {
    if (phase !== "ready") return
    phase = "entering"
    root.removeEventListener("click", go)
    window.removeEventListener("keydown", onKey)
    root.setAttribute("data-state", "enter")
    if (sparks) {
      const box = enter.getBoundingClientRect()
      sparks.emit(
        70,
        {
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
          width: box.width,
        },
        WORD_BURST
      )
    }
    page.inert = false
    html.classList.remove("intro-lock")
    delete html.dataset.intro
    markEntered()
    setTimeout(finish, EXIT_FALLBACK_MS)
  }

  const start = performance.now()
  let last = start
  let shown = 0
  let completedAt = 0

  const frame = (now: number) => {
    const dt = now - last
    last = now

    if (!completedAt) {
      const before = shown
      shown = chase(shown, targetAt(now - start, isReady, timing), dt)
      const fill = shown / 100
      root.style.setProperty("--intro-fill", fill.toFixed(4))
      count.textContent = String(Math.floor(shown)).padStart(3, "0")
      if (sparks) spray(sparks, fill, shown - before)
      if (shown >= 100) {
        completedAt = now
        if (sparks) burst(sparks)
      }
    } else if (phase === "loading" && now - completedAt >= timing.settleMs) {
      open()
    }

    sparks?.step(Math.min(dt, MAX_DT))

    if (finished) {
      window.removeEventListener("resize", onResize)
      sparks?.clear()
      root.remove()
      return
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  /** Sparks leave the molten edge of both fills, more of them the faster the metal rises */
  function spray(s: Sparks, fill: number, advanced: number) {
    if (fill <= 0.02 || fill >= 1) return
    const extra = Math.random() < IDLE_SPARK_CHANCE ? 1 : 0
    const n = Math.floor(advanced * SPARKS_PER_POINT + extra + Math.random())
    s.emit(
      n,
      {
        x: markBox.left + markBox.width / 2,
        y: markBox.bottom - fill * markBox.height,
        width: markBox.width * 0.55,
      },
      MARK_SPRAY
    )
    if (Math.random() < WORD_SPARK_CHANCE) {
      s.emit(
        1,
        {
          x: wordBox.left + wordBox.width / 2,
          y: wordBox.bottom - fill * wordBox.height,
          width: wordBox.width * 0.8,
        },
        WORD_SPRAY
      )
    }
  }

  function burst(s: Sparks) {
    s.emit(
      110,
      {
        x: markBox.left + markBox.width / 2,
        y: markBox.top + markBox.height * 0.45,
        width: markBox.width * 0.7,
      },
      MARK_BURST
    )
    s.emit(
      60,
      {
        x: wordBox.left + wordBox.width / 2,
        y: wordBox.top + wordBox.height / 2,
        width: wordBox.width,
      },
      WORD_BURST
    )
  }
}
