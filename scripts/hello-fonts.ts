/**
 * Cuts the hero greeting's fonts. For each script in SCRIPTS (src/features/hero/greetings.ts), the Noto face is cut
 * down to the letters the greetings and their decode pools use, pinned at the display weight, and written to
 * src/features/hero/fonts/, with the @font-face rules for them in src/features/hero/hello-fonts.css. A few KB each
 * where the full faces run to 200 KB (Ethiopic) and 700 KB (Tibetan); a browser fetches one only when a greeting in
 * its script comes up (unicode-range).
 *
 *   pnpm fonts:hello     # after changing a greeting or a pool
 *
 * The sources are devDependencies: fontsource packages, whose CSS says which file holds which code points, and for
 * Hangul the whole Pretendard face (its Hangul is Source Han Sans, the design Noto Sans KR ships only in 124 slices).
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import subsetFont from "subset-font"

import { GREETINGS, SCRIPTS } from "../src/features/hero/greetings.ts"

type Script = (typeof SCRIPTS)[number]

/** Each script's face: a fontsource stylesheet that lists its files with their unicode-range, or one whole font */
const SOURCES: Record<Script, string | { font: string; variable: boolean }> = {
  Greek: "@fontsource-variable/noto-sans/wght.css",
  Georgian: "@fontsource-variable/noto-sans-georgian/wght.css",
  Hebrew: "@fontsource-variable/noto-sans-hebrew/wght.css",
  Ethiopic: "@fontsource-variable/noto-sans-ethiopic/wght.css",
  Tibetan: "@fontsource-variable/noto-serif-tibetan/wght.css",
  Tifinagh: "@fontsource/noto-sans-tifinagh/400.css",
  Hangul: {
    font: "pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
    variable: true,
  },
}
/** The greeting's weight (.heading-display in hero.css); variable faces are pinned there */
const WEIGHT = 600
const FAMILY = "Hello Scripts"

const MODULES = new URL("../node_modules/", import.meta.url)
const OUT = new URL("../src/features/hero/fonts/", import.meta.url)
const CSS = new URL("../src/features/hero/hello-fonts.css", import.meta.url)

interface Face {
  file: URL
  variable: boolean
  ranges: [number, number][]
}

/** The @font-face rules of a fontsource stylesheet: each file, whether it is variable, and the code points it has */
async function faces(source: (typeof SOURCES)[Script]): Promise<Face[]> {
  if (typeof source !== "string")
    return [
      {
        file: new URL(source.font, MODULES),
        variable: source.variable,
        ranges: [[0, 0x10ffff]],
      },
    ]
  const sheet = source
  const url = new URL(sheet, MODULES)
  const css = await readFile(url, "utf8")
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body = ""]) => {
    const src = /url\(([^)]+)\)\s*format\(['"]?([\w-]+)/.exec(body)
    const range = /unicode-range:\s*([^;]+);/.exec(body)
    if (!src?.[1] || !range?.[1]) throw new Error(`Unreadable face in ${sheet}`)
    return {
      file: new URL(src[1], url),
      variable: src[2] === "woff2-variations",
      ranges: range[1].split(",").map((r) => {
        const [lo = "", hi = lo] = r.trim().replace(/^U\+/i, "").split("-")
        return [parseInt(lo, 16), parseInt(hi, 16)]
      }),
    }
  })
}

/** Code points as a compact unicode-range: runs collapse to lo-hi */
function unicodeRange(points: number[]) {
  const runs: string[] = []
  for (let i = 0; i < points.length;) {
    let j = i
    while (points[j + 1] === points[j]! + 1) j++
    const hex = (n: number) => n.toString(16)
    runs.push(
      j > i ? `U+${hex(points[i]!)}-${hex(points[j]!)}` : `U+${hex(points[i]!)}`
    )
    i = j + 1
  }
  return runs.join(", ")
}

const letters = GREETINGS.flatMap((g) => [...g.text, ...g.pool])
const rules: string[] = []
let total = 0

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

for (const script of SCRIPTS) {
  const own = new RegExp(`\\p{Script=${script}}`, "u")
  const points = [...new Set(letters.filter((c) => own.test(c)))]
    .map((c) => c.codePointAt(0)!)
    .sort((a, b) => a - b)
  const list = await faces(SOURCES[script])

  // Each letter from the first file that has it
  const byFace = new Map<Face, number[]>()
  for (const p of points) {
    const face = list.find((f) =>
      f.ranges.some(([lo, hi]) => p >= lo && p <= hi)
    )
    if (!face) throw new Error(`No ${script} face has U+${p.toString(16)}`)
    byFace.set(face, [...(byFace.get(face) ?? []), p])
  }

  let n = 0
  for (const [face, have] of byFace) {
    const name = `hello-${script.toLowerCase()}${byFace.size > 1 ? `-${++n}` : ""}.woff2`
    const cut = await subsetFont(
      await readFile(face.file),
      String.fromCodePoint(...have),
      {
        targetFormat: "woff2",
        ...(face.variable ? { variationAxes: { wght: WEIGHT } } : {}),
      }
    )
    await writeFile(new URL(name, OUT), cut)
    total += cut.length
    console.log(`${name.padEnd(26)} ${have.length} letters, ${cut.length} B`)
    rules.push(`@font-face {
  font-family: "${FAMILY}";
  font-style: normal;
  /* One weight, cut at ${face.variable ? WEIGHT : 400}, serving any: never synthesised bolder */
  font-weight: 100 900;
  font-display: swap;
  src: url("./fonts/${name}") format("woff2");
  unicode-range: ${unicodeRange(have)};
}`)
  }
}

await writeFile(
  CSS,
  `/*
 * Generated by scripts/hello-fonts.ts (pnpm fonts:hello): do not edit. The hero greeting's scripts that the page's
 * own faces do not carry, cut from Noto and Pretendard (SIL Open Font License 1.1) down to the letters it uses.
 */
${rules.join("\n")}
`
)
console.log(`${rules.length} faces, ${total} B in all → ${fileURLToPath(CSS)}`)
