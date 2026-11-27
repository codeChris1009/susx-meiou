/**
 * Anthology at night, from the site's dark theme: near-black ground, starlight white, the globe's warm rim light, Geist
 * set in wide-tracked capitals, Geist Mono for coordinates and labels. Monochrome on purpose: the only colour in the
 * product is the iridescent edge round a chosen country, so the film keeps colour for that moment.
 */
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-sans-tc/300.css"
import "@fontsource/noto-sans-tc/400.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  ground: "#060606",
  star: "#f5f2ec",
  muted: "rgba(245, 242, 236, 0.58)",
  faint: "rgba(245, 242, 236, 0.22)",
  line: "rgba(245, 242, 236, 0.32)",
  rim: "#f1e6cf",
} as const

export const FONT = {
  sans: '"Geist Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  han: '"Noto Sans TC", sans-serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.star,
  muted: INK.muted,
  rule: INK.line,
  mono: FONT.mono,
  han: FONT.han,
  size: 26,
  tracking: 0.22,
  manner: "decode",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  ['300 40px "Geist Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  ['400 40px "Geist Mono Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—°"],
  ['300 24px "Noto Sans TC"', zh],
  ['400 24px "Noto Sans TC"', zh],
])
