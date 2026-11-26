import { useEffect } from "react"

/*
 * Publishes scroll state as CSS, once per frame, so the styling stays in CSS:
 *   --scroll-progress  0 → 1 over the whole page, on [data-scroll-rule] (the metal rule under the header)
 *   --hero-progress    0 → 1 while the hero scrolls away, on the hero itself (its content lifts and fades)
 *   data-scrolled      on <html> once the page has left the top (the header firms up)
 *
 * Each variable is set on the element that reads it, not on <html>: a custom property on the root is inherited by
 * every element, so changing it every frame would restyle the whole document. Heights are measured on resize, never
 * per scroll frame, so a scroll frame reads no layout but scrollY.
 *
 * CSSOM writes, not style attributes, so the CSP needs no 'unsafe-inline'.
 */
export function useScrollEffects(heroId: string) {
  useEffect(() => {
    const root = document.documentElement
    const hero = document.getElementById(heroId)
    const rules = document.querySelectorAll<HTMLElement>("[data-scroll-rule]")
    let frame = 0
    let scrollable = 1
    let heroHeight = 1

    const measure = () => {
      scrollable = Math.max(1, root.scrollHeight - window.innerHeight)
      heroHeight = Math.max(1, hero?.offsetHeight ?? 1)
    }
    const update = () => {
      frame = 0
      const y = window.scrollY
      const progress = String(Math.min(1, y / scrollable))
      for (const rule of rules)
        rule.style.setProperty("--scroll-progress", progress)
      hero?.style.setProperty(
        "--hero-progress",
        String(Math.min(1, Math.max(0, y / heroHeight)))
      )
      root.toggleAttribute("data-scrolled", y > 8)
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(update)
    }

    // The page grows as images and the gallery arrive, so measure whenever <body> changes size, not only on resize
    const sizes = new ResizeObserver(() => {
      measure()
      schedule()
    })
    sizes.observe(document.body)
    measure()
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      sizes.disconnect()
      window.removeEventListener("scroll", schedule)
    }
  }, [heroId])
}
