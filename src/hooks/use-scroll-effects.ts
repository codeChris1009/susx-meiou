import { useEffect } from "react"

/*
 * Publishes scroll state as CSS, once per frame, so the styling stays in CSS:
 *   --scroll-progress  0 → 1 over the whole page (the metal rule under the header)
 *   --hero-progress    0 → 1 while the hero scrolls away (its content lifts and fades)
 *   data-scrolled      on <html> once the page has left the top (the header firms up)
 * CSSOM writes, not style attributes, so the CSP needs no 'unsafe-inline'.
 */
export function useScrollEffects(heroId: string) {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = root.scrollHeight - window.innerHeight
      root.style.setProperty("--scroll-progress", String(max > 0 ? y / max : 0))
      const hero = document.getElementById(heroId)
      const heroHeight = hero?.offsetHeight ?? 1
      root.style.setProperty(
        "--hero-progress",
        String(Math.min(1, Math.max(0, y / heroHeight)))
      )
      root.toggleAttribute("data-scrolled", y > 8)
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [heroId])
}
