/**
 * YI 64's beat sheet (36 seconds, still), the components carrying it: a hexagram built line by line, the landing page
 * in passing, the eight trigrams and their tabs and chamber, the chart of sixty-four, hexagram 27 read through its six
 * tabs, a reading cast, a passage observed, the name. Shared by the picture (Trailer.tsx) and the score. Seconds.
 */
export const FPS = 30
export const SECONDS = 36
export const WIDTH = 1920
export const HEIGHT = 804

export const SHOT = {
  open: [0, 3],
  gate: [3, 4.8],
  trigrams: [4.8, 13.8],
  chart: [13.8, 17.6],
  nourish: [17.6, 26.6],
  oracle: [26.6, 30.2],
  observe: [30.2, 33],
  title: [33, 36],
} as const satisfies Record<string, readonly [number, number]>

/** The hexagram the film builds, bottom line first: true is a whole line (yang), false a broken one (yin). 27, 頤 */
export const HEXAGRAM = [true, false, false, false, false, true] as const

export const COPY = {
  open: { en: "THE MACHINE READS THE CHANGES", zh: "機器讀易" },
  eight: { en: "THE EIGHT", zh: "點一個卦，3D 卦象隨之翻轉" },
  tabs: { en: "NATURE · VIRTUE · ELEMENT", zh: "象、德、行、族、衍，五種讀法" },
  chamber: { en: "ENTER THE CHAMBER", zh: "進入" },
  chart: { en: "THE CHART", zh: "六十四卦排成一座星盤" },
  nourish: { en: "27 · 頤 NOURISHMENT", zh: "單卦頁" },
  six: { en: "SIX TABS", zh: "題、詞、焦、演、爻、構" },
  kin: { en: "ITS KIN", zh: "同一下卦的八種組合" },
  oracle: { en: "THE ORACLE", zh: "問一件事，擲出一卦" },
  observe: { en: "OBSERVE", zh: "貼一段文本，讀出卦象" },
  title: { en: "YI·64", zh: "易經六十四卦的互動閱讀" },
  strap: { en: "A POST-HUMAN ARCHIVE OF THE I CHING" },
} as const
