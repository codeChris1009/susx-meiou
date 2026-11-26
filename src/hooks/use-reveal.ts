import { useCallback } from "react"

/*
 * One observer for the whole page: each element is revealed once, the first time a sliver of it scrolls into view,
 * then unobserved. The bottom margin starts the transition just before the element is fully on screen, so it is
 * settling rather than starting when the eye arrives.
 */
let observer: IntersectionObserver | null = null

function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute("data-revealed", "")
        self.unobserve(entry.target)
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  )
  return observer
}

/** Ref callback: pair with the `reveal` (or `reveal-rule`) class */
export function useReveal<T extends Element>() {
  return useCallback((node: T | null) => {
    if (!node) return
    const io = shared()
    io.observe(node)
    return () => io.unobserve(node)
  }, [])
}
