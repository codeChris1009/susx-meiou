/**
 * Pokémon Anti Org, from the site: a blue-black ground, Inter, small mono labels, each regime's own colour on its card.
 * The film reads as a declassified file: typed lines, black redaction bars, a red stamp, glitches on the cuts.
 */
import "@fontsource-variable/inter"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-sans-tc/500.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  ground: "#09090c",
  paper: "#e9e4d8",
  muted: "rgba(233, 228, 216, 0.6)",
  rule: "rgba(233, 228, 216, 0.3)",
  red: "#e5383b",
} as const

export const FONT = {
  sans: '"Inter Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  han: '"Noto Sans TC", sans-serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.paper,
  muted: INK.red,
  rule: INK.rule,
  mono: FONT.mono,
  han: FONT.han,
  size: 30,
  tracking: 0.12,
  manner: "type",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  ['800 40px "Inter Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ,"],
  ['400 40px "Geist Mono Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·–É"],
  ['500 24px "Noto Sans TC"', zh],
])
