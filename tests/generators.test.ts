import { describe, expect, it } from 'vitest'
import { GENERATORS, GEN_BY_ID } from '../src/lib/generators'
import { checkAnswer, exactValue, parseNumeric } from '../src/lib/answers'
import { gcdAll, seeded } from '../src/lib/math'
import type { Level, Question } from '../src/lib/types'

const N_RUNS = 300
const sq = (x: number) => x * x
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps
const hyp = (a: number, b: number) => Math.sqrt(a * a + b * b)
const isNice = (x: number, decimals = 4) => close(x, Math.round(x * 10 ** decimals) / 10 ** decimals, 1e-9)

/**
 * Independent oracles: recompute the expected answer from the raw params
 * WITHOUT using any generator code. Returns the expected answer.
 */
const ORACLES: Record<string, (q: Question) => number | string | boolean> = {
  pyth_hyp_triple: ({ params: p }) => hyp(+p!.a, +p!.b),
  pyth_leg_triple: ({ params: p }) => Math.sqrt(sq(+p!.c) - sq(+p!.a)),
  pyth_hyp_irrational: ({ params: p }) => Math.sqrt(+p!.n),
  pyth_is_right: ({ params: p }) => sq(+p!.s1) + sq(+p!.s2) === sq(+p!.s3),
  pyth_rect_diagonal: ({ params: p }) => hyp(+p!.w, +p!.h),
  pyth_isosceles_height: ({ params: p }) => Math.sqrt(sq(+p!.leg) - sq(+p!.base / 2)),
  pyth_rhombus_side: ({ params: p }) => hyp(+p!.d1 / 2, +p!.d2 / 2),
  pyth_distance_points: ({ params: p }) => hyp(+p!.bx - +p!.ax, +p!.by - +p!.ay),
  pyth_ladder_kite: ({ params: p }) => (p!.hyp !== undefined ? Math.sqrt(sq(+p!.hyp) - sq(+p!.leg)) : hyp(+p!.leg1, +p!.leg2)),
  ratio_simplify: ({ params: p }) => {
    const g = gcdAll([+p!.A, +p!.B])
    return `${+p!.A / g}:${+p!.B / g}`
  },
  ratio_divide_total: ({ params: p }) => (+p!.total / +p!.sum) * +p!.target,
  ratio_given_one: ({ params: p }) => (+p!.given / +p!.a) * +p!.b,
  ratio_given_diff: ({ params: p }) => {
    const part = +p!.diff / (+p!.a - +p!.b)
    return part * (+p!.askBig ? +p!.a : +p!.b)
  },
  ratio_chain: ({ params: p }) => {
    // brute-force: smallest integers a:b:c with a/b = pa/pb and b/c = pb2/pc
    for (let b = 1; b <= 10000; b++) {
      const a = (b * +p!.a) / +p!.b
      const c = (b * +p!.c) / +p!.b2
      if (Number.isInteger(a) && Number.isInteger(c)) return `${a}:${b}:${c}`
    }
    return 'none'
  },
  ratio_change: ({ params: p }) => {
    // brute force x: (p·x + d)/(q·x) = r/s
    for (let x = 1; x <= 200; x++) {
      if ((+p!.p * x + +p!.d) * +p!.s === +p!.r * +p!.q * x) return +p!.askFirst ? +p!.p * x : +p!.q * x
    }
    return NaN
  },
  ratio_perimeter_rect: ({ params: p }) => {
    const x = +p!.P / (2 * (+p!.a + +p!.b))
    return +p!.a * x * +p!.b * x
  },
  prop_solve_x: (q) => {
    const p = q.params!
    if (p.form === 1) {
      // (x + k)/b = c/d → x = b·c/d − k
      return (+p.b * +p.c) / +p.d - +p.k
    }
    if (p.form === 2) {
      // x/(x + k) = c/d → x = c·k/(d − c)
      return (+p.c * +p.k) / (+p.d - +p.c)
    }
    const v = [+p.A, +p.B, +p.C, +p.D]
    const h = +p.hole
    // A/B = C/D
    if (h === 0) return (v[1] * v[2]) / v[3]
    if (h === 1) return (v[0] * v[3]) / v[2]
    if (h === 2) return (v[0] * v[3]) / v[1]
    return (v[1] * v[2]) / v[0]
  },
  prop_unit_price: ({ params: p }) => {
    if (p!.p1 !== undefined) return (+p!.p1 / +p!.n1) * +p!.n2
    if (p!.km1 !== undefined) return +p!.km2 / (+p!.km1 / +p!.l1)
    if (p!.eggs1 !== undefined) return (+p!.eggs1 / +p!.people1) * +p!.people2
    if (p!.d1 !== undefined) return (+p!.d1 / +p!.h1) * +p!.h2
    return +p!.v * (+p!.hours + +p!.minutes / 60)
  },
  prop_shadow: ({ params: p }) => (+p!.findHeight ? (+p!.h1 / +p!.s1) * +p!.given : (+p!.s1 / +p!.h1) * +p!.given),
  prop_inverse: ({ params: p }) => (+p!.w1 * +p!.d1) / +p!.w2,
  scale_map_to_real: ({ params: p }) => (+p!.cm * +p!.N) / (p!.unit === 'km' ? 100000 : 100),
  scale_real_to_map: ({ params: p }) => (+p!.real * (p!.unit === 'km' ? 100000 : 100)) / +p!.N,
  scale_find: ({ params: p }) => {
    const n = Math.round((+p!.real * (p!.unit === 'km' ? 100000 : 100)) / +p!.cm)
    return `1:${n}`
  },
  scale_area: ({ params: p }) =>
    p!.A !== undefined ? (+p!.A * +p!.N * +p!.N) / 10000 : (((+p!.w * +p!.N) / 100) * (+p!.h * +p!.N)) / 100,
  scale_between_maps: ({ params: p }) => (+p!.d1 * +p!.N1) / +p!.N2,
  combo_map_pyth: ({ params: p }) => {
    const straight = hyp(+p!.e, +p!.n)
    const cm = p!.mode === 'saved' ? +p!.e + +p!.n - straight : straight
    return (cm * +p!.N) / 100000
  },
  combo_ratio_pyth: ({ params: p }) => {
    const [a, b, c] = [+p!.a, +p!.b, +p!.c]
    if (p!.variant === 'triPerimeter') return (c * +p!.P) / (a + b + c)
    if (p!.variant === 'triArea') return c * Math.sqrt((2 * +p!.S) / (a * b))
    const x = +p!.d / c
    if (p!.variant === 'rectDiagPerimeter') return 2 * (a + b) * x
    return a * b * x * x
  },
  combo_scale_shadow: ({ params: p }) => {
    const realH = (+p!.h * +p!.N) / 100
    if (+p!.level === 2) {
      const realS = (+p!.s * +p!.N) / 100
      return hyp(realH, realS)
    }
    const shadow = (realH * +p!.stickS) / +p!.stickH
    return hyp(realH, shadow)
  },
  combo_ratio_prop_money: ({ params: p }) => {
    if (p!.unit !== undefined) return ((+p!.total / (+p!.p + +p!.q)) * +p!.q) / +p!.unit
    const total = (+p!.price * +p!.kg2)
    return (total / (+p!.p + +p!.q)) * +p!.q
  },
}

