/**
 * Pokémon Heroines' score: a music box over a warm F major pad, a glass note where a card turns, a soft choir for
 * the promise, a chord of bells for the name.
 */
import { Mix, beats, bell, choir, pad, pluck, whoosh } from "../kit/synth.ts"
import { BPM, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.9, wet: 1.1, drive: 1 }

export function score() {
  const mix = new Mix(SECONDS, 6)
  const box = [77, 81, 84, 81, 79, 76, 77, 72]
  beats(BPM, 0.3, SHOT.promise[0], (s, k) =>
    bell(mix, s, box[k % box.length]!, {
      gain: 0.05,
      decay: 1.6,
      pan: k % 2 ? 0.3 : -0.3,
    })
  )
  pad(mix, 0, SECONDS, [53, 60, 65, 69], {
    gain: 0.07,
    bright: 3,
    attack: 3,
    release: 3,
  })
  ;[SHOT.switch[0], SHOT.serena[0], SHOT.lillie[0], SHOT.promise[0]].forEach(
    (s, k) => {
      whoosh(mix, s - 0.3, 0.7, 0.07)
      pluck(mix, s, [65, 74, 78, 72][k]!, { gain: 0.1, decay: 1.2 })
    }
  )
  // Cards turning and chapters changing: small glass notes
  ;[5.4, 6.4, 7.3, 8.3, 10.8, 11.6, 12.6, 21.0, 21.7, 22.3, 23.6].forEach(
    (s, k) =>
      pluck(mix, s, 81 + (k % 4) * 3, {
        gain: 0.05,
        decay: 2,
        pan: (k % 3) * 0.4 - 0.4,
      })
  )
  choir(mix, SHOT.promise[0], SHOT.title[1], [65, 69, 72], {
    gain: 0.08,
    attack: 2,
  })
  ;[65, 69, 72, 77, 81].forEach((m, k) =>
    bell(mix, SHOT.title[0] + k * 0.09, m, { gain: 0.08, pan: k * 0.2 - 0.4 })
  )
  return mix
}
