import type { CapturePlan, Step } from "../kit/capture-plan"

/** A chapter by the nav at the foot of the page (its aria-label is the chapter number) */
const chapter = (n: string): Step => ({
  click: `button[aria-label="${n}"]`,
  ms: 700,
})

/**
 * Serena and Lillie carry the film; the other four pass in the chapter switch. Each heroine's panel: her cards along
 * the left, the Bond / Heroine radar at the top right, ten dimensions down the right, Expand context on the left.
 */
export const CAPTURE: CapturePlan = {
  base: "https://codechris1009.github.io/pokemon-girl-friends/",
  shots: [
    { name: "intro", url: "./", steps: [{ wait: 1500 }] },
    {
      name: "switch",
      clip: {
        seconds: 7,
        steps: ["01", "02", "03", "04"].flatMap((n): Step[] => [
          chapter(n),
          { wait: 950 },
        ]),
      },
    },
    {
      name: "serena",
      steps: [chapter("05"), { wait: 2600 }],
      clip: {
        seconds: 13,
        steps: [
          { click: [131, 903], ms: 900 },
          { wait: 900 },
          { click: [193, 903], ms: 500 },
          { wait: 900 },
          { click: [1639, 202], ms: 1000 },
          { wait: 1200 },
          { click: [1562, 202], ms: 500 },
          { wait: 700 },
          { click: [1699, 816], ms: 900 },
          { wait: 2000 },
          { press: "Escape" },
          { wait: 500 },
          { click: [128, 740], ms: 1000 },
          { wait: 1800 },
        ],
      },
    },
    {
      name: "lillie",
      url: "./",
      steps: [{ wait: 800 }, chapter("06"), { wait: 2600 }],
      clip: {
        seconds: 11,
        steps: [
          { click: [131, 903], ms: 900 },
          { wait: 700 },
          { click: [255, 903], ms: 500 },
          { wait: 700 },
          { click: [318, 903], ms: 400 },
          { wait: 700 },
          { click: [1699, 866], ms: 1100 },
          { wait: 2000 },
          { press: "Escape" },
          { wait: 500 },
          { click: [128, 740], ms: 1000 },
          { wait: 1600 },
        ],
      },
    },
    {
      name: "promise",
      url: "./",
      steps: [
        { wait: 800 },
        { click: 'button[aria-label="Outro"]', ms: 600 },
        { wait: 2600 },
      ],
    },
  ],
}
