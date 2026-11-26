import { describe, expect, it } from "vitest"

import { CAPACITY, ParticlePool, type Spray } from "./sparks"

const spray = (life: number): Spray => ({
  angle: -Math.PI / 2,
  spread: 0,
  speed: [0.1, 0.1],
  life: [life, life],
  size: [1, 1],
})

describe("ParticlePool", () => {
  it("emits up to capacity and never more", () => {
    const pool = new ParticlePool(3, () => 0.5)
    pool.emit(CAPACITY + 50, { x: 0, y: 0 }, spray(100))
    expect(pool.count).toBe(CAPACITY)
  })

  it("removes sparks at the end of their life and keeps the survivors intact", () => {
    const pool = new ParticlePool(1, () => 0.5)
    pool.emit(1, { x: 0, y: 0 }, spray(50))
    pool.emit(1, { x: 10, y: 0 }, spray(500))
    pool.step(60)
    expect(pool.count).toBe(1)
    const survivor = pool.read(0)
    expect(survivor.t).toBeCloseTo(60 / 500)
    expect(survivor.x).toBeCloseTo(10)
  })

  it("moves sparks along their spray and lets gravity pull them down", () => {
    const pool = new ParticlePool(1, () => 0.5)
    pool.emit(1, { x: 0, y: 100 }, spray(1000))
    pool.step(10)
    const first = pool.read(0)
    expect(first.y).toBeLessThan(100)
    expect(first.vy).toBeGreaterThan(-0.1)
  })

  it("assigns every tone in range", () => {
    const pool = new ParticlePool(4, () => 0.9999)
    pool.emit(10, { x: 0, y: 0 }, spray(100))
    for (let p = 0; p < pool.count; p++) expect(pool.read(p).tone).toBe(3)
  })
})
