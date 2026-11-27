/**
 * The look, taken from the gallery's own source (demo-3js-Gallery0) rather than from memory: its spark palettes
 * (cursor.js), its cool halo and frame grey, its script and serif faces (index.html), its scene constants (main.js).
 */
export const INK = "#000000"
/** INTRO_FIREWORK_COLORS: warm white to champagne gold */
export const EMBERS = [
  "#ffffffe6",
  "#fffae6",
  "#fff5c8",
  "#ecdc9d",
  "#ffd48a",
] as const
/** The cool halo around the frame sparks, rgba(200, 220, 255, 0.35) */
export const HALO = "#c8dcff"
/** Hairline gold for the drawn construction lines */
export const GILT = "#ecdc9d"
/** The title's metal, champagne into old gold */
export const GOLD_METAL = [
  "#fffae6",
  "#fff5c8",
  "#ecdc9d",
  "#ffd48a",
  "#a8823a",
] as const
/** Text: the gallery's resting grey and its hover ivory */
export const MUTED = "#9b9b9b"
export const IVORY = "#f2eee4"

export const FONT = {
  script: '"Stalemate", cursive',
  serif: '"Cormorant", "Noto Serif TC", serif',
  han: '"Noto Serif TC", serif',
} as const

/** Scene constants from main.js, img-border.js, spotlight.js, reflector-mirror.js */
export const SCENE = {
  artwork: { width: 3, height: 2, depth: 0.1, z: -4 },
  focus: { zOffset: 0.55, sideScale: 0.6, focusScale: 1.12 },
  border: {
    width: 3.09,
    height: 2.09,
    depth: 0.09,
    radius: 0.03,
    color: 0xaaaaaa,
  },
  spot: {
    intensity: 110,
    distance: 10,
    angle: 0.68,
    penumbra: 1,
    decay: 1.2,
    position: [0, 5, 0],
    target: [0, 1.5, -5],
  },
  floor: { y: -1.1, radius: 10 },
} as const
