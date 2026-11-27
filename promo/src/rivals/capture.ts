import type { CapturePlan, Step } from "../kit/capture-plan"

/** Every page opens behind the RIVALS title card: a click sends it away */
const enter: Step[] = [{ click: [960, 540], ms: 300 }, { wait: 2500 }]
/** The Challenge button on a rival's page, held down until the silhouette gives way to the rival */
const challenge: Step = {
  drag: [
    [960, 914],
    [962, 915],
  ],
  ms: 2600,
}
/** The rail of ten chapters on a rival's page, left edge: I at 371, one every 34 px */
const chapter = (n: number): Step => ({
  click: [30, 371 + (n - 1) * 34],
  ms: 700,
})

/** Leon carries the film, then Cynthia, then Alain; the home page's storm and tower open it, Versus pits two */
export const CAPTURE: CapturePlan = {
  base: "https://pokemon-rivals.susx.workers.dev",
  shots: [
    {
      name: "title",
      url: "/",
      clip: { seconds: 4, steps: [{ move: [960, 700], ms: 3000 }] },
    },
    { name: "storm", clip: { seconds: 7, steps: [{ wheel: 2160, ms: 6600 }] } },
    { name: "age", clip: { seconds: 8, steps: [{ wheel: 4320, ms: 7600 }] } },
    {
      name: "tower",
      clip: { seconds: 16, steps: [{ wheel: 18400, ms: 15600 }] },
    },
    // The list: filtered to rivals, to the eight masters, back to all; the radar follows the floor under the pointer
    {
      name: "list",
      url: "/rivals",
      steps: enter,
      clip: {
        seconds: 9,
        steps: [
          { click: [1468, 284], ms: 900 },
          { wait: 900 },
          { click: [1674, 284], ms: 500 },
          { wait: 900 },
          { click: [1262, 284], ms: 500 },
          { wait: 700 },
          { move: [1262, 334], ms: 600 },
          { wait: 800 },
          { move: [1387, 334], ms: 400 },
          { wait: 800 },
          { move: [1512, 334], ms: 400 },
          { wait: 800 },
        ],
      },
    },
    // Leon: the challenge held, then his ace, G-Max Charizard
    {
      name: "leon",
      url: "/rivals/leon",
      steps: [{ wait: 2500 }, { move: [900, 700], ms: 300 }],
      clip: {
        seconds: 11,
        steps: [
          challenge,
          { wait: 2200 },
          { click: [640, 910], ms: 900 },
          { wait: 4600 },
        ],
      },
    },
    {
      name: "cynthia",
      url: "/rivals/cynthia",
      steps: [{ wait: 2500 }, { move: [900, 700], ms: 300 }],
      clip: {
        seconds: 9,
        steps: [challenge, { wait: 2200 }, chapter(4), { wait: 2600 }],
      },
    },
    {
      name: "alain",
      url: "/rivals/alain",
      steps: [{ wait: 2500 }, { move: [900, 700], ms: 300 }],
      clip: { seconds: 6, steps: [challenge, { wait: 2600 }] },
    },
    // Versus: Cynthia against Leon, and the fight played out, a stage a screen
    {
      name: "versus",
      url: "/versus",
      steps: [
        ...enter,
        { click: [153, 1013], ms: 300 },
        { wait: 600 },
        { click: [1852, 1013], ms: 300 },
        { wait: 900 },
      ],
      clip: {
        seconds: 14,
        steps: [
          { click: [959, 977], ms: 900 },
          { wait: 1200 },
          ...Array.from({ length: 6 }, (): Step[] => [
            { wheel: 1080, ms: 600 },
            { wait: 1300 },
          ]).flat(),
        ],
      },
    },
    {
      name: "face",
      url: "/",
      steps: [{ wait: 2000 }, { wheel: 25920, ms: 20000 }, { wait: 2200 }],
    },
  ],
}
