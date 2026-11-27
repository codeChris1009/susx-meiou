/**
 * Synthesises a trailer's score from its beat sheet: no samples, no external audio, the same bytes every run.
 *
 *   node scripts/score.ts 3d-art   → public/3d-art/score.wav (48 kHz, 16-bit, stereo)
 *
 * Every sound is built from sines and seeded noise: a drone and a string-like pad for the harmony, booms and a lamp's
 * strike, brass-like stabs (braams) on the cuts, a heartbeat, a riser into the cut to black, and a shower of high pings
 * for the title's sparks. A Schroeder reverb (four combs, two all-passes) gives them a stone room.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { CHORDS, CUE, SECONDS, SHOT, SPOT_ON } from "../src/3d-art/timeline.ts"
import { generator } from "../src/kit/random.ts"

const SR = 48000
const N = SR * SECONDS
const TAU = Math.PI * 2

const dry = [new Float32Array(N), new Float32Array(N)] as const
const wet = [new Float32Array(N), new Float32Array(N)] as const
const noise = generator(1642)

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
const at = (s: number) => Math.round(s * SR)

/** Adds a mono voice into both buses, panned (-1..1), with a reverb send */
function put(
  start: number,
  length: number,
  voice: (i: number, t: number) => number,
  { gain = 1, pan = 0, send = 0.3 } = {}
) {
  const from = at(start)
  const l = Math.cos(((pan + 1) * Math.PI) / 4) * gain
  const r = Math.sin(((pan + 1) * Math.PI) / 4) * gain
  for (let i = 0; i < length * SR && from + i < N; i++) {
    if (from + i < 0) continue
    const v = voice(i, i / SR)
    dry[0][from + i]! += v * l
    dry[1][from + i]! += v * r
    wet[0][from + i]! += v * l * send
    wet[1][from + i]! += v * r * send
  }
}

/** A sine whose frequency glides exponentially from a to b over `glide` seconds */
function sweep(a: number, b: number, glide: number) {
  let phase = 0
  return (t: number) => {
    const f = a * (b / a) ** Math.min(1, t / glide)
    phase += (TAU * f) / SR
    return Math.sin(phase)
  }
}

/** A one-pole low-pass, for noise */
function lowpass() {
  let y = 0
  return (x: number, cutoff: number) => {
    const k = 1 - Math.exp((-TAU * cutoff) / SR)
    y += k * (x - y)
    return y
  }
}

/** Additive sawtooth with a soft top: harmonics fall as 1/h^tilt */
function saw(f: number, t: number, harmonics: number, tilt = 1, detune = 0) {
  let v = 0
  for (let h = 1; h <= harmonics; h++)
    v += Math.sin(TAU * f * h * t + detune * h) / h ** tilt
  return v
}

// ---- Drone: D in three octaves, slowly beating, under everything up to the cut ----
const cut = CUE.hit[0]
put(
  0,
  cut + 0.01,
  (_, t) => {
    const env =
      Math.min(1, t / 3) *
      (0.55 + 0.45 * Math.min(1, t / cut) ** 2) *
      (t > cut - 0.01 ? 0 : 1)
    const breathe = 0.8 + 0.2 * Math.sin(TAU * 0.11 * t)
    return (
      env *
      breathe *
      (saw(36.71, t, 10, 1.3) * 0.5 +
        saw(36.86, t, 10, 1.3) * 0.5 +
        saw(55, t, 6, 1.5) * 0.35 +
        saw(73.42, t, 6, 1.6) * 0.25)
    )
  },
  { gain: 0.07, send: 0.15 }
)

// ---- Pad: string-like chords, three detuned voices a note, slow attack ----
CHORDS.forEach((chord, k) => {
  const next = CHORDS[k + 1]
  // A chord either crossfades into the next, stops dead at the cut to black, or (the last) dies away with the film
  const atCut = chord.at < cut && (next?.at ?? SECONDS) > cut
  const hold = (atCut ? cut : (next?.at ?? SECONDS)) - chord.at
  const tail = next && !atCut ? 0.9 : 0
  const fade = (t: number) =>
    !next
      ? Math.min(1, Math.max(0, (hold - 0.3 - t) / 2.2))
      : atCut
        ? Math.min(1, Math.max(0, (hold - t) / 0.01))
        : Math.min(1, Math.max(0, (hold + tail - t) / 0.9))
  chord.notes.forEach((midi, n) => {
    const f = hz(midi)
    for (const [d, pan] of [
      [-0.004, -0.6],
      [0, 0],
      [0.004, 0.6],
    ] as const) {
      put(
        chord.at,
        hold + tail,
        (_, t) => {
          const vib = 1 + 0.0025 * Math.sin(TAU * 4.8 * t + n)
          return (
            Math.min(1, t / 1.4) * fade(t) * saw(f * (1 + d) * vib, t, 7, 1.6)
          )
        },
        { gain: 0.018, pan: pan * 0.8, send: 0.6 }
      )
    }
  })
})

