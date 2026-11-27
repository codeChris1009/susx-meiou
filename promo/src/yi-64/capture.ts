import type { CapturePlan, Step } from "../kit/capture-plan"

const tap = (x: number, y: number, wait = 1000, ms = 600): Step[] => [
  { click: [x, y], ms },
  { wait },
]

/**
 * The components carry the film: the eight trigrams and their tabs, the chamber, the chart of sixty-four, one hexagram
 * read through all its tabs (27, Nourishment), a reading cast, a passage observed. The landing page only passes by.
 */
export const CAPTURE: CapturePlan = {
  base: "https://codechris1009.github.io/yi-64/",
  shots: [
    {
      name: "gate",
      url: "./",
      clip: { seconds: 5, steps: [{ move: [960, 640], ms: 3000 }] },
    },
    // The eight: one trigram after another, then its tabs, then into the chamber
    {
      name: "trigrams",
      url: "trigrams?trigram=qian",
      clip: {
        seconds: 12,
        steps: [
          ...tap(246, 890),
          ...tap(228, 932),
          ...tap(348, 932),
          ...tap(886, 1036, 1000, 900),
          ...tap(972, 1036),
          ...tap(1045, 1036, 900),
          ...tap(1632, 917, 2600, 900),
        ],
      },
    },
    {
      name: "chart",
      url: "hexagrams",
      clip: {
        seconds: 7,
        steps: [
          { move: [1200, 300], ms: 2500 },
          { move: [1300, 800], ms: 2500 },
          { wait: 800 },
        ],
      },
    },
    // Hexagram 27, Nourishment: its six tabs in turn, then a neighbouring hexagram from its trigram's table
    {
      name: "nourish",
      url: "hexagrams/27-yi-nourish",
      clip: {
        seconds: 13,
        steps: [
          { wait: 400 },
          ...[776, 849, 923, 1000, 1078, 1147].flatMap((x) =>
            tap(x, 996, 1100, 600)
          ),
          ...tap(1186, 358, 2200, 900),
        ],
      },
    },
    {
      name: "oracle",
      url: "divine",
      clip: {
        seconds: 11,
        steps: [
          { click: 'input[placeholder*="所問何事"]', ms: 900 },
          { type: "該不該換工作", delay: 140 },
          { click: "text=CAST", ms: 900 },
          { wait: 6500 },
        ],
      },
    },
    {
      name: "observe",
      url: "observe",
      clip: {
        seconds: 9,
        steps: [
          { click: [960, 229], ms: 900 },
          { type: "潛龍勿用，見龍在田，利見大人", delay: 110 },
          { wait: 3400 },
        ],
      },
    },
  ],
}
