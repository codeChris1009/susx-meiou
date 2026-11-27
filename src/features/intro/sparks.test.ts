import { describe, expect, it } from "vitest"

import { CAPACITY, ParticlePool, flight, type Box, type Spray } from "./sparks"

const BOX: Box = { left: 100, top: 100, width: 40, height: 20 }

const spray = (life: number, over: Partial<Spray> = {}): Spray => ({
  from: "area",
  angle: 0,
  spread: 0,
  distance: [80, 80],
  life: [life, life],
  size: [4, 4],
  end: 0.2,
  ...over,
})

describe("ParticlePool", () => {
  it("emits up to capacity and never more", () => {
    const pool = new ParticlePool(3, () => 0.5)
    pool.emit(CAPACITY + 50, BOX, spray(100))
    expect(pool.count).toBe(CAPACITY)
  })

  it("removes sparks at the end of their life and keeps the survivors intact", () => {
    const pool = new ParticlePool(1, () => 0.5)
    pool.emit(1, BOX, spray(50))
    pool.emit(1, BOX, spray(500, { distance: [0, 0] }))
    pool.step(60)
    expect(pool.count).toBe(1)
    expect(pool.read(0).x).toBeCloseTo(120)
  })

  it("flies out along its spray, slowing, shrinking and fading as it goes", () => {
    const pool = new ParticlePool(1, () => 0.5)
    pool.emit(1, BOX, spray(1000))
    const start = pool.read(0)
    pool.step(250)
    const early = pool.read(0)
    pool.step(250)
    const half = pool.read(0)
    expect(start.x).toBeCloseTo(120)
    expect(half.x - start.x).toBeCloseTo(80 * flight(0.5))
    // Fast off the mark: the first quarter covers more ground than the second
    expect(early.x - start.x).toBeGreaterThan(half.x - early.x)
    expect(half.size).toBeLessThan(start.size)
    expect(half.alpha).toBeLessThan(start.alpha)
    expect(half.y).toBeCloseTo(start.y)
  })

  it("is placed by its age alone, so one long frame lands where many short ones do", () => {
    const one = new ParticlePool(1, () => 0.3)
    const many = new ParticlePool(1, () => 0.3)
    one.emit(1, BOX, spray(1000, { spread: 2 }))
    many.emit(1, BOX, spray(1000, { spread: 2 }))
    one.step(400)
    for (let i = 0; i < 25; i++) many.step(16)
    expect(one.read(0).x).toBeCloseTo(many.read(0).x)
    expect(one.read(0).y).toBeCloseTo(many.read(0).y)
  })

  it("starts edge sparks outside the box and sends them away from it", () => {
    // random 0.1: the top side, near its left end
    const pool = new ParticlePool(1, () => 0.1)
    pool.emit(1, BOX, spray(1000, { from: "edge" }))
    const start = pool.read(0)
    expect(start.y).toBeLessThan(BOX.top)
    pool.step(500)
    expect(pool.read(0).y).toBeLessThan(start.y)
  })

  it("keeps colours in range, and offsets halo sparks to the halo sprites", () => {
    const pool = new ParticlePool(4, () => 0.9999)
    pool.emit(3, BOX, spray(100))
    pool.emit(3, BOX, spray(100, { halo: true }))
    const tones = Array.from(
      { length: pool.count },
      (_, p) => pool.read(p).tone
    )
    expect(tones).toEqual([3, 3, 3, 7, 7, 7])
  })
})
