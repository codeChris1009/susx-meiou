/**
 * Pokémon Anti Org's beat sheet (38 seconds, tense, 100 bpm), Rocket, Plasma and Aether / Skull carrying it: a file
 * header typed and redacted, the cover, nine regimes flicked through, then the three opened (leader cards, the radar,
 * the two faces of a regime, its dimensions), the verdict, the name stamped. Shared by the picture and the score.
 */
export const FPS = 30
export const SECONDS = 38
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 100

export const SHOT = {
  open: [0, 3],
  intro: [3, 5],
  switch: [5, 9],
  rocket: [9, 18],
  plasma: [18, 25.5],
  aether: [25.5, 32.5],
  verdict: [32.5, 35],
  title: [35, 38],
} as const satisfies Record<string, readonly [number, number]>

/** Where the hand presses something in the three regimes: glitches and ticks land here */
export const PRESS = [
  9.7, 10.6, 11.4, 12.6, 14.4, 16.4, 19.0, 20.4, 21.8, 24.0, 26.2, 27.4, 28.2,
  29.4, 31.0,
] as const

export const COPY = {
  open: {
    en: ["FILE 01–09", "NINE GENERATIONS · NINE REGIMES"],
    fields: "FUNDING  ··  DOCTRINE  ··  CHAIN OF COMMAND  ··  ENDGAME",
    zh: "寶可夢世界的真實反派組織",
  },
  switch: { en: "NINE REGIMES", zh: "底部導覽，一個組織一份檔案" },
  rocketCards: { en: "TEAM ROCKET", zh: "首領坂木的九張卡牌" },
  radar: { en: "ORGANIZATION · LEADER", zh: "雷達切換組織與首領" },
  rule: { en: "METHODS OF RULE", zh: "十個維度：統治手段" },
  plasmaFaces: {
    en: "PLASMA · FRONT AND SHADOW",
    zh: "表面的解放，暗面的奪取",
  },
  ideology: { en: "CORE IDEOLOGY", zh: "核心意識形態與光譜" },
  aether: { en: "AETHER · SKULL", zh: "以太基金會與骷髏隊" },
  real: { en: "REAL-WORLD IMPLICATIONS", zh: "真實世界的對照" },
  verdict: { en: "NEVER A FAIRY TALE", zh: "通俗文化從來不是真空童話" },
  title: { en: "REGIMES, DECODED", zh: "寶可夢九世代政權解密" },
  strap: { en: "POKÉMON ANTI-ORG" },
  stamp: { en: "DECLASSIFIED" },
} as const
