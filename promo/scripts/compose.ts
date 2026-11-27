/**
 * Writes a film's score: its score.ts places instruments (src/kit/synth.ts) on its beat sheet, this mixes and saves it.
 *
 *   node scripts/compose.ts anthology   → public/anthology/score.wav (48 kHz, 16-bit, stereo)
 *
 * The 3D Art Gallery's score predates the kit and has its own script (scripts/score.ts).
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import type { Mix } from "../src/kit/synth.ts"

const id = process.argv[2]
if (!id) throw new Error("Which film? node scripts/compose.ts <id>")
const { score, ROOM } = (await import(
  join(import.meta.dirname, "..", "src", id, "score.ts")
)) as {
  score: () => Mix
  ROOM?: Parameters<Mix["wav"]>[0]
}
const mix = score()
const { wav, peak } = mix.wav(ROOM)
const out = join(import.meta.dirname, "..", "public", id, "score.wav")
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, wav)
console.log(
  `${out}: ${mix.seconds}s, peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS before normalising`
)
