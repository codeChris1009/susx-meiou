/**
 * Pokémon Ash, from the site: a night sky running from crimson to navy, a thin gold line down the middle of every
 * screen, Geist in heavy capitals, a serif for the Chinese, I CHOOSE YOU in a red-to-blue gradient.
 */
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-serif-tc/500.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  navy: "#0a1030",
  red: "#e3262f",
  blue: "#2f5bd8",
  gold: "#ecc56c",
  white: "#f6f3ff",
  muted: "rgba(246, 243, 255, 0.62)",
  line: "rgba(236, 197, 108, 0.7)",
} as const

export const FONT = {
  sans: '"Geist Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  serif: '"Noto Serif TC", serif',
} as const

export const SKY = `radial-gradient(ellipse 80% 90% at 20% 30%, rgba(227,38,47,0.35), transparent 60%), radial-gradient(ellipse 70% 90% at 85% 80%, rgba(47,91,216,0.4), transparent 60%), ${INK.navy}`
export const CHOOSE = `linear-gradient(90deg, ${INK.red} 0%, #b83a8a 50%, ${INK.blue} 100%)`

export const NOTE: NoteLook = {
  colour: INK.white,
  muted: INK.gold,
  rule: INK.line,
  mono: FONT.mono,
  han: FONT.serif,
  face: FONT.sans,
  weight: 800,
  size: 44,
  tracking: 0.02,
  manner: "rise",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  ['800 40px "Geist Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·→–"],
  ['400 40px "Geist Mono Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·É–"],
  ['500 24px "Noto Serif TC"', zh],
])
