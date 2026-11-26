/**
 * The hero's greeting: "Hello world" in the languages the page's own two faces can set (Geist: Latin, Cyrillic and
 * Vietnamese; Noto Sans TC: Chinese and Japanese kana). Scripts neither face carries (Hangul, Arabic, Devanagari,
 * Thai, Greek) are left out rather than handed to whatever the visitor's system has, which would break the type.
 */
export interface Greeting {
  text: string
  /** BCP 47, so screen readers and line breaking treat each one as its own language */
  lang: string
}

export const FIRST: Greeting = { text: "Hello world", lang: "en" }

export const GREETINGS: readonly Greeting[] = [
  FIRST,
  { text: "你好世界", lang: "zh-Hant" },
  { text: "こんにちは世界", lang: "ja" },
  { text: "Hola mundo", lang: "es" },
  { text: "Bonjour le monde", lang: "fr" },
  { text: "Hallo Welt", lang: "de" },
  { text: "Ciao mondo", lang: "it" },
  { text: "Olá mundo", lang: "pt" },
  { text: "Hallo wereld", lang: "nl" },
  { text: "Hej världen", lang: "sv" },
  { text: "Witaj świecie", lang: "pl" },
  { text: "Merhaba dünya", lang: "tr" },
  { text: "Xin chào thế giới", lang: "vi" },
  { text: "Halo dunia", lang: "id" },
  { text: "Привет мир", lang: "ru" },
]

/**
 * Gradient hues (oklch) the greeting is set in, three stops each. Lightness and chroma come from CSS per theme, so
 * the same hues read on paper and on ink. Muted jewel tones that sit beside the metal rather than shouting over it.
 */
export const HUES: readonly (readonly [number, number, number])[] = [
  [80, 45, 15],
  [145, 180, 215],
  [250, 290, 330],
  [95, 70, 40],
  [200, 235, 265],
  [315, 345, 20],
  [120, 95, 75],
  [215, 255, 295],
  [35, 10, 345],
  [165, 135, 100],
]

/**
 * Draws items in a fresh random order each round, every item once per round, and never the same item twice in a row
 * across rounds. No repeats, and no order the eye can learn: the round boundary is reshuffled too.
 */
export function shuffleBag<T>(
  items: readonly T[],
  random: () => number = Math.random,
  /** Drawn first, before any shuffled round */
  first?: T
) {
  if (!items.length) throw new Error("shuffleBag needs at least one item")
  let bag: T[] = []
  let last: T | undefined = first

  const refill = () => {
    bag = [...items]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
    }
    // The next draw is the end of the array; keep it from echoing the previous round's last item
    if (bag.length > 1 && bag[bag.length - 1] === last) {
      ;[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1]!, bag[0]!]
    }
  }

  return function next(): T {
    if (!bag.length) refill()
    last = bag.pop()!
    return last
  }
}

/** A value in [min, max), so the beat never settles into a rhythm */
export const between = (min: number, max: number, random = Math.random) =>
  min + random() * (max - min)
