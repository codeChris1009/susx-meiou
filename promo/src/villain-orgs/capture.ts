import type { CapturePlan, Step } from "../kit/capture-plan"

/** A regime by the nav at the foot of the page (its aria-label is the chapter number); its cards take time to arrive */
const regime = (n: string): Step[] => [
  { wait: 800 },
  { click: `button[aria-label="${n}"]`, ms: 700 },
  { wait: 3200 },
]

/**
 * Rocket, Plasma and Aether / Skull carry the film; the rest pass in the chapter switch. Each regime's panel: its
 * leader's cards along the left (or the two faces of a split regime), the Organization / Leader radar at the top
 * right, ten dimensions down the right, Expand context on the left. An open dimension covers the nav, so each regime
 * starts from a fresh load.
 */
export const CAPTURE: CapturePlan = {
  base: "https://codechris1009.github.io/pokemon-anti-org/",
  shots: [
    { name: "intro", url: "./", steps: [{ wait: 2000 }] },
    {
      name: "switch",
      clip: {
        seconds: 7,
        steps: ["02", "03", "05", "07", "08"].flatMap((n): Step[] => [
          { click: `button[aria-label="${n}"]`, ms: 500 },
          { wait: 700 },
        ]),
      },
    },
    {
      name: "rocket",
      url: "./",
      steps: regime("01"),
      clip: {
        seconds: 12,
        steps: [
          { click: [147, 793], ms: 900 },
          { wait: 800 },
          { click: [271, 793], ms: 500 },
          { wait: 800 },
          { click: [458, 793], ms: 500 },
          { wait: 800 },
          { click: [1681, 202], ms: 1000 },
          { wait: 1200 },
          { click: [1699, 816], ms: 900 },
          { wait: 2000 },
          { press: "Escape" },
          { wait: 400 },
          { click: [120, 612], ms: 1000 },
          { wait: 1500 },
        ],
      },
    },
    {
      name: "plasma",
      url: "./",
      steps: regime("04"),
      clip: {
        seconds: 10,
        steps: [
          { click: [310, 534], ms: 900 },
          { wait: 1500 },
          { click: [131, 534], ms: 500 },
          { wait: 1000 },
          { click: [1699, 941], ms: 1100 },
          { wait: 2000 },
          { press: "Escape" },
          { wait: 400 },
          { click: [120, 684], ms: 1000 },
          { wait: 1400 },
        ],
      },
    },
    {
      name: "aether-skull",
      url: "./",
      steps: regime("06"),
      clip: {
        seconds: 11,
        steps: [
          { click: [310, 470], ms: 900 },
          { wait: 1500 },
          { click: [131, 470], ms: 500 },
          { wait: 1000 },
          { click: [147, 800], ms: 700 },
          { wait: 800 },
          { click: [1699, 916], ms: 1000 },
          { wait: 2000 },
          { press: "Escape" },
          { wait: 400 },
          { click: [120, 620], ms: 1000 },
          { wait: 1400 },
        ],
      },
    },
    {
      name: "verdict",
      url: "./",
      steps: [
        { wait: 800 },
        { click: 'button[aria-label="Outro"]', ms: 600 },
        { wait: 3000 },
      ],
    },
  ],
}
