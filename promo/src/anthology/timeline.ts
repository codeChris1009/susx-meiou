/**
 * Anthology's beat sheet (about a minute): a signal in the dark, the home page's flight from the whole world down to
 * one city, then Artisanal at length (Zen mode to turn and zoom the world, then Taiwan's vial opened and expanded), the other four spaces in a
 * breath, and the name. One source of time for the picture (Trailer.tsx) and the score (score.ts). Seconds.
 */
export const FPS = 30
export const SECONDS = 60
export const WIDTH = 1920
export const HEIGHT = 804

export const SHOT = {
  open: [0, 3.2],
  signal: [3.2, 11],
  island: [11, 16.6],
  chapter: [16.6, 18.8],
  idle: [18.8, 21.2],
  zen: [21.2, 33],
  taiwan: [33, 39],
  expand: [39, 46.6],
  spaces: [46.6, 53.8],
  title: [53.8, 60],
} as const satisfies Record<string, readonly [number, number]>

/** The four other spaces, each a beat of the montage */
export const SPACES = ["astra", "spindle", "folio", "sculpture"] as const
export const SPACE_BEAT = (SHOT.spaces[1] - SHOT.spaces[0]) / SPACES.length

/** Everything the film says */
export const COPY = {
  signal: { en: "A DISTANT SIGNAL", zh: "微光在遠方聚合" },
  chapter: {
    en: "TURN THE WORLD, PICK A COUNTRY",
    zh: "轉動世界，點選一個國家",
    index: "01 — ARTISANAL",
  },
  idle: {
    en: "WORLD WHISPERS, SEALED IN VIALS",
    zh: "世界的低語，封存在小瓶裡",
  },
  zen: { en: "ZEN MODE", zh: "介面退下，只留地球" },
  drag: { en: "DRAG TO ROTATE", zh: "拖曳，轉動整顆地球" },
  zoom: { en: "SCROLL TO ZOOM", zh: "滾動，從大洲推近到海岸" },
  back: { en: "ESC · BACK TO THE ATLAS", zh: "按 Esc 回到原本模式" },
  taiwan: { en: "CLICK TAIWAN", zh: "點選台灣，打開它的情報小瓶" },
  expand: { en: "EXPAND THE IMPRINT", zh: "出處、指紋、趨勢，一頁展開" },
  astra: { en: "ASTRA", zh: "一句問題，織成一張星圖" },
  spindle: { en: "SPINDLE", zh: "線索連成一張調查板" },
  folio: { en: "FOLIO", zh: "地圖收成一冊" },
  sculpture: { en: "SCULPTURE", zh: "從工匠到王座的席位" },
  title: { en: "ANTHOLOGY", zh: "未竟之問的世界地圖" },
  strap: { en: "WORLD ATLAS FOR UNFINISHED QUESTIONS" },
} as const

/** Sound cues, seconds: pings of the signal, the low hits, and the interface's own clicks */
export const CUE = {
  ping: [0.4, 1.8, 3.2, 7.2, 11, 14],
  boom: [16.6, 33],
  tick: [21.8, 33.7, 38.9],
  whoosh: [46.6, 48.4, 50.2, 52],
  riser: [52, 53.8],
  hit: 53.8,
} as const