// ---- Booms: a deep falling sine with a breath of noise ----
function boom(start: number, gain = 0.9) {
  const tone = sweep(72, 30, 2.4)
  const lp = lowpass()
  put(
    start,
    4.5,
    (_, t) =>
      tone(t) * Math.exp(-t * 1.1) +
      lp(noise() * 2 - 1, 400) * Math.exp(-t * 6) * 0.6,
    { gain, send: 0.35 }
  )
}
CUE.boom.forEach((s) => boom(s))

// ---- The lamp's strike: a click, a low thud and a bell-like ring of inharmonic partials ----
put(
  SPOT_ON,
  3.5,
  (_, t) => {
    const click = (noise() * 2 - 1) * Math.exp(-t * 60)
    const thud = Math.sin(TAU * 52 * t) * Math.exp(-t * 4)
    let ring = 0
    for (const [ratio, decay] of [
      [1, 1.6],
      [2.76, 2.4],
      [5.4, 3.5],
      [8.93, 5],
    ] as const)
      ring += (Math.sin(TAU * 196 * ratio * t) * Math.exp(-t * decay)) / ratio
    return click * 0.5 + thud * 0.8 + ring * 0.35
  },
  { gain: 0.7, send: 0.55 }
)

// ---- Braams: low brass-like stabs, the chord of the moment, high harmonics dying first ----
CUE.braam.forEach((s, k) => {
  const root = k < 2 ? 43 : 45 // G2 for the first two cuts, A2 for the dominant
  for (const [interval, pan] of [
    [0, 0],
    [7, -0.35],
    [12, 0.35],
    [-12, 0],
  ] as const) {
    const f = hz(root + interval)
    put(
      s,
      2.4,
      (_, t) => {
        let v = 0
        for (let h = 1; h <= 22; h++)
          v += (Math.sin(TAU * f * h * t) / h) * Math.exp(-t * (0.4 + h * 0.28))
        const env = Math.min(1, t / 0.025) * Math.exp(-t * 1.25)
        return Math.tanh(v * 2.2) * env
      },
      { gain: 0.16, pan, send: 0.45 }
    )
  }
  boom(s, 0.45)
})

// ---- Heartbeat under the room ----
const { from: hFrom, to: hTo, bpm } = CUE.heart
for (let s = hFrom; s < hTo; s += 60 / bpm) {
  for (const [offset, f, g] of [
    [0, 56, 1],
    [0.27, 48, 0.65],
  ] as const)
    put(
      s + offset,
      0.4,
      (_, t) =>
        Math.sin(TAU * f * t) * Math.min(1, t / 0.008) * Math.exp(-t * 16) * g,
      { gain: 0.5, send: 0.1 }
    )
}

// ---- Riser into the cut: noise opening up, a gliding tone, a tremolo quickening ----
{
  const { from, to } = CUE.riser
  const length = to - from
  const lp = lowpass()
  const glide = sweep(110, 880, length)
  put(
    from,
    length,
    (_, t) => {
      const p = t / length
      const air = lp(noise() * 2 - 1, 200 * 45 ** p)
      const trem = 0.65 + 0.35 * Math.sin(TAU * (4 + 20 * p * p) * t)
      return (air * 0.9 + glide(t) * 0.25) * p ** 2.2 * trem
    },
    { gain: 0.55, send: 0.3 }
  )
}

// ---- The cut to black: one great hit, then only its tail ----
{
  const tone = sweep(60, 26, 3)
  const lp = lowpass()
  put(
    cut,
    5,
    (_, t) =>
      tone(t) * Math.exp(-t * 0.8) * 1.1 +
      lp(noise() * 2 - 1, 2400) * Math.exp(-t * 3.5) * 0.7,
    { gain: 0.9, send: 0.5 }
  )
}

