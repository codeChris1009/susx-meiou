/**
 * Pokémon Rivals, from the site: a scorched black-brown ground, gold dust like a night sky, Cinzel for the inscriptions
 * and Cormorant for the small text, a serif Chinese, firelight in ember orange. The film is a boss fight's ascent.
 */
import "@fontsource-variable/cinzel"
import "@fontsource/cormorant/500.css"
import "@fontsource/noto-serif-tc/600.css"

import type { NoteLook } from "../kit/note"
import { waitForFonts } from "../kit/ready"
import { COPY } from "./timeline"

export const INK = {
  ground: "#0c0906",
  gold: "#d9b56c",
  pale: "#f3e3bd",
  ember: "#ff6b3a",
  muted: "rgba(243, 227, 189, 0.6)",
  rule: "rgba(217, 181, 108, 0.5)",
} as const

export const FONT = {
  cinzel: '"Cinzel Variable", serif',
  cormorant: '"Cormorant", serif',
  serif: '"Noto Serif TC", serif',
} as const

export const GILT =
  "linear-gradient(180deg, #fff1c9 0%, #d9b56c 50%, #8a6328 100%)"

export const NOTE: NoteLook = {
  colour: INK.pale,
  muted: INK.gold,
  rule: INK.rule,
  mono: FONT.cormorant,
  han: FONT.serif,
  face: FONT.cinzel,
  weight: 500,
  size: 34,
  tracking: 0.18,
  manner: "spaced",
}

const zh = Object.values(COPY)
  .flatMap((c) => ("zh" in c ? [c.zh] : []))
  .join("")
waitForFonts([
  ['500 40px "Cinzel Variable"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ,"],
  ['500 40px "Cormorant"', "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  ['600 24px "Noto Serif TC"', zh],
])
