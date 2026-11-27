/**
 * Pokémon Heroines' beat sheet (36 seconds, gentle, 84 bpm), Serena and Lillie carrying it: a pillar of light, the
 * cover, four heroines passed through the chapter nav, then Serena (her cards, the Bond / Heroine radar, a dimension
 * opened) and Lillie (seven cards, a dimension, her context), the promise, the name. Shared by picture and score.
 */
export const FPS = 30
export const SECONDS = 36
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 84

export const SHOT = {
  open: [0, 2.6],
  intro: [2.6, 5],
  switch: [5, 10],
  serena: [10, 20.5],
  lillie: [20.5, 29],
  promise: [29, 32],
  title: [32, 36],
} as const satisfies Record<string, readonly [number, number]>

/** The six, with their colours from the site: the dots of the title, and the two who carry the film */
export const SIX = [
  { id: "misty", colour: "#4aa3df" },
  { id: "may", colour: "#e5525e" },
  { id: "dawn", colour: "#e08abf" },
  { id: "iris", colour: "#8f6ad0" },
  { id: "serena", colour: "#5b86e6" },
  { id: "lillie", colour: "#43b3ac" },
] as const

export const COPY = {
  open: {
    en: "SIX SOULS WHO WALKED BESIDE ASH",
    zh: "陪小智走過旅途的六個靈魂",
  },
  switch: { en: "ONE CHAPTER EACH", zh: "底部導覽，一位一章，各有其色" },
  serenaCards: { en: "SERENA · HER CARDS", zh: "點一張，換一張" },
  radar: { en: "BOND · HEROINE", zh: "雷達切換兩種視角" },
  dimension: { en: "TEN DIMENSIONS", zh: "點開一個維度：與小智的羈絆" },
  lillieCards: { en: "LILLIE · SEVEN CARDS", zh: "卡牌翻面切換" },
  growth: { en: "GROWTH ARC", zh: "成長弧，一頁讀完" },
  context: { en: "EXPAND CONTEXT", zh: "展開角色脈絡" },
  promise: { en: "NEVER A SUPPORTING ROLE", zh: "我們從來不是誰故事裡的配角" },
  title: { en: "Heroines", zh: "寶可夢動畫歷代女主角" },
  strap: { en: "THE HEROINES OF THE POKÉMON ANIME" },
} as const
