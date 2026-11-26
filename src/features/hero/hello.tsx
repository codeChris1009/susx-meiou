import { useEffect, useRef, useState } from "react"

import { entered } from "@/features/intro/entered"

import {
  FIRST,
  GREETINGS,
  HUES,
  between,
  shuffleBag,
  type Greeting,
} from "./greetings"

/** How long a greeting stays, drawn fresh each time so the beat never settles */
const HOLD_MS = [2300, 3500] as const
/** The first, English greeting plays under the lifting curtain, so it is given longer to be seen */
const FIRST_HOLD_MS = 4200
/** The exit's length; .hello-word[data-phase="out"] in hero.css runs for the same time */
const EXIT_MS = 650

/**
 * "Hello world", in one language after another. Each greeting writes itself on from the left out of a blur, the way
 * the Mac says hello on first start, holds, and lifts away; the gradient it is set in morphs to new hues each time
 * (registered custom properties, so the colours interpolate rather than cut). Languages, hues, gradient angle and
 * timing are each drawn independently, without repeats, so nothing recurs in a pattern.
 *
 * It starts once the visitor has entered, pauses while the hero is off screen or the tab hidden, and stays on the
 * English greeting for anyone who prefers reduced motion. Decorative: the heading carries the text for screen readers.
 */
export function Hello() {
  const box = useRef<HTMLSpanElement>(null)
  const [greeting, setGreeting] = useState<Greeting>(FIRST)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return

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
    const hold = (ms = between(...HOLD_MS)) => {
      timer = window.setTimeout(leave, ms)
    }
    const leave = () => {
      if (!visible()) {
        owed = true
        return
      }
      setLeaving(true)
      timer = window.setTimeout(() => {
        setGreeting(nextGreeting())
        setLeaving(false)
        paint()
        hold()
      }, EXIT_MS)
    }
    const resume = () => {
      if (owed && visible()) {
        owed = false
        leave()
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

  return (
    <span ref={box} aria-hidden className="hello">
      <span
        key={greeting.text}
        lang={greeting.lang}
        data-phase={leaving ? "out" : "in"}
        className="hello-word"
      >
        {greeting.text}
      </span>
    </span>
  )
}
