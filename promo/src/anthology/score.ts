/**
 * Anthology's score: a cold, wide room. A low D drone and sonar pings for the signal; a minor-ninth pad and a soft
 * pulse once the globe is in hand; clicks where the interface is touched; air on the montage's cuts; one hit for the
 * name and a long bell into the quiet.
 */
import {
  Mix,
  beats,
  bell,
  boom,
  drone,
  hat,
  hit,
  pad,
  ping,
  pluck,
  pulse,
  riser,
  tick,
  whoosh,
} from "../kit/synth.ts"
import { CUE, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.88, wet: 1 }

export function score() {
  const mix = new Mix(SECONDS, 2611)
  drone(mix, 0, SHOT.title[0] + 0.2, 38, { gain: 0.2, fade: 3 })
  CUE.ping.forEach((s, k) =>
    ping(mix, s, k % 2 ? 81 : 86, { gain: 0.12, pan: k % 2 ? 0.5 : -0.5 })
  )
  pad(mix, SHOT.chapter[0], SHOT.spaces[1], [50, 57, 62, 65, 69, 76], {
    gain: 0.09,
    bright: 5,
    attack: 2.5,
    release: 2,
  })
  CUE.boom.forEach((s) => boom(mix, s, 0.55))
  // The pulse under the globe: a muted bass in eighths, a hat on the off-beat
  pulse(mix, SHOT.idle[0], SHOT.spaces[1], 96, [38, 38, 34, 36], {
    gain: 0.1,
    bright: 700,
  })
  beats(96, SHOT.zen[0], SHOT.spaces[1], (s) =>
    hat(mix, s + 60 / 96 / 2, 0.05, false, 0.3)
  )
  // A glass arpeggio over the dossier, rising
  ;[74, 77, 81, 84, 86, 89].forEach((m, k) =>
    pluck(mix, SHOT.expand[0] + 0.4 + k * 0.42, m, {
      gain: 0.07,
      pan: (k % 3) * 0.4 - 0.4,
    })
  )
  CUE.tick.forEach((s) => tick(mix, s, 0.12, 2800))
  CUE.whoosh.forEach((s, k) => {
    whoosh(mix, s - 0.25, 0.6, 0.16, k % 2 ? 0.4 : -0.4)
    bell(mix, s, [74, 77, 79, 81][k]!, { gain: 0.06 })
  })
  riser(mix, CUE.riser[0], CUE.riser[1], { gain: 0.22 })
  hit(mix, CUE.hit, 0.9)
  drone(mix, CUE.hit, SECONDS, 38, { gain: 0.16, fade: 0.4 })
  bell(mix, CUE.hit + 0.6, 74, { gain: 0.12, decay: 0.5 })
  ping(mix, CUE.hit + 2.2, 86, { gain: 0.08 })
  return mix
}
