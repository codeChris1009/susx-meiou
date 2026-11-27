import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { SLOW, graphemes } from "@/components/decode-text/decode"
import { DecodeText } from "@/components/decode-text/decode-text"
import { entered } from "@/features/intro/entered"

import {
  FIRST,
  GREETINGS,
  HUES,
  between,
  shuffleBag,
  type Greeting,
} from "./greetings"

/** How long a greeting stays once it has resolved, drawn fresh each time so the beat never settles */
const HOLD_MS = [2300, 3500] as const
/** The first, English greeting plays under the lifting curtain, so it is given longer to be seen */
const FIRST_HOLD_MS = 4200
/** The longest a decode runs (decode.ts SLOW: start + scramble + spread + jitter) */
const DECODE_MS = SLOW.start + SLOW.scramble + SLOW.spread + SLOW.jitter
/** The longest the next greeting's letters may keep it waiting; past this it decodes in a fallback face */
const FONT_WAIT_MS = 1500
/** Room kept clear at the line's end: the line leans this far right under the pointer (hero.tsx) */
const LEAN_PX = 8

/** The tip's own lines decode too: its English through capitals, its Chinese through bopomofo */
const TIP_EN = graphemes("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
const TIP_ZH = graphemes("ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ")

/**
 * "Hello world", in one language after another. Each greeting decodes into the next: the letters dissolve into
 * glyphs of the new language's own script (jamo before Hangul syllables, bopomofo before Chinese) and resolve from
 * the start of the line, while the gradient it is set in morphs to new hues (registered custom properties, so the
 * colours interpolate rather than cut). Languages, hues, gradient angle and timing are each drawn independently,
 * without repeats, so nothing recurs in a pattern. The next greeting's letters are fetched before it starts.
 *
 * Under the pointer a tip says which language it is, in English and Chinese. It starts once the visitor has entered,
 * pauses while the hero is off screen or the tab hidden, and stays on the English greeting for anyone who prefers
 * reduced motion. Decorative: the heading carries the text for screen readers.
 */
export function Hello() {
  const box = useRef<HTMLSpanElement>(null)
  const word = useRef<HTMLSpanElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const [greeting, setGreeting] = useState<Greeting>(FIRST)
  /** Counts entrances: the first greeting decodes in once the curtain lifts */
  const [entrance, setEntrance] = useState(0)
  const [pointing, setPointing] = useState(false)
  const pool = useMemo(() => graphemes(greeting.pool), [greeting])

  useEffect(() => {
    const el = box.current
    const w = word.current
    if (!el || !w || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return

    const nextGreeting = shuffleBag(GREETINGS, Math.random, FIRST)
    const nextHues = shuffleBag(HUES)
    let timer = 0
    let onScreen = true
    let started = false
    /** A beat came due while nobody could see it; play it when they can */
    let owed = false
    let disposed = false

    const paint = () => {
      const [a, b, c] = nextHues()
      el.style.setProperty("--hello-h1", String(a))
      el.style.setProperty("--hello-h2", String(b))
      el.style.setProperty("--hello-h3", String(c))
      el.style.setProperty(
        "--hello-angle",
        `${Math.round(between(100, 170))}deg`
      )
    }
    const visible = () => onScreen && !document.hidden
    const hold = (ms: number) => {
      timer = window.setTimeout(advance, ms)
    }
    /** The next greeting's letters and decode glyphs, in hand before it starts (or after FONT_WAIT_MS, without) */
    const fetchFaces = (g: Greeting) => {
      const { fontWeight, fontFamily } = getComputedStyle(w)
      return Promise.race([
        document.fonts.load(
          `${fontWeight} 16px ${fontFamily}`,
          g.text + g.pool
        ),
        new Promise((done) => setTimeout(done, FONT_WAIT_MS)),
      ]).catch(() => undefined)
    }
    const advance = () => {
      if (!visible()) {
        owed = true
        return
      }
      const next = nextGreeting()
      void fetchFaces(next).then(() => {
        if (disposed) return
        setGreeting(next)
        paint()
        hold(DECODE_MS + between(...HOLD_MS))
      })
    }
    const resume = () => {
      if (owed && visible()) {
        owed = false
        advance()
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting
      resume()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", resume)

    void entered.then(() => {
      if (disposed || started) return
      started = true
      setEntrance(1)
      paint()
      hold(FIRST_HOLD_MS)
    })

    return () => {
      disposed = true
      clearTimeout(timer)
      io.disconnect()
      document.removeEventListener("visibilitychange", resume)
    }
  }, [])

  // A greeting wider than the line is set smaller to fit: measured at full size, before it paints
  useLayoutEffect(() => {
    const el = box.current
    const p = probe.current
    const room = el?.closest("h1")
    if (!el || !p || !room) return
    const fit = () => {
      const scale = Math.min(1, (room.clientWidth - LEAN_PX) / p.offsetWidth)
      el.style.setProperty("--hello-fit", scale.toFixed(3))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(room)
    // Letters arriving late (FONT_WAIT_MS) change the width
    document.fonts.addEventListener("loadingdone", fit)
    return () => {
      ro.disconnect()
      document.fonts.removeEventListener("loadingdone", fit)
    }
  }, [greeting])

  /** The tip follows the pointer (CSSOM: the CSP allows no style attributes) and flips left near the window's edge */
  const follow = (e: PointerEvent<HTMLSpanElement>) => {
    const el = box.current
    const t = tip.current
    if (!el || !t || e.pointerType !== "mouse") return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--tip-x", `${(e.clientX - r.left).toFixed(1)}px`)
    el.style.setProperty("--tip-y", `${(e.clientY - r.top).toFixed(1)}px`)
    t.toggleAttribute(
      "data-flip",
      e.clientX + t.offsetWidth + 40 > window.innerWidth
    )
  }

  return (
    <span
      ref={box}
      aria-hidden
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return
        follow(e)
        setPointing(true)
      }}
      onPointerMove={follow}
      onPointerLeave={() => setPointing(false)}
      className="hello"
    >
      <span
        ref={word}
        lang={greeting.lang}
        dir={greeting.dir ?? "ltr"}
        className="hello-word"
      >
        <DecodeText
          text={greeting.text}
          pool={pool}
          timing={SLOW}
          replay={entrance}
        />
      </span>
      <span
        ref={probe}
        lang={greeting.lang}
        dir={greeting.dir ?? "ltr"}
        className="hello-word hello-probe"
      >
        {greeting.text}
      </span>
      <span ref={tip} data-on={pointing || undefined} className="hello-tip">
        <span className="hello-tip-swatch" />
        <span className="hello-tip-text">
          <span lang="en" className="hello-tip-en">
            <DecodeText text={greeting.name.en} pool={TIP_EN} />
          </span>
          <span lang="zh-Hant" className="hello-tip-zh">
            <DecodeText text={greeting.name.zh} pool={TIP_ZH} />
          </span>
        </span>
      </span>
    </span>
  )
}
