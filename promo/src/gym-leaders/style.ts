/**
 * Gym Leaders, from the site: a ground of molten gold and crimson silk, heavy Geist set tight and huge, a serif for the
 * Chinese, numbers in tabular figures. The film runs hot and on the beat, the way the site's hero moves.
 */
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-serif-tc/700.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  ground: "#0b0604",
  gold: "#f6c453",
  ember: "#ff7a2f",
  crimson: "#b3122a",
  white: "#fff6e8",
  muted: "rgba(255, 238, 214, 0.66)",
  line: "rgba(246, 196, 83, 0.55)",
} as const

export const FONT = {
  sans: '"Geist Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  serif: '"Noto Serif TC", serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.white,
  muted: INK.gold,
  rule: INK.line,
  mono: FONT.mono,
  han: FONT.serif,
  face: FONT.sans,
  weight: 800,
  size: 40,
  tracking: 0.02,
  manner: "slam",
}

/** The gold of the title: the site's highlight, hot at the top */
export const GOLD =
  "linear-gradient(180deg, #fff3c4 0%, #f6c453 45%, #d9822b 100%)"

const zh = Object.values(COPY)
  .map((c) => c.zh)
  .join("")
waitForFonts([
  ['800 40px "Geist Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·,-"],
  ['400 40px "Geist Mono Variable"', "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  ['700 24px "Noto Serif TC"', zh],
])
