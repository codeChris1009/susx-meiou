/**
 * Pokémon Anti Org's score: an interrogation room. A ticking clock, an A minor ostinato at 100 bpm, a sub drop as each
 * file opens, a glitch wherever the hand presses, a riser into the verdict, a stamp-like hit for the name.
 */
import {
  Mix,
  beats,
  braam,
  drone,
  glitch,
  hit,
  kick,
  pulse,
  riser,
  sub,
  tick,
} from "../kit/synth.ts"
import { BPM, PRESS, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.7, wet: 0.6, drive: 1.3 }

export function score() {
  const mix = new Mix(SECONDS, 9)
  drone(mix, 0, SECONDS, 33, { gain: 0.16, fade: 1.2, fifth: false })
  beats(BPM, 0, SHOT.title[0], (s, k) =>
    tick(mix, s, k % 2 ? 0.06 : 0.1, k % 2 ? 2000 : 2600)
  )
  for (let s = 0.2; s < 2.4; s += 0.06) tick(mix, s, 0.03, 3600)
  pulse(mix, SHOT.intro[0], SHOT.verdict[0], BPM, [45, 45, 41, 43], {
    gain: 0.14,
    bright: 800,
  })
  beats(BPM, SHOT.switch[0], SHOT.verdict[0], (s) => kick(mix, s, 0.4), 2)
  braam(mix, SHOT.intro[0], 33, { gain: 0.4 })
  ;[SHOT.rocket[0], SHOT.plasma[0], SHOT.aether[0]].forEach((s) => {
    sub(mix, s, 0.55)
    glitch(mix, s - 0.08, 0.22, 0.14)
  })
  PRESS.forEach((s) => glitch(mix, s, 0.08, 0.07))
  riser(mix, SHOT.verdict[0] - 2, SHOT.verdict[0], { gain: 0.25 })
  hit(mix, SHOT.title[0], 1)
  glitch(mix, SHOT.title[0] + 0.85, 0.3, 0.1)
  return mix
}
