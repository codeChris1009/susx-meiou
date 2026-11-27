/**
 * The hero's greeting: "Hello world" in one language after another. Latin, Cyrillic and Vietnamese are set in Geist,
 * Han, kana and bopomofo in Noto Sans TC (the page's own two faces); every other script in a Noto face cut down to
 * the few letters it needs here (SCRIPTS, scripts/hello-fonts.ts), never left to whatever the visitor's system has.
 */
export interface Greeting {
  text: string
  /** BCP 47, so screen readers and line breaking treat each one as its own language */
  lang: string
  dir?: "rtl"
  /** What it is, for the tip under the pointer */
  name: { en: string; zh: string }
  /** Letters of its own script that it decodes through (decode.ts), one per grapheme */
  pool: string
}

/** Scripts set from cut-down Noto faces, by Unicode script name; scripts/hello-fonts.ts cuts them */
export const SCRIPTS = [
  "Greek",
  "Georgian",
  "Hebrew",
  "Ethiopic",
  "Tibetan",
  "Tifinagh",
  "Hangul",
] as const

const LATIN = "abcdefghijklmnopqrstuvwxyz"

export const FIRST: Greeting = {
  text: "Hello world",
  lang: "en",
  name: { en: "English", zh: "英文" },
  pool: LATIN,
}

export const GREETINGS: readonly Greeting[] = [
  FIRST,
  {
    text: "你好世界",
    lang: "zh-Hant",
    name: { en: "Traditional Chinese", zh: "繁體中文" },
    pool: "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ",
  },
  {
    text: "こんにちは世界",
    lang: "ja",
    name: { en: "Japanese", zh: "日文" },
    pool: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
  },
  {
    text: "Hola mundo",
    lang: "es",
    name: { en: "Spanish", zh: "西班牙文" },
    pool: LATIN + "ñáéíóú",
  },
  {
    text: "Bonjour le monde",
    lang: "fr",
    name: { en: "French", zh: "法文" },
    pool: LATIN + "éèêàçô",
  },
  {
    text: "Hallo Welt",
    lang: "de",
    name: { en: "German", zh: "德文" },
    pool: LATIN + "äöüß",
  },
  {
    text: "Ciao mondo",
    lang: "it",
    name: { en: "Italian", zh: "義大利文" },
    pool: LATIN + "àèìòù",
  },
  {
    text: "Olá mundo",
    lang: "pt",
    name: { en: "Portuguese", zh: "葡萄牙文" },
    pool: LATIN + "ãõáâçé",
  },
  {
    text: "Hallo wereld",
    lang: "nl",
    name: { en: "Dutch", zh: "荷蘭文" },
    pool: LATIN + "ëï",
  },
  {
    text: "Hej världen",
    lang: "sv",
    name: { en: "Swedish", zh: "瑞典文" },
    pool: LATIN + "åäö",
  },
  {
    text: "Witaj świecie",
    lang: "pl",
    name: { en: "Polish", zh: "波蘭文" },
    pool: LATIN + "ąćęłńóśźż",
  },
  {
    text: "Merhaba dünya",
    lang: "tr",
    name: { en: "Turkish", zh: "土耳其文" },
    pool: LATIN + "çğıöşü",
  },
  {
    text: "Xin chào thế giới",
    lang: "vi",
    name: { en: "Vietnamese", zh: "越南文" },
    pool: LATIN + "ăâđêôơưàảáạếềớờ",
  },
  {
    text: "Halo dunia",
    lang: "id",
    name: { en: "Indonesian", zh: "印尼文" },
    pool: LATIN,
  },
  {
    text: "Привет мир",
    lang: "ru",
    name: { en: "Russian", zh: "俄文" },
    pool: "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
  },
  {
    text: "ⴰⵣⵓⵍ ⴰⵎⴰⴹⴰⵍ",
    lang: "zgh",
    name: { en: "Tamazight (Tifinagh)", zh: "提非納文（柏柏語）" },
    pool: "ⴰⴱⴳⴷⴹⴻⴼⴽⵀⵃⵄⵅⵇⵉⵊⵍⵎⵏⵓⵔⵕⵖⵙⵚⵛⵜⵟⵡⵢⵣⵥ",
  },
  {
    text: "გამარჯობა მსოფლიო",
    lang: "ka",
    name: { en: "Georgian", zh: "喬治亞文" },
    pool: "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ",
  },
  {
    // Syllables part with the tsheg (་), not spaces
    text: "བཀྲ་ཤིས་བདེ་ལེགས་འཛམ་གླིང",
    lang: "bo",
    name: { en: "Tibetan", zh: "藏文" },
    pool: "ཀཁགངཅཆཇཉཏཐདནཔཕབམཙཚཛཝཞཟའཡརལཤསཧཨ",
  },
  {
    text: "안녕 세상",
    lang: "ko",
    name: { en: "Korean (Hangul)", zh: "韓文（諺文）" },
    // The jamo the syllables are built from
    pool: "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ",
  },
  {
    text: "שלום עולם",
    lang: "he",
    dir: "rtl",
    name: { en: "Hebrew", zh: "希伯來文" },
    pool: "אבגדהוזחטיכלמנסעפצקרשת",
  },
  {
    text: "ሰላም ዓለም",
    lang: "am",
    name: { en: "Amharic (Ge'ez)", zh: "吉茲字母（衣索比亞文）" },
    pool: "ሀለሐመሠረሰሸቀበተቸኀነኘአከኸወዐዘዠየደጀገጠጨጰጸፀፈፐ",
  },
  {
    text: "Γεια σου κόσμε",
    lang: "el",
    name: { en: "Greek", zh: "希臘文" },
    pool: "αβγδεζηθικλμνξοπρστυφχψωάέήίόύώ",
  },
  {
    text: "Salve munde",
    lang: "la",
    name: { en: "Latin", zh: "拉丁文" },
    pool: LATIN,
  },
  {
    text: "Halló heimur",
    lang: "is",
    name: { en: "Icelandic", zh: "冰島文" },
    pool: LATIN + "áðéíóúýþæö",
  },
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
