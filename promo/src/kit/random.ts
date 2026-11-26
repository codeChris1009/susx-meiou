/**
 * Seeded randomness. Remotion renders frames out of order and in parallel tabs, so nothing may depend on what was drawn
 * before: every random value is a pure function of a seed and its indices.
 */

/** mulberry32: a small, fast 32-bit generator; the same seed always gives the same sequence */
export function generator(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One value in [0, 1) for a tuple of integers, without keeping a generator around */
export function hash(...keys: number[]) {
  let h = 2166136261
  for (const k of keys) {
    h ^= k | 0
    h = Math.imul(h, 16777619)
    h ^= h >>> 13
  }
  return generator(h)()
}

export const between = (r: number, min: number, max: number) =>
  min + r * (max - min)
