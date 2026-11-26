/**
 * The meiou palette, fixed. Two materials and nothing else:
 *
 * - Neutral: a warm ladder from ivory paper to ink, all on hue 86° in oklch — the hue of the metal — at a chroma low
 *   enough to read as white and black, high enough that paper, ink and metal look like one family instead of grey
 *   sitting next to gold. No step is pure white (#fff) or pure black (#000): paper is 0.985 lightness at most, ink 0.178
 *   at least.
 * - Metal: PhaNo's three-step gradient plus its brightest face (photon). Dark mode shows the lit face, champagne to
 *   warm grey; light mode the shadowed face of the same metal, because the lit face vanishes on paper.
 *
 * src/index.css declares these same hex values as custom properties (palette.test.ts keeps the two in step). Import
 * from here only where CSS variables cannot reach: three.js materials, canvas, the loader's spark colours.
 */
export const NEUTRAL = {
  50: "#fbfaf7",
  100: "#f6f4ef",
  200: "#ebe8e2",
  300: "#e0ddd6",
  400: "#a8a49c",
  500: "#737068",
  600: "#55524c",
  700: "#35332e",
  800: "#23211d",
  900: "#1c1a17",
  950: "#12110f",
} as const

export type NeutralStep = keyof typeof NEUTRAL

export interface MetalSteps {
  hi: string
  mid: string
  lo: string
  photon: string
}

export const METAL = {
  light: { hi: "#8c8578", mid: "#5e584c", lo: "#332e24", photon: "#3a3630" },
  dark: { hi: "#f5f0de", mid: "#d2ccba", lo: "#7b776f", photon: "#f2efe6" },
} as const satisfies Record<"light" | "dark", MetalSteps>
