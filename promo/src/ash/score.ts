/**
 * Pokémon Ash's score: an adventure in D major. A held string pad, a pulse from the first hat, a bright pluck on every
 * hat Pikachu puts on, drums like timpani on the big moments, a choir over Galar, the hit and a bright chord for I
 * CHOOSE YOU.
 */
import {
  Mix,
  beats,
  bell,
  braam,
  choir,
  hat,
  hit,
  kick,
  pad,
  pluck,
  pulse,
  riser,
  taiko,
} from "../kit/synth.ts"
import { BPM, HAT_CLICKS, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.86, wet: 0.9, drive: 1.2 }

export function score() {
  const mix = new Mix(SECONDS, 1997)
  bell(mix, 0.2, 74, { gain: 0.1 })
  pad(mix, 0, SHOT.title[0], [50, 57, 62, 66], {
    gain: 0.08,
    bright: 6,
    attack: 2,
  })
  pulse(mix, SHOT.hats[0], SHOT.title[0], BPM, [38, 43, 45, 42], {
    gain: 0.12,
    bright: 1000,
  })
  beats(BPM, SHOT.aces[0], SHOT.title[0], (s) => kick(mix, s, 0.5))
  beats(BPM * 2, SHOT.timeline[0], SHOT.title[0], (s, k) =>
    hat(mix, s, k % 2 ? 0.06 : 0.04)
  )
  HAT_CLICKS.forEach((s, k) =>
    pluck(mix, s, [62, 64, 66, 69, 71, 74, 76, 78][k]!, {
      gain: 0.1,
      pan: k % 2 ? 0.4 : -0.4,
    })
  )
  ;[SHOT.aces[0], SHOT.galar[0], SHOT.friends[0], SHOT.cards[0]].forEach(
    (s, k) => {
      taiko(mix, s, 0.7, 60)
      braam(mix, s, [38, 43, 45, 43][k]!, { gain: 0.3 })
    }
  )
  choir(mix, SHOT.galar[0] + 4, SHOT.friends[1], [62, 66, 69], { gain: 0.07 })
  riser(mix, SHOT.title[0] - 2.2, SHOT.title[0], { gain: 0.25 })
  hit(mix, SHOT.title[0], 0.95)
  pad(mix, SHOT.title[0], SECONDS, [50, 54, 57, 62, 66, 69], {
    gain: 0.11,
    bright: 8,
    attack: 0.4,
    release: 1.5,
  })
  ;[74, 78, 81, 86].forEach((m, k) =>
    bell(mix, SHOT.title[0] + 0.2 + k * 0.12, m, {
      gain: 0.08,
      pan: k * 0.25 - 0.4,
    })
  )
  return mix
}
