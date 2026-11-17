import { describe, expect, it } from 'vitest'
import bankJson from '../src/data/questionBank.json'
import { checkAnswer, exactValue } from '../src/lib/answers'
import { CURRICULUM, staticById } from '../src/lib/curriculum'
import { GEN_BY_ID } from '../src/lib/generators'
import type { Question, QuestionBank } from '../src/lib/types'

const bank = bankJson as unknown as QuestionBank
const all: Question[] = [...bank.questions, ...bank.wordProblems]
const TYPES = ['numeric', 'mcq', 'true_false', 'text', 'find_error']
const TOPICS = ['pythagoras', 'ratio', 'proportion', 'scale']

describe('questionBank.json schema', () => {
  it('has meta with 3 difficulty levels, 5 units, mascot lines and 10 badges', () => {
    expect(bank.meta.difficultyLevels.map((l) => l.level)).toEqual([1, 2, 3])
    expect(bank.meta.units).toHaveLength(5)
    expect(bank.meta.mascot.correct.length).toBeGreaterThan(2)
    expect(bank.meta.mascot.wrong.length).toBeGreaterThan(2)
    expect(bank.meta.badges).toHaveLength(10)
  })
  it('has lesson cards for all 4 topics', () => {
    for (const t of TOPICS) {
      const l = bank.lessons[t as keyof QuestionBank['lessons']]
      expect(l.cards.length).toBeGreaterThanOrEqual(5)
      for (const c of l.cards) {
        expect(c.title).toBeTruthy()
        expect(c.body).toBeTruthy()
        expect(c.visual).toMatch(/^[a-z0-9_]+$/)
      }
    }
  })
  it('has 85 questions and 42 word problems (12/14/16 by level)', () => {
    expect(bank.questions).toHaveLength(85)
    expect(bank.wordProblems).toHaveLength(42)
    const byLevel = [1, 2, 3].map((l) => bank.wordProblems.filter((w) => w.difficulty === l).length)
    expect(byLevel).toEqual([12, 14, 16])
  })
  it('ids are unique', () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length)
  })

  for (const q of all) {
    it(`${q.id} is well-formed and its answer is accepted by the checker`, () => {
      expect(TYPES).toContain(q.type)
      expect([1, 2, 3]).toContain(q.difficulty)
      expect(q.topics.length).toBeGreaterThan(0)
      for (const t of q.topics) expect(TOPICS).toContain(t)
      expect(q.text.length).toBeGreaterThan(10)
      expect(q.hint.length).toBeGreaterThan(3)
      expect(q.solutionSteps.length).toBeGreaterThan(0)
      switch (q.type) {
        case 'numeric':
          expect(typeof q.answer).toBe('number')
          expect(checkAnswer(q, String(q.answer))).toBe(true)
          if (q.exact) {
            expect(Math.abs(exactValue(q.exact) - Number(q.answer))).toBeLessThanOrEqual(q.tolerance ?? 0.05)
            expect(checkAnswer(q, q.exact)).toBe(true)
          }
          break
        case 'mcq':
        case 'find_error':
          expect(q.options).toBeDefined()
          expect(q.options!.length).toBe(4)
          expect(q.options).toContain(q.answer)
          expect(new Set(q.options).size).toBe(4)
          break
        case 'true_false':
          expect(typeof q.answer).toBe('boolean')
          break
        case 'text':
          expect(checkAnswer(q, String(q.answer))).toBe(true)
          for (const a of q.acceptedAnswers ?? []) expect(checkAnswer(q, a)).toBe(true)
          break
      }
    })
  }
})

describe('curriculum wiring', () => {
  it('every unit lesson points at real generators and real static questions', () => {
    for (const unit of CURRICULUM) {
      for (const lesson of unit.lessons) {
        for (const g of lesson.generators ?? []) expect(GEN_BY_ID[g], `${lesson.id} → ${g}`).toBeDefined()
        for (const id of lesson.staticIds ?? []) expect(staticById[id], `${lesson.id} → ${id}`).toBeDefined()
      }
    }
  })
  it('the curriculum covers every static question at least once', () => {
    const used = new Set(CURRICULUM.flatMap((u) => u.lessons.flatMap((l) => l.staticIds ?? [])))
    const missing = bank.questions.filter((q) => !used.has(q.id)).map((q) => q.id)
    expect(missing).toEqual([])
  })
})
