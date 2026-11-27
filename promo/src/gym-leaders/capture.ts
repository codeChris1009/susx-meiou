import type { CapturePlan, Step } from "../kit/capture-plan"

/** Down one screen, smoothly (the site eases its own scroll) */
const down = (n = 1): Step[] =>
  Array.from(
    { length: n },
    () => [{ wheel: 1080, ms: 900 }, { wait: 500 }] as Step[]
  ).flat()

export const CAPTURE: CapturePlan = {
  base: "https://pokemon-gym-leaders.susx.workers.dev",
  shots: [
    // Home: the molten hero, then the nine regions running sideways
    {
      name: "hero",
      url: "/",
      clip: {
        seconds: 6,
        steps: [
          { move: [1300, 420], ms: 2500 },
          { move: [900, 560], ms: 2500 },
        ],
      },
    },
    { name: "creed", steps: [{ wheel: 1080, ms: 900 }, { wait: 1800 }] },
    {
      name: "regions",
      clip: { seconds: 10, steps: [{ wheel: 9600, ms: 9600 }] },
    },
    // Kalos, the region page
    {
      name: "kalos",
      url: "/regions/kalos",
      clip: {
        seconds: 6,
        steps: [
          { move: [1250, 480], ms: 1500 },
          ...down(1),
          { move: [900, 600], ms: 1200 },
        ],
      },
    },
    // The index of leaders: down the grid, the cards answering the pointer (the film cuts from here to a dossier)
    {
      name: "list",
      url: "/leaders",
      clip: {
        seconds: 8,
        steps: [
          { move: [500, 900], ms: 800 },
          { wheel: 700, ms: 2200 },
          { move: [1000, 700], ms: 1000 },
          { move: [1500, 640], ms: 1000 },
          { wheel: 700, ms: 2000 },
          { move: [760, 600], ms: 800 },
        ],
      },
    },
    // Korrina's dossier: her card answers the pointer, then her signature Pokémon, Mega Lucario
    {
      name: "korrina-card",
      url: "/leaders/korrina",
      clip: {
        seconds: 6,
        steps: [
          { move: [1600, 700], ms: 1300 },
          { move: [1460, 900], ms: 1300 },
          { move: [1720, 560], ms: 1300 },
          { move: [1600, 760], ms: 1000 },
        ],
      },
    },
    {
      name: "korrina-lucario",
      steps: down(3),
      clip: {
        seconds: 6,
        steps: [
          ...down(1),
          { move: [380, 640], ms: 1200 },
          { move: [700, 520], ms: 1200 },
          { wait: 600 },
        ],
      },
    },
    // Nessa, the same way: her card, then G-Max Drednaw
    {
      name: "nessa-card",
      url: "/leaders/nessa",
      clip: {
        seconds: 5,
        steps: [
          { move: [1600, 700], ms: 1200 },
          { move: [1480, 900], ms: 1200 },
          { move: [1700, 600], ms: 1200 },
        ],
      },
    },
    {
      name: "nessa-drednaw",
      steps: down(3),
      clip: {
        seconds: 6,
        steps: [
          ...down(1),
          { move: [380, 640], ms: 1200 },
          { move: [700, 520], ms: 1200 },
          { wait: 600 },
        ],
      },
    },
    // The badge vault and the tactical spectrum
    {
      name: "badges",
      url: "/badges",
      clip: {
        seconds: 6,
        steps: [
          { move: [470, 880], ms: 600 },
          { move: [1460, 880], ms: 4200 },
        ],
      },
    },
    {
      name: "spectrum",
      url: "/spectrum",
      clip: {
        seconds: 6,
        steps: [
          { move: [700, 560], ms: 1500 },
          { move: [1300, 640], ms: 2500 },
          { wait: 800 },
        ],
      },
    },
  ],
}
