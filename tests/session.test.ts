import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../src/lib/answers'
import { ALL_LESSONS } from '../src/lib/curriculum'
import { buildExam, lessonSource, makeFillStep, makeMatch, makeOrder, practiceSource } from '../src/lib/session'
import { generate } from '../src/lib/generators'
import type { Level, Question } from '../src/lib/types'

function validate(q: Question) {
  expect(q.text.length).toBeGreaterThan(5)
  expect(q.solutionSteps.length).toBeGreaterThan(0)
  if (q.type === 'match') {
    expect(q.pairs!.length).toBe(4)
    expect(new Set(q.pairs!.map((p) => p[1])).size).toBe(4)
    expect(new Set(q.pairs!.map((p) => p[0])).size).toBe(4)
  } else if (q.type === 'order') {
    expect(q.steps!.length).toBeGreaterThanOrEqual(3)
  } else if (q.type === 'fill_step') {
    expect(q.options!.length).toBe(4)
    expect(q.options!.filter((o) => o === q.answer).length).toBe(1)
    expect(new Set(q.options).size).toBe(4)
    expect(q.solutionSteps[q.hiddenIndex!]).toBe(q.answer)
  } else if (q.type === 'mcq' || q.type === 'find_error') {
    expect(q.options).toContain(q.answer)
  } else if (q.type === 'numeric' || q.type === 'text') {
    expect(checkAnswer(q, String(q.answer))).toBe(true)
  }
}

describe('lesson sessions', () => {
  for (const lesson of ALL_LESSONS.filter((l) => l.kind !== 'intro' && l.kind !== 'exam')) {
    for (const level of [1, 2, 3] as Level[]) {
      for (const inverse of [false, true]) {
        it(`${lesson.id} (${lesson.title}) level ${level}${inverse ? ' +inverse' : ''} builds valid questions`, () => {
          for (let run = 0; run < 8; run++) {
            const src = lessonSource(lesson.id, { level, inverseEnabled: inverse })
            const used = new Set<string>()
            for (let i = 0; i < src.total; i++) {
              const q = src.next(i, level, used)
              used.add(q.id)
              validate(q)
              if (!inverse) expect(q.inverse ?? false).toBe(false)
              if (!inverse) expect(['pr17', 'pr18']).not.toContain(q.id)
            }
          }
        })
      }
    }
  }
  it('free practice works for every topic and level', () => {
    for (const t of ['pythagoras', 'ratio', 'proportion', 'scale', 'combo'] as const)
      for (const level of [1, 2, 3] as Level[]) {
        const src = practiceSource(t, { level, inverseEnabled: true }, 20)
        for (let i = 0; i < 20; i++) validate(src.next(i, level, new Set()))
      }
  })
  it('mock exam has 12 questions with 4 combined word problems', () => {
    for (const level of [1, 2, 3] as Level[])
      for (let r = 0; r < 20; r++) {
        const qs = buildExam({ level, inverseEnabled: false })
        expect(qs).toHaveLength(12)
        expect(qs.filter((q) => q.id.startsWith('w')).length).toBe(4)
        qs.forEach(validate)
      }
  })
  it('variety builders work on every generator', () => {
    for (const id of ['pyth_hyp_triple', 'ratio_divide_total', 'prop_solve_x', 'scale_area', 'combo_map_pyth', 'ratio_change'])
      for (let r = 0; r < 50; r++) {
        const q = generate(id, 2)
        const o = makeOrder(q)
        if (o) validate(o)
        const f = makeFillStep(q)
        if (f) validate(f)
      }
    for (const t of ['pythagoras', 'ratio', 'proportion', 'scale'] as const) for (const l of [1, 2, 3] as Level[]) for (let r = 0; r < 30; r++) validate(makeMatch(t, l))
  })
})
