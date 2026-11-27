/**
 * YI 64, from the site: a warm black, bone-white text, ink-wash images of the eight trigrams in sage, rust and slate,
 * Geist light with mono labels, a serif for the Chinese. The film is the slowest of the set: lines drawn one at a time.
 */
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-serif-tc/400.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  ground: "#0b0907",
  bone: "#ece4d3",
  muted: "rgba(236, 228, 211, 0.55)",
  rule: "rgba(236, 228, 211, 0.25)",
  sage: "#a9b8a2",
  rust: "#c88f6b",
} as const

export const FONT = {
  sans: '"Geist Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  serif: '"Noto Serif TC", serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.bone,
  muted: INK.muted,
  rule: INK.rule,
  mono: FONT.mono,
  han: FONT.serif,
  size: 24,
  tracking: 0.4,
  manner: "decode",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  ['300 40px "Geist Variable"', "YI·64"],
  ['400 40px "Geist Mono Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-"],
  ['400 24px "Noto Serif TC"', zh],
])
