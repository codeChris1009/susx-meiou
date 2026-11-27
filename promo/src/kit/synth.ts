/**
 * A small synthesiser for trailer scores: no samples, no external audio, the same bytes every run. A film's score.ts
 * places instruments on its own beat sheet (timeline.ts); scripts/compose.ts mixes them and writes the WAV.
 *
 * Every voice is a pure function of time built from sines and seeded noise, added into a dry bus and a reverb send.
 * The instruments cover what a trailer needs: harmony (drone, pad, choir), weight (boom, hit, braam, taiko, sub),
 * rhythm (kick, snare, hat, tick, pulse, heart), colour (pluck, bell, bowl, ping, glitch) and motion (riser, whoosh).
 */
import { generator } from "./random.ts"

const SR = 48000
const TAU = Math.PI * 2

export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

interface Send {
  gain?: number
  /** -1 left to 1 right */
  pan?: number
  /** Share sent to the reverb */
  send?: number
}

export class Mix {
  readonly seconds: number
  readonly n: number
  readonly dry: [Float32Array, Float32Array]
  readonly wet: [Float32Array, Float32Array]
  readonly noise: () => number

  constructor(seconds: number, seed = 1) {
    this.seconds = seconds
    this.n = Math.round(seconds * SR)
    this.dry = [new Float32Array(this.n), new Float32Array(this.n)]
    this.wet = [new Float32Array(this.n), new Float32Array(this.n)]
    this.noise = generator(seed)
  }

  /** White noise, -1 to 1 */
  white() {
    return this.noise() * 2 - 1
  }

  /** Adds a mono voice, `voice(t)` with t in seconds from `start`, for `length` seconds */
  put(
    start: number,
    length: number,
    voice: (t: number) => number,
    { gain = 1, pan = 0, send = 0.3 }: Send = {}
  ) {
    const from = Math.round(start * SR)
    const l = Math.cos(((pan + 1) * Math.PI) / 4) * gain
    const r = Math.sin(((pan + 1) * Math.PI) / 4) * gain
    const end = Math.min(this.n - from, Math.round(length * SR))
    for (let i = Math.max(0, -from); i < end; i++) {
      const v = voice(i / SR)
      this.dry[0][from + i]! += v * l
      this.dry[1][from + i]! += v * r
      this.wet[0][from + i]! += v * l * send
      this.wet[1][from + i]! += v * r * send
    }
  }

