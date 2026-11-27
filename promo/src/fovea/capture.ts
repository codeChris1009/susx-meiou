import type { CapturePlan } from "../kit/capture-plan"

const RADIO = "button[role=radio]"
const ANTHROPIC = 'button[aria-label^="拿起 Anthropic"]'

/** Anthropic carries the film: picked off the rack, turned over, opened, then its company page and its prospectus */
export const CAPTURE: CapturePlan = {
  base: "https://fovea.susx.workers.dev",
  shots: [
    // The rack, then its three displays (the display chosen is remembered, so the rack is put back first)
    {
      name: "rack",
      url: "/",
      steps: [{ click: `${RADIO} >> nth=0`, ms: 300 }, { wait: 1500 }],
      clip: {
        seconds: 6,
        steps: [
          { move: [500, 560], ms: 1600 },
          { move: [705, 470], ms: 1800 },
          { wait: 1500 },
        ],
      },
    },
    {
      name: "displays",
      clip: {
        seconds: 8,
        steps: [
          { click: `${RADIO} >> nth=1`, ms: 900 },
          { wait: 2800 },
          { click: `${RADIO} >> nth=2`, ms: 800 },
          { wait: 2800 },
        ],
      },
    },
    // Anthropic, held: turned over, turned back, opened and leafed
    {
      name: "anthropic",
      url: "/",
      steps: [{ click: `${RADIO} >> nth=0`, ms: 300 }, { wait: 1800 }],
      clip: {
        seconds: 12,
        steps: [
          { click: ANTHROPIC, ms: 1000 },
          { wait: 2200 },
          { click: "text=翻面 Flip", ms: 800 },
          { wait: 1800 },
          { click: "text=翻面 Flip", ms: 300 },
          { wait: 1200 },
          { click: "text=翻開 Open", ms: 700 },
          { wait: 2000 },
          { press: "ArrowRight" },
          { wait: 1600 },
        ],
      },
    },
    {
      name: "open",
      url: "/",
      steps: [
        { click: `${RADIO} >> nth=0`, ms: 300 },
        { wait: 1800 },
        { click: ANTHROPIC, ms: 600 },
        { wait: 2600 },
      ],
      clip: {
        seconds: 8,
        steps: [
          { click: "text=翻開 Open", ms: 900 },
          { wait: 2600 },
          { press: "ArrowRight" },
          { wait: 2200 },
        ],
      },
    },
    // Its company page: three documents beside the cover, the prospectus opened
    {
      name: "company",
      url: "/anthropic/",
      clip: {
        seconds: 7,
        steps: [
          { move: "a[href='/anthropic/founders-letter/']", ms: 1000 },
          { wait: 700 },
          { move: "a[href='/anthropic/founders-letter/brief/']", ms: 700 },
          { wait: 700 },
          { move: "a[href='/anthropic/prospectus/']", ms: 700 },
          { wait: 500 },
          { click: "a[href='/anthropic/prospectus/']", ms: 300 },
          { wait: 2000 },
        ],
      },
    },
    // The prospectus, read by its contents: key facts, bull and bear, a section
    {
      name: "prospectus",
      url: "/anthropic/prospectus/",
      clip: {
        seconds: 9,
        steps: [
          { wait: 600 },
          { click: "a[href='#facts']", ms: 800 },
          { wait: 1800 },
          { click: "a[href='#bullbear']", ms: 700 },
          { wait: 2000 },
          { click: "a[href='#sec-2']", ms: 700 },
          { wait: 2000 },
        ],
      },
    },
    // Dark mode, then down the front page's lists of longform and news
    {
      name: "dark",
      url: "/",
      clip: {
        seconds: 8,
        steps: [
          { click: "button[aria-label='切換深淺色']", ms: 1000 },
          { wait: 1500 },
          { wheel: 1080, ms: 1600 },
          { wait: 800 },
          { wheel: 1080, ms: 1600 },
          { wait: 1000 },
        ],
      },
    },
  ],
}
