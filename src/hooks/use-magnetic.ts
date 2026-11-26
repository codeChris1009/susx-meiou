import { useCallback } from "react"

/** How far the element follows the pointer, as a share of the pointer's offset from its centre */
const PULL = 0.28

/**
 * Magnetic hover: while a mouse is over the element, it leans toward the pointer and settles back when it leaves.
 * Writes --mag-x / --mag-y through the CSSOM (the .magnetic class turns them into a translate); fine pointers only,
 * and nothing at all under reduced motion.
 */
export function useMagnetic<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    if (!el) return
    if (
      !matchMedia("(pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    let frame = 0
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect()
        const x = (e.clientX - (box.left + box.width / 2)) * PULL
        const y = (e.clientY - (box.top + box.height / 2)) * PULL
        el.style.setProperty("--mag-x", `${x.toFixed(1)}px`)
        el.style.setProperty("--mag-y", `${y.toFixed(1)}px`)
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      el.style.removeProperty("--mag-x")
      el.style.removeProperty("--mag-y")
    }
    el.classList.add("magnetic")
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      leave()
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
    }
  }, [])
}