// ---- The title's sparks: high glassy pings, scattered across the stereo field ----
{
  const rnd = generator(26)
  const burst = SHOT.title[0] + 1.05
  for (let k = 0; k < 70; k++) {
    const start = burst + rnd() ** 2 * 2.6
    const f = 1800 + rnd() * 4200
    const pan = rnd() * 2 - 1
    const decay = 6 + rnd() * 10
    put(start, 1, (_, t) => Math.sin(TAU * f * t) * Math.exp(-t * decay), {
      gain: 0.035 * (1 - (start - burst) / 3),
      pan,
      send: 0.7,
    })
  }
  // and a high shimmer holding the last chord
  put(
    burst,
    SECONDS - burst,
    (_, t) => {
      const env =
        Math.min(1, t / 1.5) *
        Math.min(1, Math.max(0, (SECONDS - 0.4 - burst - t) / 2))
      return (
        env *
        (Math.sin(TAU * hz(81) * t) +
          0.6 * Math.sin(TAU * hz(86) * t + Math.sin(TAU * 5 * t) * 0.3))
      )
    },
    { gain: 0.012, send: 0.8 }
  )
}

// ---- A thin high tone through the cold open, the ember rising ----
put(
  0.3,
  3.7,
  (_, t) =>
    Math.sin(TAU * 1760 * t) *
    Math.min(1, t / 2) *
    Math.min(1, (3.7 - t) / 0.6),
  { gain: 0.008, send: 0.8 }
)

// ---- Reverb: Schroeder, per channel, the right a little longer so the room is wide ----
function reverb(input: Float32Array, spread: number) {
  const out = new Float32Array(N)
  const combs = [1557, 1617, 1491, 1422].map((d) => ({
    buf: new Float32Array(Math.round((d + spread) * (SR / 44100))),
    i: 0,
    low: 0,
  }))
  for (let n = 0; n < N; n++) {
    let sum = 0
    for (const c of combs) {
      const y = c.buf[c.i]!
      c.low = y * 0.6 + c.low * 0.4
      c.buf[c.i] = input[n]! + c.low * 0.86
      c.i = (c.i + 1) % c.buf.length
      sum += y
    }
    out[n] = sum / 4
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(Math.round((d + spread) * (SR / 44100)))
    let i = 0
    for (let n = 0; n < N; n++) {
      const delayed = buf[i]!
      const x = out[n]!
      buf[i] = x + delayed * 0.5
      out[n] = delayed - x * 0.5
      i = (i + 1) % buf.length
    }
  }
  return out
}

const tails = [reverb(wet[0], 0), reverb(wet[1], 23)] as const
const mixL = new Float32Array(N)
const mixR = new Float32Array(N)
let peak = 0
for (let n = 0; n < N; n++) {
  const fadeOut = Math.min(1, (N - n) / (SR * 0.6))
  mixL[n] = Math.tanh((dry[0][n]! + tails[0][n]! * 0.9) * 1.2) * fadeOut
  mixR[n] = Math.tanh((dry[1][n]! + tails[1][n]! * 0.9) * 1.2) * fadeOut
  peak = Math.max(peak, Math.abs(mixL[n]!), Math.abs(mixR[n]!))
}

// ---- Normalise to -1 dBFS and write 16-bit PCM ----
const scale = 10 ** (-1 / 20) / (peak || 1)
const data = Buffer.alloc(N * 4)
for (let n = 0; n < N; n++) {
  data.writeInt16LE(Math.round(mixL[n]! * scale * 32767), n * 4)
  data.writeInt16LE(Math.round(mixR[n]! * scale * 32767), n * 4 + 2)
}
const header = Buffer.alloc(44)
header.write("RIFF", 0)
header.writeUInt32LE(36 + data.length, 4)
header.write("WAVEfmt ", 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(SR, 24)
header.writeUInt32LE(SR * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write("data", 36)
header.writeUInt32LE(data.length, 40)

const film = process.argv[2] ?? "3d-art"
const out = join(import.meta.dirname, "..", "public", film, "score.wav")
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, Buffer.concat([header, data]))
console.log(
  `${out}: ${SECONDS}s, peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS before normalising`
)
