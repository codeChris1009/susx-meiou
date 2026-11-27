/**
 * Fovea, from the site: warm paper, near-black ink, Geist at editorial sizes, small red-orange capitals for section
 * labels, magazines in deep brown and navy. The film reads like the site: slowly, with only the middle of the eye
 * sharp (the fovea), the rest of the page soft.
 */
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@fontsource/noto-sans-tc/400.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  paper: "#f6f2ec",
  ink: "#1b1916",
  muted: "rgba(27, 25, 22, 0.58)",
  rule: "rgba(27, 25, 22, 0.28)",
  accent: "#c8472c",
} as const

export const FONT = {
  sans: '"Geist Variable", sans-serif',
  mono: '"Geist Mono Variable", monospace',
  han: '"Noto Sans TC", sans-serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.accent,
  muted: INK.ink,
  rule: INK.rule,
  mono: FONT.mono,
  han: FONT.han,
  size: 22,
  tracking: 0.3,
  manner: "fade",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  [
    '500 40px "Geist Variable"',
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.",
  ],
  ['400 40px "Geist Mono Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ·"],
  ['400 24px "Noto Sans TC"', zh],
])
