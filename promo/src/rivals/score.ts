/**
 * Pokémon Rivals' score: the climb to a final boss. A low C drone and a choir, war drums at 90 bpm that double in the
 * tower, a braam and a sub drop as each rival is summoned, a riser into Versus, the hit and the choir for the name.
 */
import {
  Mix,
  beats,
  boom,
  braam,
  choir,
  drone,
  hit,
  riser,
  sub,
  taiko,
} from "../kit/synth.ts"
import { BPM, REVEAL, SECONDS, SHOT } from "./timeline.ts"

export const ROOM = { room: 0.9, wet: 1, drive: 1.35 }

export function score() {
  const mix = new Mix(SECONDS, 15)
  drone(mix, 0, SECONDS, 36, { gain: 0.22, fade: 1.5 })
  boom(mix, 0.2, 0.6)
  braam(mix, SHOT.storm[0], 36, { gain: 0.55 })
  choir(mix, SHOT.storm[0], SHOT.versus[1], [48, 51, 55, 60], {
    gain: 0.08,
    attack: 3,
  })
  beats(BPM, SHOT.storm[0], SHOT.tower[0], (s, k) =>
    taiko(mix, s, k % 4 === 0 ? 0.75 : 0.4, k % 4 === 0 ? 52 : 70)
  )
  beats(BPM * 2, SHOT.tower[0], SHOT.list[1], (s, k) =>
    taiko(mix, s, k % 4 === 0 ? 0.8 : 0.35, k % 4 === 0 ? 50 : 74)
  )
  beats(BPM, SHOT.leon[0], SHOT.versus[0], (s, k) =>
    taiko(mix, s, k % 2 ? 0.3 : 0.55, k % 2 ? 72 : 54)
  )
  ;[SHOT.tower[0], SHOT.list[0]].forEach((s, k) =>
    braam(mix, s, [39, 41][k]!, { gain: 0.42 })
  )
  Object.values(REVEAL).forEach((s, k) => {
    braam(mix, s, [36, 39, 43][k]!, { gain: 0.55 })
    sub(mix, s, 0.6)
  })
  riser(mix, SHOT.versus[0] - 2.4, SHOT.versus[0], { gain: 0.3 })
  hit(mix, SHOT.versus[0], 0.8)
  hit(mix, SHOT.name[0], 1)
  braam(mix, SHOT.name[0], 36, { gain: 0.65, length: 4 })
  choir(mix, SHOT.name[0], SECONDS, [48, 55, 60, 63], {
    gain: 0.1,
    attack: 0.3,
    release: 2,
  })
  return mix
}