describe('generators', () => {
  it('implements all 29 generator specs from questionBank.json', async () => {
    const bank = (await import('../src/data/questionBank.json')).default as { generators: { id: string }[] }
    const specIds = bank.generators.map((g) => g.id).sort()
    expect(GENERATORS.map((g) => g.id).sort()).toEqual(specIds)
    for (const id of specIds) expect(ORACLES[id], `oracle for ${id}`).toBeTypeOf('function')
  })

  for (const g of GENERATORS) {
    describe(g.id, () => {
      for (const level of g.levels as Level[]) {
        it(`level ${level}: ${N_RUNS} questions are mathematically correct and well-formed`, () => {
          const rng = seeded(1000 * level + g.id.length)
          for (let i = 0; i < N_RUNS; i++) {
            const q = g.make(level, rng)
            const ctx = `${g.id} L${level} #${i}: ${q.text}`
            // shape
            expect(q.generatorId, ctx).toBe(g.id)
            expect(q.difficulty, ctx).toBe(level)
            expect(q.text.length, ctx).toBeGreaterThan(8)
            expect(q.text, ctx).not.toMatch(/undefined|NaN|Infinity/)
            expect(q.hint.length, ctx).toBeGreaterThan(5)
            expect(q.solutionSteps.length, ctx).toBeGreaterThan(0)
            for (const s of q.solutionSteps) expect(s, ctx).not.toMatch(/undefined|NaN|Infinity/)

            const expected = ORACLES[g.id](q)
            if (q.type === 'numeric') {
              const ans = Number(q.answer)
              expect(Number.isFinite(ans), ctx).toBe(true)
              expect(ans, ctx).toBeGreaterThan(0)
              expect(Number.isFinite(Number(expected)), ctx).toBe(true)
              // the stored answer matches the oracle (rounded answers within 0.005)
              const tol = q.exact ? 0.005 : 1e-6 * Math.max(1, Math.abs(ans))
              expect(Math.abs(ans - Number(expected)), ctx + ` expected ${expected}`).toBeLessThanOrEqual(tol)
              // "nice numbers": at most 2 decimals for non-exact answers (4 for big km/m² conversions)
              if (!q.exact) expect(isNice(ans, 4), ctx).toBe(true)
              // exact form agrees with the value
              if (q.exact) expect(Math.abs(exactValue(q.exact) - Number(expected)), ctx).toBeLessThan(1e-9)
              // the checker accepts the stored answer, the exact form, and rejects an off-by-one
              expect(checkAnswer(q, String(q.answer)), ctx).toBe(true)
              if (q.exact) expect(checkAnswer(q, q.exact), ctx).toBe(true)
              expect(checkAnswer(q, String(ans + 1)), ctx).toBe(false)
            } else if (q.type === 'text') {
              expect(checkAnswer(q, String(expected)), ctx + ` expected ${expected}`).toBe(true)
              expect(checkAnswer(q, String(q.answer)), ctx).toBe(true)
              for (const a of q.acceptedAnswers ?? []) expect(checkAnswer(q, a), ctx).toBe(true)
            } else if (q.type === 'true_false') {
              expect(q.answer, ctx).toBe(expected)
            }
            if (q.inverse) expect(g.inverse, ctx).toBe(true)
          }
        })
      }
    })
  }
})

