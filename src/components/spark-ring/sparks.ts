/**
 * Sparks after the 3D art gallery's cursor (demo-3js-Gallery0, cursor.js createClickSparks): white points with a cool
 * halo that fly a short way out, shrink and fade. DOM particles, styled by spark-ring.css and placed through CSSOM
 * (the CSP allows no style attributes), each removing itself when its animation ends.
 */

export interface Throw {
  /** Where it starts, in px within `container` */
  x: number
  y: number
  /** Direction, radians */
  angle: number
  /** How far it flies, px */
  distance: number
  size?: number
  /** ms */
  life?: number
}

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches

export function spark(container: HTMLElement, t: Throw) {
  const el = document.createElement("span")
  el.className = "spark"
  el.setAttribute("aria-hidden", "true")
  const s = el.style
  s.setProperty("--x", `${t.x}px`)
  s.setProperty("--y", `${t.y}px`)
  s.setProperty("--tx", `${Math.cos(t.angle) * t.distance}px`)
  s.setProperty("--ty", `${Math.sin(t.angle) * t.distance}px`)
  s.setProperty("--size", `${t.size ?? 3}px`)
  s.setProperty("--life", `${t.life ?? 600}ms`)
  el.addEventListener("animationend", () => el.remove(), { once: true })
  container.append(el)
}

/** The gallery's click: a dozen sparks off a ring of `radius` px round (x, y), flying 10 to 50 px out */
export function burst(
  container: HTMLElement,
  x: number,
  y: number,
  radius: number,
  count = 12
) {
  if (still()) return
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    spark(container, {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
      angle,
      distance: 10 + Math.random() * 40,
    })
  }
}
