/**
 * Gym Leaders' score: a stadium at 120 bpm. Kick on every beat, snare on two and four, hats in eighths, an E minor
 * bass; a braam on every big cut, a riser into the name, the hit.
 */
import {
  Mix,
  beats,
  braam,
  hat,
  hit,
  kick,
  pad,
  pulse,
  riser,
  snare,
  sub,
  taiko,
  whoosh,
} from "../kit/synth.ts"
import { BPM, BRAAM, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.78, wet: 0.7, drive: 1.3 }

export function score() {
  const mix = new Mix(SECONDS, 64)
  const beat = 60 / BPM
  ;[0.1, 0.6, 1.1].forEach((s, k) => taiko(mix, s, 0.8, 58 - k * 4))
  sub(mix, SHOT.hero[0], 0.7)
  pad(mix, SHOT.hero[0], SHOT.title[0], [52, 55, 59, 64], {
    gain: 0.06,
    bright: 9,
  })
  beats(BPM, SHOT.hero[0], SHOT.title[0] - beat, (s) => kick(mix, s, 0.75))
  beats(
    BPM,
    SHOT.hero[0] + beat,
    SHOT.title[0] - beat,
    (s) => snare(mix, s, 0.3),
    2
  )
  beats(BPM * 2, SHOT.hero[0], SHOT.title[0] - beat, (s, k) =>
    hat(mix, s, k % 2 ? 0.08 : 0.05, k % 4 === 3)
  )
  pulse(mix, SHOT.hero[0], SHOT.title[0] - beat, BPM, [40, 40, 36, 38], {
    gain: 0.15,
    bright: 1100,
  })
  BRAAM.forEach((s, k) => {
    braam(mix, s, [40, 43, 45, 43, 47][k]!, { gain: 0.42 })
    whoosh(mix, s - 0.35, 0.5, 0.18)
  })
  riser(mix, SHOT.title[0] - 2, SHOT.title[0], { gain: 0.28 })
  hit(mix, SHOT.title[0], 1)
  braam(mix, SHOT.title[0], 40, { gain: 0.6, length: 3 })
  return mix
}
