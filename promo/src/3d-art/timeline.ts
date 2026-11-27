/**
 * The 3D Art Gallery trailer's beat sheet: one source of time for the picture (Trailer.tsx) and the score
 * (scripts/score.ts), so cuts and hits can never drift apart. Times are in seconds; frames are derived.
 */
export const FPS = 30
export const SECONDS = 31
export const WIDTH = 1920
export const HEIGHT = 1080

/** Seconds to a frame number */
export const f = (s: number) => Math.round(s * FPS)

/** The shots, [start, end) in seconds */
export const SHOT = {
  /** Black: an ember rises, gold construction lines draw themselves, IN TENEBRIS LUX */
  open: [0, 4],
  /** A spotlight snaps on one painting; dust in the beam; a slow push in */
  reveal: [4, 9],
  /** The camera rises and pulls back: the ring of eight, turning one step */
  room: [9, 15],
  /** Montage, one feature a shot, a braam on every cut */
  light: [15, 17],
  mirror: [17, 19],
  turn: [19, 21],
  script: [21, 23],
  /** The ring spins up, the sparks thicken, then black */
  rise: [23, 25.6],
  black: [25.6, 26],
  /** The name, written in script, and a firework */
  title: [26, 31],
} as const satisfies Record<string, readonly [number, number]>

export type ShotName = keyof typeof SHOT

/** The spotlight snaps on this far into the reveal */
export const SPOT_ON = 4.45
/** The ring's turns: when each starts, and by how many steps (negative brings the next painting round) */
export const TURNS = [
  { at: 11.2, steps: -1 },
  { at: 19.35, steps: -1 },
  { at: 20.15, steps: -1 },
] as const
/** Seconds a single step takes, as the gallery's own arrows (Cubic.Out) */
export const TURN_SECONDS = 1.1

/** Sound cues. The score is built from these; the picture cuts and flashes on the same numbers */
export const CUE = {
  /** Deep, slow booms */
  boom: [0.25, 9, 26.05],
  /** The spotlight's strike */
  impact: [SPOT_ON],
  /** Brass-like stabs on the montage cuts */
  braam: [15, 17, 19, 21],
  /** The cut to black */
  hit: [25.6],
  /** A heartbeat under the room, beats per minute */
  heart: { from: 9.4, to: 15, bpm: 64 },
  /** The climb into the cut */
  riser: { from: 22.6, to: 25.6 },
} as const

/** Harmony for the pad: a minor key with a Phrygian turn, dark and old. MIDI notes */
export const CHORDS = [
  { at: 4.45, notes: [50, 53, 57] }, // D minor
  { at: 9, notes: [46, 50, 53] }, // B♭
  { at: 15, notes: [43, 46, 50] }, // G minor
  { at: 19, notes: [45, 49, 52] }, // A major, the dominant
  { at: 26.05, notes: [38, 50, 53, 57, 64] }, // D minor, open, with the ninth
] as const

/** The gallery's six paintings (const.js) in hanging order around the ring; index 0 faces the camera first */
export const HANG = [
  {
    file: "The-Holy-Family-at-Night.jpg",
    title: "The Holy Family at Night",
    artist: "workshop of Rembrandt van Rijn",
    year: 1642,
  },
  {
    file: "Venus-and-Adonis.jpg",
    title: "Venus and Adonis",
    artist: "Ferdinand Bol",
    year: 1658,
  },
  {
    file: "Forest-Landscape-in-the-Moonlight.jpg",
    title: "Forest Landscape in the Moonlight",
    artist: "Georg Eduard Otto Saal",
    year: 1861,
  },
  {
    file: "Young-Italian-Woman-with-Puck-the-Dog.jpg",
    title: "Young Italian Woman with Puck the Dog",
    artist: "Thérèse Schwartze",
    year: 1885,
  },
  {
    file: "Seascape-from-the-Zeeland-Waters-near-the-Island-of-Schouwen.jpg",
    title: "Seascape Zeeland Waters Island Schouwen",
    artist: "Petrus Johannes Schotel",
    year: 1825,
  },
  {
    file: "Shepherdess-with-a-Flock-of-Sheep.jpg",
    title: "Shepherdess with a Flock of Sheep",
    artist: "Anton Mauve",
    year: 1870,
  },
] as const
