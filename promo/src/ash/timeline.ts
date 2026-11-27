/**
 * Pokémon Ash's beat sheet (40 seconds), Pikachu carrying it and Ash passing through: Pikachu trying on the eight hats,
 * the aces, the hat timeline, the Galar era page (G-Max Volt Crash, World Cap Pikachu), the friends' parade, the
 * Pokédex, Pikachu's cards, I CHOOSE YOU. Shared by the picture (Trailer.tsx) and the score (score.ts). Seconds.
 */
export const FPS = 30
export const SECONDS = 40
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 100

export const SHOT = {
  open: [0, 2.4],
  hats: [2.4, 9.6],
  aces: [9.6, 11.4],
  timeline: [11.4, 15.4],
  galar: [15.4, 25.4],
  friends: [25.4, 29],
  pokedex: [29, 32.4],
  cards: [32.4, 36],
  title: [36, 40],
} as const satisfies Record<string, readonly [number, number]>

/** Each hat click in the hero, seconds (the clip plays at 1.25 from 0.3: a click every 0.8 s) */
export const HAT_CLICKS = Array.from(
  { length: 8 },
  (_, k) => SHOT.hats[0] + (0.38 + k - 0.3) / 1.25
)

export const COPY = {
  open: { en: "ONE PIKACHU, EIGHT HATS", zh: "一隻皮卡丘，二十六年" },
  hats: { en: "EIGHT HATS", zh: "點一個年份，皮卡丘換上那一年的帽子" },
  aces: { en: "THE ACES", zh: "每一季的王牌，一鍵切換" },
  timeline: { en: "1997 → 2023", zh: "帽子時間軸" },
  galar: { en: "GALAR · 2019–2023", zh: "世代頁：伽勒爾" },
  volt: { en: "G-MAX VOLT CRASH", zh: "超極巨萬雷轟頂，世界帽皮卡丘" },
  friends: { en: "THE PARADE", zh: "五十七位夥伴，一路並肩" },
  pokedex: { en: "POKÉDEX", zh: "依世代、屬性篩選" },
  cards: { en: "TCG CARDS", zh: "皮卡丘的七張卡牌" },
  title: { en: ["I CHOOSE", "YOU"], zh: "就決定是你了" },
  strap: { en: "POKÉMON ASH · 1997 – 2023" },
} as const
