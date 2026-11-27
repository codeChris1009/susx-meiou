/**
 * Pokémon Heroines, from the site: a pale rose-cream ground, a pillar of light in each heroine's colour, bubbles and
 * sparkles drifting up, Nunito in light rounded capitals. The film is the softest of the set: dissolves, never cuts.
 */
import "@fontsource-variable/nunito"
import "@fontsource/noto-sans-tc/400.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  cream: "#fdf8f3",
  rose: "#f6e3ea",
  ink: "#4b3d4a",
  muted: "rgba(75, 61, 74, 0.6)",
  rule: "rgba(75, 61, 74, 0.25)",
} as const

export const FONT = {
  round: '"Nunito Variable", sans-serif',
  han: '"Noto Sans TC", sans-serif',
} as const

export const NOTE: NoteLook = {
  colour: INK.ink,
  muted: INK.muted,
  rule: INK.rule,
  mono: FONT.round,
  han: FONT.han,
  face: FONT.round,
  weight: 300,
  size: 30,
  tracking: 0.3,
  manner: "fade",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  [
    '300 40px "Nunito Variable"',
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÉ",
  ],
  ['800 40px "Nunito Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZHeroines"],
  ['700 40px "Nunito Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ·"],
  ['400 24px "Noto Sans TC"', zh],
])
