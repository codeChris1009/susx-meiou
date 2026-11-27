/**
 * Fovea's score: a quiet room. Felt-piano plucks on a slow Cmaj9, a soft pad, paper sounds where a page or a magazine
 * moves, a clock-like tick where the hand clicks, one bell for the name.
 */
import { Mix, beats, bell, pad, pluck, tick, whoosh } from "../kit/synth.ts"
import { BPM, PAPER, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.8, wet: 0.8, drive: 1 }

export function score() {
  const mix = new Mix(SECONDS, 51)
  const notes = [60, 64, 67, 71, 74, 76, 74, 71]
  beats(BPM, 0.4, SHOT.title[0], (s, k) => {
    pluck(mix, s, notes[k % notes.length]!, {
      gain: 0.09,
      decay: 1.6,
      pan: ((k % 4) - 1.5) * 0.3,
    })
    if (k % 4 === 0) pluck(mix, s, 48, { gain: 0.08, decay: 1 })
  })
  pad(mix, 0, SECONDS, [48, 55, 64, 71], {
    gain: 0.05,
    bright: 3,
    attack: 3,
    release: 3,
  })
  // A magazine lifted, turned, opened; a page leafed; a display changed
  PAPER.forEach((s, k) => {
    whoosh(mix, s, 0.5, 0.1, k % 2 ? 0.3 : -0.3)
    tick(mix, s - 0.15, 0.08, 1800)
  })
  bell(mix, SHOT.title[0], 72, { gain: 0.14, decay: 0.6 })
  bell(mix, SHOT.title[0] + 0.02, 79, { gain: 0.07, decay: 0.8 })
  return mix
}
