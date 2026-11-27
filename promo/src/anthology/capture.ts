import type { CapturePlan } from "../kit/capture-plan"

const ARTISANAL = "/artisanal"
/** The page's opening title and gesture hint, hidden: they would cover the globe through every clip */
const QUIET = {
  run: `for (const el of document.querySelectorAll("body *"))
    if (!el.childElementCount && /^(Explore World whispers|Drag rotate)/.test(el.textContent.trim())) el.style.visibility = "hidden"`,
} as const

/** The dark theme throughout: the film is set at night, the way the atlas reads best */
export const CAPTURE: CapturePlan = {
  // A private team project: its address lives in promo/.env.local (gitignored), never in this public source
  base: process.env.ANTHOLOGY_URL ?? "",
  scheme: "dark",
  // The Vial Globe opens turned to the time of day: started from one instant, it opens the same way every run
  time: "2026-11-27T02:58:00Z",
  shots: [
    // The home page's motion study, scrolled through: the signal, the world arriving, the island, the city
    {
      name: "home-signal",
      url: "/",
      clip: { seconds: 11, steps: [{ wait: 1200 }, { wheel: 6600, ms: 9400 }] },
    },
    {
      name: "home-island",
      clip: { seconds: 8, steps: [{ wheel: 7600, ms: 7600 }] },
    },
    // Artisanal, the Vial Globe: each interaction from a fresh load, so the globe faces the same way (see `time`).
    // The page opens with its title over the globe; the idle shot keeps it, the others set it aside (QUIET)
    {
      name: "art-idle",
      url: ARTISANAL,
      clip: {
        seconds: 5,
        steps: [
          { move: [1200, 760], ms: 1800 },
          { move: [1040, 640], ms: 2200 },
        ],
      },
    },
    // Zen mode hides the interface and leaves the globe: turned, zoomed in and out, then Esc back to the normal view
    {
      name: "art-zen",
      url: ARTISANAL,
      steps: [QUIET],
      clip: {
        seconds: 13,
        steps: [
          { wait: 400 },
          { click: "role=button[name=/zen/i]", ms: 800 },
          { wait: 900 },
          {
            drag: [
              [700, 600],
              [1220, 540],
            ],
            ms: 2200,
          },
          { wait: 300 },
          { move: [960, 540], ms: 400 },
          { wheel: -600, ms: 1500 },
          { wait: 600 },
          {
            drag: [
              [1200, 640],
              [760, 600],
            ],
            ms: 2000,
          },
          { wheel: 600, ms: 1200 },
          { wait: 400 },
          { press: "Escape" },
          { wait: 1000 },
        ],
      },
    },
    // Taiwan: its vial (the ring on the island; the island itself is too small to hit), opened and expanded
    {
      name: "art-taiwan",
      url: ARTISANAL,
      steps: [QUIET, { move: [1060, 330], ms: 400 }],
      clip: {
        seconds: 13,
        steps: [
          { wait: 500 },
          { click: [1094, 346], ms: 700 },
          { wait: 2600 },
          { click: "role=button[name=/expand/i]", ms: 900 },
          { wait: 3000 },
          { move: [1000, 700], ms: 700 },
          { wheel: 500, ms: 1500 },
          { wait: 2400 },
        ],
      },
    },
    // The other spaces, for the montage
    { name: "astra", url: "/astra", steps: [{ wait: 1500 }] },
    { name: "spindle", url: "/spindle", steps: [{ wait: 1500 }] },
    { name: "folio", url: "/folio", steps: [{ wait: 2000 }] },
    { name: "sculpture", url: "/sculpture", steps: [{ wait: 2000 }] },
  ],
}
