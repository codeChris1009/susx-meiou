import { useEffect, useState } from "react"

/**
 * The id of the section crossing the middle of the viewport, or null between sections. The observer's root is a
 * thin band across the screen's centre, so exactly the section the reader is in intersects it.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(",")

  useEffect(() => {
    // Each observed section remembers the id it was found by, rather than reading one back out of its markup
    const idOf = new Map<Element, string>()
    for (const id of key.split(",")) {
      const section = document.getElementById(id)?.closest("section")
      if (section) idOf.set(section, id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = idOf.get(entry.target) ?? null
          if (entry.isIntersecting) setActive(id)
          else setActive((current) => (current === id ? null : current))
        }
      },
      { rootMargin: "-45% 0px -54% 0px" }
    )
    for (const section of idOf.keys()) io.observe(section)
    return () => io.disconnect()
  }, [key])

  return active
}
