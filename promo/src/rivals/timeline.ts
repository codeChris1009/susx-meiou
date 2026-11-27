/**
 * Pokémon Rivals' beat sheet (40 seconds, war drums at 90 bpm that double), Leon, Cynthia and Alain carrying it in that
 * measure: a sigil in the dark, the storm and the tower of fifteen, the roster with its radar, each rival summoned by a
 * held challenge, Versus with Cynthia against Leon, the name. Shared by the picture and the score. Seconds.
 */
export const FPS = 30
export const SECONDS = 40
export const WIDTH = 1920
export const HEIGHT = 804
export const BPM = 90

export const SHOT = {
  open: [0, 2.4],
  storm: [2.4, 6],
  tower: [6, 11],
  list: [11, 15],
  leon: [15, 23],
  cynthia: [23, 28.5],
  alain: [28.5, 31.5],
  versus: [31.5, 36],
  name: [36, 40],
} as const satisfies Record<string, readonly [number, number]>

/** Each rival appears when the held challenge lets go: seconds into the film */
export const REVEAL = { leon: 18.6, cynthia: 25.8, alain: 30.2 } as const

export const COPY = {
  open: { en: ["FIFTEEN WALLS", "ONE CROWN"], zh: "十五道高牆，一頂王冠" },
  tower: { en: "FIFTEEN FLOORS", zh: "十五層樓，一層一位宿敵" },
  list: { en: "THE ROSTER", zh: "六維雷達，篩選宿敵與八大師" },
  hold: { en: "HOLD TO CHALLENGE", zh: "長按，挑戰丹帝" },
  leon: { en: "LEON · THE UNDEFEATED", zh: "無敗的帝王丹帝" },
  ace: { en: "ACE", zh: "超極巨化噴火龍" },
  cynthia: { en: "CYNTHIA", zh: "竹蘭，神奧的冠軍" },
  alain: { en: "ALAIN", zh: "艾嵐，藍色的烈焰" },
  versus: { en: "VERSUS", zh: "竹蘭對丹帝" },
  name: { en: "RIVALS", zh: "傳奇宿敵" },
  strap: { en: "THE FINAL WALL" },
} as const