describe('generator parameter ranges', () => {
  const rng = seeded(42)
  const many = (id: string, level: Level, n = 300) => Array.from({ length: n }, () => GEN_BY_ID[id].make(level, rng))

  it('pyth_hyp_triple level 1 uses multipliers ≤ 3 of the basic triples', () => {
    for (const q of many('pyth_hyp_triple', 1)) {
      const c = Number(q.answer)
      const ok = [5, 13, 17, 25].some((base) => c % base === 0 && c / base <= 3)
      expect(ok, q.text).toBe(true)
    }
  })
  it('pyth_hyp_irrational answers are never whole squares', () => {
    for (const q of [...many('pyth_hyp_irrational', 2), ...many('pyth_hyp_irrational', 3)]) {
      expect(Number.isInteger(Math.sqrt(Number(q.params!.n))), q.text).toBe(false)
    }
  })
  it('pyth_is_right is roughly balanced between true and false', () => {
    const qs = many('pyth_is_right', 1, 400)
    const t = qs.filter((q) => q.answer === true).length
    expect(t).toBeGreaterThan(120)
    expect(t).toBeLessThan(280)
  })
  it('pyth_distance_points starts inside [-10,10]²', () => {
    for (const q of many('pyth_distance_points', 3)) {
      expect(Math.abs(Number(q.params!.ax))).toBeLessThanOrEqual(10)
      expect(Math.abs(Number(q.params!.ay))).toBeLessThanOrEqual(10)
    }
  })
  it('ratio_simplify factors are 2..12 and the answer is reduced', () => {
    for (const q of many('ratio_simplify', 1)) {
      const [a, b] = String(q.answer).split(':').map(Number)
      expect(gcdAll([a, b])).toBe(1)
      const f = Number(q.params!.A) / a
      expect(f).toBeGreaterThanOrEqual(2)
      expect(f).toBeLessThanOrEqual(12)
    }
  })
  it('ratio_divide_total: multiplier 10..60 at level 2, whole answers', () => {
    for (const q of many('ratio_divide_total', 2)) {
      const m = Number(q.params!.total) / Number(q.params!.sum)
      expect(m).toBeGreaterThanOrEqual(10)
      expect(m).toBeLessThanOrEqual(60)
      expect(Number.isInteger(Number(q.answer))).toBe(true)
    }
  })
  it('ratio_chain uses lcm ≤ 60 and different b values', () => {
    for (const q of many('ratio_chain', 3)) {
      expect(q.params!.b).not.toBe(q.params!.b2)
      const [, b] = String(q.answer).split(':').map(Number)
      expect(b).toBeLessThanOrEqual(60)
    }
  })
  it('ratio_change answers are whole and positive', () => {
    for (const q of many('ratio_change', 3)) {
      expect(Number.isInteger(Number(q.answer))).toBe(true)
      expect(Number(q.answer)).toBeGreaterThan(0)
    }
  })
  it('prop_solve_x level 1 answers are whole numbers', () => {
    for (const q of many('prop_solve_x', 1)) expect(Number.isInteger(Number(q.answer)), q.text).toBe(true)
  })
  it('prop_inverse constant product is 60..360 and is flagged as inverse', () => {
    for (const q of many('prop_inverse', 3)) {
      const P = Number(q.params!.w1) * Number(q.params!.d1)
      expect(P).toBeGreaterThanOrEqual(60)
      expect(P).toBeLessThanOrEqual(360)
      expect(q.inverse).toBe(true)
      expect(Number.isInteger(Number(q.answer))).toBe(true)
    }
  })
  it('scale questions use scales from the spec list', () => {
    const allowed = [100, 200, 500, 1000, 25000, 50000, 100000, 250000]
    for (const q of [...many('scale_map_to_real', 1), ...many('scale_real_to_map', 2)]) expect(allowed).toContain(Number(q.params!.N))
    for (const q of many('scale_area', 3)) expect([50, 100, 200, 500, 1000]).toContain(Number(q.params!.N))
  })
  it('scale_area drawing area is 2..20 cm²', () => {
    for (const q of many('scale_area', 3)) if (q.params!.A !== undefined) {
      expect(Number(q.params!.A)).toBeGreaterThanOrEqual(2)
      expect(Number(q.params!.A)).toBeLessThanOrEqual(20)
    }
  })
  it('combo questions are marked as boss and span 2+ topics', () => {
    for (const id of ['combo_map_pyth', 'combo_ratio_pyth', 'combo_scale_shadow', 'combo_ratio_prop_money']) {
      for (const level of GEN_BY_ID[id].levels) {
        const q = GEN_BY_ID[id].make(level, rng)
        expect(q.boss).toBe(true)
        expect(q.topics.filter((t) => t !== 'combo').length).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('answer parsing', () => {
  it('accepts the brief’s numeric formats', () => {
    expect(parseNumeric('5')).toBe(5)
    expect(parseNumeric('5.0')).toBe(5)
    expect(parseNumeric('5.00')).toBe(5)
    expect(parseNumeric('2,5')).toBe(2.5)
    expect(parseNumeric('1,000')).toBe(1000)
    expect(parseNumeric('√50')).toBeCloseTo(7.0711, 4)
    expect(parseNumeric('5√2')).toBeCloseTo(7.0711, 4)
    expect(parseNumeric('5*sqrt(2)')).toBeCloseTo(7.0711, 4)
    expect(parseNumeric('sqrt(50)')).toBeCloseTo(7.0711, 4)
    expect(parseNumeric('3/4')).toBe(0.75)
    expect(parseNumeric('12 ס"מ')).toBe(12)
    expect(parseNumeric('−3')).toBe(-3)
    expect(Number.isNaN(parseNumeric('abc'))).toBe(true)
  })
  it('normalises ratio answers', () => {
    const q: Question = { id: 't', topics: ['ratio'], difficulty: 1, type: 'text', text: '', answer: '2:3', acceptedAnswers: ['2:3', '2/3'], hint: '', solutionSteps: [] }
    expect(checkAnswer(q, ' 2 : 3 ')).toBe(true)
    expect(checkAnswer(q, '2/3')).toBe(true)
    expect(checkAnswer(q, '3:2')).toBe(false)
    const s: Question = { ...q, answer: '1:50,000', acceptedAnswers: ['1:50000'] }
    expect(checkAnswer(s, '1:50,000')).toBe(true)
    expect(checkAnswer(s, '1:50000')).toBe(true)
  })
})
