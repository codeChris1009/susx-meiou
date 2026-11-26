import { useEffect, useState } from "react"

/**
 * The id of the section crossing the middle of the viewport, or null between sections. The observer's root is a
 * thin band across the screen's centre, so exactly the section the reader is in intersects it.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(",")

  useEffect(() => {
    const sections = key
      .split(",")
      .map((id) => document.getElementById(id)?.closest("section"))
      .filter((el): el is HTMLElement => !!el)
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.querySelector("h2")?.id ?? null
          if (entry.isIntersecting) setActive(id)
          else setActive((current) => (current === id ? null : current))
        }
      },
      { rootMargin: "-45% 0px -54% 0px" }
    )
    for (const section of sections) io.observe(section)
    return () => io.disconnect()
  }, [key])

  return active
}