  /** The mix, through a Schroeder room (`room` 0 to 1 sets its size), soft-clipped, normalised to -1 dBFS, as WAV */
  wav({ room = 0.84, wet = 0.9, drive = 1.15, fadeOut = 0.6 } = {}) {
    const tails = [
      reverb(this.wet[0], 0, room),
      reverb(this.wet[1], 23, room),
    ] as const
    const mix = [new Float32Array(this.n), new Float32Array(this.n)] as const
    let peak = 0
    for (let n = 0; n < this.n; n++) {
      const fade = Math.min(1, (this.n - n) / (SR * fadeOut))
      for (const c of [0, 1] as const) {
        const v =
          Math.tanh((this.dry[c][n]! + tails[c][n]! * wet) * drive) * fade
        mix[c][n] = v
        peak = Math.max(peak, Math.abs(v))
      }
    }
    const scale = 10 ** (-1 / 20) / (peak || 1)
    const data = Buffer.alloc(this.n * 4)
    for (let n = 0; n < this.n; n++) {
      data.writeInt16LE(Math.round(mix[0][n]! * scale * 32767), n * 4)
      data.writeInt16LE(Math.round(mix[1][n]! * scale * 32767), n * 4 + 2)
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
    return { wav: Buffer.concat([header, data]), peak }
  }
}

function reverb(input: Float32Array, spread: number, room: number) {
  const out = new Float32Array(input.length)
  const combs = [1557, 1617, 1491, 1422].map((d) => ({
    buf: new Float32Array(Math.round((d + spread) * (SR / 44100))),
    i: 0,
    low: 0,
  }))
  for (let n = 0; n < input.length; n++) {
    let sum = 0
    for (const c of combs) {
      const y = c.buf[c.i]!
      c.low = y * 0.6 + c.low * 0.4
      c.buf[c.i] = input[n]! + c.low * room
      c.i = (c.i + 1) % c.buf.length
      sum += y
    }
    out[n] = sum / 4
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(Math.round((d + spread) * (SR / 44100)))
    let i = 0
    for (let n = 0; n < out.length; n++) {
      const delayed = buf[i]!
      const x = out[n]!
      buf[i] = x + delayed * 0.5
      out[n] = delayed - x * 0.5
      i = (i + 1) % buf.length
    }
  }
  return out
}

// ---- Building blocks ----

/** A sine whose frequency glides exponentially from a to b over `glide` seconds */
export function sweep(a: number, b: number, glide: number) {
  let phase = 0
  return (t: number) => {
    const f = a * (b / a) ** Math.min(1, t / glide)
    phase += (TAU * f) / SR
    return Math.sin(phase)
  }
}

/** A one-pole low-pass */
export function lowpass() {
  let y = 0
  return (x: number, cutoff: number) => {
    y += (1 - Math.exp((-TAU * cutoff) / SR)) * (x - y)
    return y
  }
}

/** Additive sawtooth with a soft top: harmonics fall as 1/h^tilt */
export function saw(
  f: number,
  t: number,
  harmonics: number,
  tilt = 1,
  phase = 0
) {
  let v = 0
  for (let h = 1; h <= harmonics; h++)
    v += Math.sin(TAU * f * h * t + phase * h) / h ** tilt
  return v
}

/** Attack-sustain-release over a note `length` long */
export const envelope = (
  t: number,
  length: number,
  attack: number,
  release: number
) =>
  Math.min(
    1,
    t / Math.max(attack, 1e-4),
    Math.max(0, (length - t) / Math.max(release, 1e-4))
  )

/** Calls `hit(time, index)` on every beat of `bpm` from `from` to `to` seconds, `every` beats apart */
export function beats(
  bpm: number,
  from: number,
  to: number,
  hit: (time: number, index: number) => void,
  every = 1
) {
  const step = (60 / bpm) * every
  for (let k = 0, s = from; s < to - 1e-6; k++, s = from + k * step) hit(s, k)
}

// ---- Harmony ----

/** A root in three octaves with a fifth, slowly beating; fades in and out */
export function drone(
  mix: Mix,
  from: number,
  to: number,
  root: number,
  { gain = 0.22, fade = 2, fifth = true } = {}
) {
  const f = hz(root)
  mix.put(
    from,
    to - from,
    (t) => {
      const env = envelope(t, to - from, fade, fade)
      const wob = 1 + 0.3 * Math.sin(TAU * 0.11 * t)
      let v =
        Math.sin(TAU * f * t) +
        0.6 * Math.sin(TAU * f * 2.003 * t) * wob +
        0.25 * Math.sin(TAU * f * 0.5 * t)
      if (fifth) v += 0.3 * Math.sin(TAU * f * 1.4983 * t + 0.4)
      return v * env * 0.5
    },
    { gain, send: 0.4 }
  )
}

/** A chord of detuned soft saws, string- or synth-like by `bright` (harmonics) */
export function pad(
  mix: Mix,
  from: number,
  to: number,
  notes: readonly number[],
  { gain = 0.12, bright = 6, attack = 1.2, release = 1.5, spread = 0.6 } = {}
) {
  notes.forEach((m, k) => {
    const f = hz(m)
    const pan =
      notes.length > 1 ? (k / (notes.length - 1) - 0.5) * 2 * spread : 0
    mix.put(
      from,
      to - from + release * 0.2,
      (t) => {
        const env = envelope(t, to - from, attack, release)
        return (
          (saw(f * 0.997, t, bright, 1.3) +
            saw(f * 1.004, t, bright, 1.3, 1.1)) *
          env *
          0.35
        )
      },
      { gain, pan, send: 0.55 }
    )
  })
}

/** Sung vowels: harmonics weighted by two formant peaks ("ah"), with vibrato */
export function choir(
  mix: Mix,
  from: number,
  to: number,
  notes: readonly number[],
  { gain = 0.1, attack = 1.5, release = 2 } = {}
) {
  const formant = (f: number) =>
    Math.exp(-(((f - 750) / 250) ** 2)) +
    0.7 * Math.exp(-(((f - 1200) / 300) ** 2)) +
    0.25
  notes.forEach((m, k) => {
    const f0 = hz(m)
    mix.put(
      from,
      to - from,
      (t) => {
        const f = f0 * (1 + 0.006 * Math.sin(TAU * 5.1 * t + k))
        let v = 0
        for (let h = 1; h <= 14; h++)
          v += (Math.sin(TAU * f * h * t + h * k) * formant(f0 * h)) / h ** 0.6
        return v * envelope(t, to - from, attack, release) * 0.12
      },
      { gain, pan: (k % 2 ? 1 : -1) * 0.35, send: 0.7 }
    )
  })
}

// ---- Weight ----

/** A deep falling sine with a breath of noise */
export function boom(mix: Mix, at: number, gain = 0.8) {
  const tone = sweep(72, 30, 2.4)
  const lp = lowpass()
  mix.put(
    at,
    4.5,
    (t) =>
      tone(t) * Math.exp(-t * 1.1) +
      lp(mix.white(), 400) * Math.exp(-t * 6) * 0.6,
    { gain, send: 0.35 }
  )
}

/** The big one: a boom, a crack of noise and a metallic ring */
export function hit(mix: Mix, at: number, gain = 1) {
  boom(mix, at, gain)
  const lp = lowpass()
  mix.put(
    at,
    2.5,
    (t) => {
      let ring = 0
      for (const [r, d] of [
        [1, 3],
        [2.32, 4],
        [4.25, 6],
      ] as const)
        ring += (Math.sin(TAU * 110 * r * t) * Math.exp(-t * d)) / r
      return lp(mix.white(), 2400) * Math.exp(-t * 9) * 1.2 + ring * 0.4
    },
    { gain: gain * 0.7, send: 0.6 }
  )
}

/** A low brass-like stab on `root`, high harmonics dying first */
export function braam(
  mix: Mix,
  at: number,
  root: number,
  { gain = 0.5, length = 2.6 } = {}
) {
  for (const [m, g] of [
    [root - 12, 1],
    [root, 0.8],
    [root + 7, 0.5],
  ] as const) {
    const f = hz(m)
    mix.put(
      at,
      length,
      (t) => {
        const env = Math.min(1, t / 0.04) * Math.exp(-t * 1.3)
        const bright = 4 + 14 * Math.exp(-t * 2.5)
        return (
          (saw(f, t, Math.round(bright), 0.9) +
            saw(f * 1.006, t, Math.round(bright), 0.9, 0.7)) *
          env *
          g *
          0.25
        )
      },
      { gain, send: 0.45 }
    )
  }
}

/** A big drum: a pitched skin and its slap */
export function taiko(mix: Mix, at: number, gain = 0.7, pitch = 62) {
  const tone = sweep(pitch * 1.6, pitch, 0.08)
  const lp = lowpass()
  mix.put(
    at,
    1.6,
    (t) =>
      tone(t) * Math.exp(-t * 4) +
      lp(mix.white(), 900) * Math.exp(-t * 28) * 0.8,
    { gain, send: 0.35 }
  )
}

/** A sub-bass drop */
export function sub(mix: Mix, at: number, gain = 0.6) {
  const tone = sweep(90, 28, 1.2)
  mix.put(
    at,
    2.4,
    (t) => tone(t) * Math.min(1, t / 0.01) * Math.exp(-t * 1.4),
    { gain, send: 0.1 }
  )
}

// ---- Rhythm ----

export function kick(mix: Mix, at: number, gain = 0.7) {
  const tone = sweep(150, 45, 0.06)
  mix.put(
    at,
    0.5,
    (t) => tone(t) * Math.exp(-t * 9) + mix.white() * Math.exp(-t * 200) * 0.2,
    { gain, send: 0.05 }
  )
}

export function snare(mix: Mix, at: number, gain = 0.35) {
  const lp = lowpass()
  mix.put(
    at,
    0.4,
    (t) =>
      lp(mix.white(), 5000) * Math.exp(-t * 16) +
      Math.sin(TAU * 190 * t) * Math.exp(-t * 22) * 0.5,
    { gain, send: 0.25 }
  )
}

export function hat(
  mix: Mix,
  at: number,
  gain = 0.12,
  open = false,
  pan = 0.2
) {
  const lp = lowpass()
  mix.put(
    at,
    open ? 0.35 : 0.06,
    (t) => {
      const x = mix.white()
      return (x - lp(x, 7000)) * Math.exp(-t * (open ? 12 : 70))
    },
    { gain, pan, send: 0.1 }
  )
}

/** A dry click, a clock's tick or an interface's */
export function tick(mix: Mix, at: number, gain = 0.15, tone = 2400, pan = 0) {
  mix.put(
    at,
    0.05,
    (t) =>
      (Math.sin(TAU * tone * t) * 0.6 + mix.white() * 0.4) * Math.exp(-t * 160),
    { gain, pan, send: 0.15 }
  )
}

/** A heartbeat: lub-dub, low */
export function heart(
  mix: Mix,
  from: number,
  to: number,
  bpm: number,
  gain = 0.5
) {
  beats(bpm, from, to, (s) => {
    for (const [d, g] of [
      [0, 1],
      [0.22, 0.6],
    ] as const) {
      const tone = sweep(70, 40, 0.12)
      mix.put(s + d, 0.4, (t) => tone(t) * Math.exp(-t * 14) * g, {
        gain,
        send: 0.1,
      })
    }
  })
}

/** An eighth-note bass ostinato over `notes` (one per bar of four beats), filtered */
export function pulse(
  mix: Mix,
  from: number,
  to: number,
  bpm: number,
  notes: readonly number[],
  { gain = 0.16, bright = 900 } = {}
) {
  const eighth = 30 / bpm
  beats(bpm * 2, from, to, (s, k) => {
    const f = hz(notes[Math.floor(k / 8) % notes.length]!)
    const lp = lowpass()
    mix.put(
      s,
      eighth * 0.95,
      (t) =>
        lp(saw(f, t, 12, 1), bright * (0.6 + Math.exp(-t * 12))) *
        Math.exp(-t * 4) *
        (k % 2 ? 0.7 : 1),
      { gain, send: 0.12 }
    )
  })
}

// ---- Colour ----

/** A plucked string: harmonics decaying faster the higher they are */
export function pluck(
  mix: Mix,
  at: number,
  midi: number,
  { gain = 0.2, decay = 2.5, pan = 0, send = 0.4 } = {}
) {
  const f = hz(midi)
  mix.put(
    at,
    3,
    (t) => {
      let v = 0
      for (let h = 1; h <= 8; h++)
        v += (Math.sin(TAU * f * h * t) * Math.exp(-t * decay * h ** 0.8)) / h
      return v * Math.min(1, t / 0.002)
    },
    { gain, pan, send }
  )
}

/** A bell: inharmonic partials, the high ones short */
export function bell(
  mix: Mix,
  at: number,
  midi: number,
  { gain = 0.15, decay = 1.2, pan = 0, send = 0.55 } = {}
) {
  const f = hz(midi)
  mix.put(
    at,
    5,
    (t) => {
      let v = 0
      for (const [r, d, a] of [
        [1, 1, 1],
        [2.0, 1.6, 0.5],
        [2.76, 2.2, 0.4],
        [5.4, 3.5, 0.25],
        [8.93, 5, 0.12],
      ] as const)
        v += Math.sin(TAU * f * r * t) * Math.exp(-t * decay * d) * a
      return v * Math.min(1, t / 0.002)
    },
    { gain, pan, send }
  )
}

/** A singing bowl: two close partials beating, very long */
export function bowl(
  mix: Mix,
  at: number,
  midi: number,
  { gain = 0.18, length = 8, pan = 0 } = {}
) {
  const f = hz(midi)
  mix.put(
    at,
    length,
    (t) => {
      const env = Math.min(1, t / 0.01) * Math.exp(-t * (3 / length))
      return (
        (Math.sin(TAU * f * t) +
          Math.sin(TAU * f * 1.004 * t) +
          0.4 * Math.sin(TAU * f * 2.71 * t) * Math.exp(-t * 0.8)) *
        env *
        0.4
      )
    },
    { gain, pan, send: 0.6 }
  )
}

/** A sonar ping: a pure tone with a long tail and one echo */
export function ping(
  mix: Mix,
  at: number,
  midi: number,
  { gain = 0.14, pan = 0 } = {}
) {
  const f = hz(midi)
  for (const [d, g, p] of [
    [0, 1, pan],
    [0.38, 0.35, -pan],
  ] as const)
    mix.put(
      at + d,
      3,
      (t) =>
        Math.sin(TAU * f * t) * Math.min(1, t / 0.003) * Math.exp(-t * 1.8) * g,
      { gain, pan: p, send: 0.6 }
    )
}

/** Broken digital noise: stuttering, bit-crushed bursts */
export function glitch(mix: Mix, at: number, length = 0.25, gain = 0.18) {
  let held = 0
  mix.put(
    at,
    length,
    (t) => {
      if (Math.floor(t * 2400) % 7 === 0) held = Math.round(mix.white() * 4) / 4
      const gate = Math.floor(t * 40) % 3 ? 1 : 0
      return (
        (held + Math.sign(Math.sin(TAU * 180 * t)) * 0.3) *
        gate *
        envelope(t, length, 0.002, 0.03)
      )
    },
    { gain, pan: mix.white() * 0.6, send: 0.1 }
  )
}

// ---- Motion ----

/** Noise opening up and a tone gliding up into `to`, where it stops dead */
export function riser(
  mix: Mix,
  from: number,
  to: number,
  { gain = 0.3, low = 200, high = 6000 } = {}
) {
  const lp = lowpass()
  const tone = sweep(110, 880, to - from)
  mix.put(
    from,
    to - from,
    (t) => {
      const k = t / (to - from)
      const trem = 0.6 + 0.4 * Math.sin(TAU * (4 + 18 * k * k) * t)
      return (
        (lp(mix.white(), low * (high / low) ** k) * 0.9 + tone(t) * 0.25) *
        k ** 1.6 *
        trem
      )
    },
    { gain, send: 0.4 }
  )
}

/** Air moving past: band of noise sweeping up then down, for a transition */
export function whoosh(
  mix: Mix,
  at: number,
  length = 0.8,
  gain = 0.22,
  pan = 0
) {
  const lp = lowpass()
  const hp = lowpass()
  mix.put(
    at,
    length,
    (t) => {
      const k = t / length
      const x = lp(mix.white(), 300 + 5000 * Math.sin(Math.PI * k))
      return (x - hp(x, 150)) * Math.sin(Math.PI * k) ** 2
    },
    { gain, pan, send: 0.3 }
  )
}
