/**
 * Gym Leaders' beat sheet (35 seconds at 120 bpm, a beat every half second): the molten home page and its nine regions,
 * Kalos, the index of leaders, Korrina's dossier with her card and Mega Lucario, Nessa with G-Max Drednaw, the badge
 * vault, the tactical spectrum, the name. Shared by the picture (Trailer.tsx) and the score (score.ts). Seconds.
 */
export const FPS = 30
export const SECONDS = 35
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 120

export const SHOT = {
  cold: [0, 1.6],
  hero: [1.6, 4.6],
  regions: [4.6, 8.6],
  kalos: [8.6, 11.6],
  list: [11.6, 14.6],
  korrina: [14.6, 17.6],
  lucario: [17.6, 21.6],
  nessa: [21.6, 24.6],
  drednaw: [24.6, 27.1],
  badges: [27.1, 29.6],
  spectrum: [29.6, 31.6],
  title: [31.6, 35],
} as const satisfies Record<string, readonly [number, number]>

/** The big cuts, where a braam lands */
export const BRAAM = [
  SHOT.hero[0],
  SHOT.kalos[0],
  SHOT.korrina[0],
  SHOT.nessa[0],
  SHOT.badges[0],
] as const

export const COPY = {
  cold: { en: "EVERY BADGE IS A BOND", zh: "每一枚徽章，都是一段羈絆" },
  regions: { en: "NINE REGIONS", zh: "首頁：從關都到伽勒爾" },
  kalos: { en: "KALOS", zh: "地區頁：卡洛斯與它的道館巡迴" },
  list: { en: "INDEX OF LEADERS", zh: "館主索引，卡片隨游標起伏" },
  korrina: { en: "KORRINA", zh: "館主檔案：可爾妮的角色卡" },
  lucario: { en: "MEGA LUCARIO", zh: "招牌寶可夢，數值與卡牌" },
  nessa: { en: "NESSA", zh: "露璃娜的檔案" },
  drednaw: { en: "G-MAX DREDNAW", zh: "超極巨暴噬龜" },
  badges: { en: "THE BADGE VAULT", zh: "徽章館：滑過每一枚" },
  spectrum: { en: "TACTICAL SPECTRUM", zh: "戰術光譜" },
  title: { en: "GYM LEADERS", zh: "寶可夢動畫・歷代道館館主" },
} as const
