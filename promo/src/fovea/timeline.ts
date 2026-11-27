/**
 * Fovea's beat sheet (36 seconds, slow, 72 bpm), Anthropic carrying it: what the reading room is for in two lines; the
 * rack in focus; its three displays; Anthropic picked up, turned over and opened; its company page; its prospectus read
 * by the contents; dark mode and the front page's lists; the name. Shared by the picture and the score. Seconds.
 */
export const FPS = 30
export const SECONDS = 36
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 72

export const SHOT = {
  open: [0, 2.8],
  rack: [2.8, 6.6],
  displays: [6.6, 11],
  anthropic: [11, 16.6],
  read: [16.6, 20.6],
  company: [20.6, 24.8],
  prospectus: [24.8, 30],
  dark: [30, 33],
  title: [33, 36],
} as const satisfies Record<string, readonly [number, number]>

/** Where the hand moves something: paper sounds land here */
export const PAPER = [
  7.2, 9.4, 11.6, 13.6, 14.6, 17.0, 18.6, 21.6, 23.9, 25.4, 27.0, 30.4,
] as const

export const COPY = {
  open: {
    en: ["Companies write long.", "Read what they actually said."],
    zh: "公司寫得很長，讀他們真正說過的話",
  },
  rack: { en: "THE RACK", zh: "封面朝外，一排排立在架上" },
  displays: { en: "THREE WAYS TO SHELVE", zh: "書架、書脊、平台" },
  pick: { en: "PICK UP ANTHROPIC", zh: "從架上拿起一本" },
  flip: { en: "TURN IT OVER", zh: "翻到封底，看這一期收了什麼" },
  read: { en: "OPEN IT", zh: "翻開，一頁一頁讀" },
  company: { en: "THE COMPANY PAGE", zh: "創辦人信、摘要、招股書" },
  facts: { en: "READ BY THE CONTENTS", zh: "依目錄跳讀：重點數字" },
  bull: { en: "BULL VS BEAR", zh: "多空兩面並排" },
  dark: { en: "DARK MODE", zh: "深色書架與首頁文章列表" },
  title: { en: "Fovea", zh: "公司官方長文的閱讀站" },
  strap: { en: "FOVEA READING ROOM" },
} as const
