import type { CapturePlan, Step } from "../kit/capture-plan"

/**
 * Pikachu carries the film; Ash passes through. The home page is a column of full screens, some pinned while they play:
 * one wheel of 1080 px moves exactly one screen (0 hero, 2 the eight Ashes and their aces, 3–6 hats, 10 back to Pallet,
 * 11–18 friends).
 */
const screen = (n = 1, settle = 900): Step[] =>
  Array.from(
    { length: n },
    () => [{ wheel: 1080, ms: 700 }, { wait: settle }] as Step[]
  ).flat()
/** The hat bar under the hero: 1997 to 2019, each click puts Pikachu in that hat */
const HATS = [652, 740, 828, 916, 1004, 1092, 1180, 1268]
const ACES = ["赫拉克羅斯", "森林蜥蜴", "烈焰猴", "流氓鱷", "小智版甲賀忍蛙"]

export const CAPTURE: CapturePlan = {
  base: "https://pokemon-ash.susx.workers.dev",
  shots: [
    {
      name: "hero-hats",
      url: "/",
      clip: {
        seconds: 9,
        steps: HATS.flatMap((x): Step[] => [
          { click: [x, 947], ms: 380 },
          { wait: 620 },
        ]),
      },
    },
    {
      name: "aces",
      steps: screen(2, 1500),
      clip: {
        seconds: 6,
        steps: ACES.flatMap((name): Step[] => [
          { click: `button:has-text("${name}")`, ms: 450 },
          { wait: 600 },
        ]),
      },
    },
    { name: "hats", clip: { seconds: 8, steps: screen(4, 1200) } },
    {
      name: "friends",
      steps: screen(4, 1200),
      clip: { seconds: 9, steps: screen(8, 400) },
    },
    // Galar, the era page: the title, G-Max Volt Crash, World Cap Pikachu among the partners
    {
      name: "galar",
      url: "/eras/galar",
      clip: {
        seconds: 13,
        steps: [
          { wait: 1200 },
          ...screen(2, 600),
          ...screen(1, 2200),
          ...screen(1, 2600),
          { move: [960, 560], ms: 800 },
        ],
      },
    },
    // The Pokédex, narrowed to Galar, then to Electric (Pikachu among them); then Pikachu's cards
    {
      name: "pokedex",
      url: "/pokedex",
      clip: {
        seconds: 8,
        steps: [
          { click: 'button:has-text("VIII · 伽勒爾")', ms: 900 },
          { wait: 1400 },
          { click: 'button:has-text("All · 全部")', ms: 700 },
          { wait: 500 },
          { click: 'button[aria-label^="電"]', ms: 700 },
          { wait: 1400 },
          { move: [150, 820], ms: 900 },
          { wait: 800 },
        ],
      },
    },
    {
      name: "cards",
      url: "/cards",
      clip: {
        seconds: 7,
        steps: [
          { move: '[aria-label*="小智的皮卡丘"]', ms: 1200 },
          { wait: 600 },
          { click: '[aria-label*="小智的皮卡丘"]', ms: 300 },
          { wait: 2600 },
          { move: [1300, 600], ms: 1200 },
        ],
      },
    },
  ],
}
