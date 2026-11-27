/**
 * YI 64's score: a temple at night with a machine in it. An A drone, a singing bowl for each line of the hexagram, a
 * sparse pentatonic pluck, a dry tick wherever the hand presses, a low boom when the reading is cast.
 */
import { Mix, boom, bowl, drone, glitch, pluck, tick } from "../kit/synth.ts"
import { HEXAGRAM, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.9, wet: 1, drive: 1 }

export function score() {
  const mix = new Mix(SECONDS, 384)
  drone(mix, 0, SECONDS, 33, { gain: 0.18, fade: 2 })
  HEXAGRAM.forEach((yang, k) =>
    bowl(mix, 0.3 + k * 0.32, yang ? 57 : 64, {
      gain: 0.09,
      length: 5,
      pan: k % 2 ? 0.3 : -0.3,
    })
  )
  const penta = [69, 72, 74, 76, 79, 81]
  for (let s = SHOT.gate[0] + 0.4, k = 0; s < SHOT.title[0]; s += 1.1, k++)
    pluck(mix, s, penta[(k * 4) % penta.length]!, {
      gain: 0.06,
      decay: 1.4,
      pan: (k % 3) * 0.3 - 0.3,
    })
  ;[
    SHOT.gate[0],
    SHOT.trigrams[0],
    SHOT.chart[0],
    SHOT.nourish[0],
    SHOT.oracle[0],
    SHOT.observe[0],
  ].forEach((s) => glitch(mix, s - 0.1, 0.12, 0.06))
  for (let s = SHOT.trigrams[0] + 0.5; s < SHOT.trigrams[1]; s += 1.3)
    tick(mix, s, 0.08, 3000)
  for (let s = SHOT.nourish[0] + 0.6; s < SHOT.nourish[0] + 6; s += 0.85)
    tick(mix, s, 0.08, 3400)
  boom(mix, SHOT.oracle[0] + 1.8, 0.5)
  bowl(mix, SHOT.title[0], 57, { gain: 0.18, length: 6 })
  bowl(mix, SHOT.title[0] + 0.03, 64, { gain: 0.1, length: 6 })
  return mix
}
