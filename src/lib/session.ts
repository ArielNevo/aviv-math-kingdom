// Builds the stream of questions for lessons, free practice, mistakes review and the mock exam.
import { BANK, CURRICULUM, MAIN_TOPICS, lessonById, staticById, type LessonDef } from './curriculum'
import { GEN_BY_ID, GENERATORS, generate } from './generators'
import { PYTH_TRIPLES, type Rng, fmtSep, gcd, pick, randInt, shuffle } from './math'
import type { Level, MainTopic, Question, Topic } from './types'

const rng: Rng = Math.random

export interface SessionOptions {
  level: Level
  inverseEnabled: boolean
}

/** Static pool for a lesson around the given level (≤20% from a neighbour level). */
function staticPool(ids: string[], level: Level): Question[] {
  const qs = ids.map((id) => staticById[id]).filter(Boolean)
  const same = qs.filter((q) => q.difficulty === level)
  const near = qs.filter((q) => Math.abs(q.difficulty - level) === 1)
  if (same.length && (rng() > 0.2 || !near.length)) return same
  return near.length ? near : qs
}

function pickUnused(pool: Question[], used: Set<string>): Question | undefined {
  const fresh = pool.filter((q) => !used.has(q.id))
  return fresh.length ? pick(rng, fresh) : undefined
}

/** Occasionally drift to a neighbour level for variety (manual mode). */
function variedLevel(level: Level): Level {
  if (rng() < 0.15) {
    const n = level + (rng() < 0.5 ? -1 : 1)
    if (n >= 1 && n <= 3) return n as Level
  }
  return level
}

function genIds(lesson: LessonDef, opts: SessionOptions): string[] {
  const ids = [...(lesson.generators ?? [])]
  if (opts.inverseEnabled && lesson.inverseGens) ids.push(...lesson.inverseGens)
  return ids
}

// ----------------------------------------------------------------------------
// Variety question builders (match / order / fill_step)
// ----------------------------------------------------------------------------

export function makeOrder(src: Question): Question | null {
  if (src.solutionSteps.length < 3) return null
  return {
    ...src,
    id: src.id + '-order-' + randInt(rng, 0, 1e6),
    type: 'order',
    text: 'סדרי את שלבי הפתרון בסדר הנכון: ' + src.text,
    steps: src.solutionSteps,
    answer: src.solutionSteps.join(' | '),
    hint: 'מה צריך לחשב קודם כדי שאפשר יהיה להמשיך?',
    figure: src.figure,
  }
}

/** Replace the last number in a step with a wrong value. */
function perturbStep(step: string, k: number): string | null {
  const nums = [...step.matchAll(/\d+(?:\.\d+)?/g)]
  if (!nums.length) return null
  const last = nums[nums.length - 1]
  const v = Number(last[0])
  const options = [v + 1, v - 1, v * 2, v + 10, Math.round(v / 2), v + 2, v - 2]
    .filter((x) => x > 0 && x !== v && Number.isFinite(x))
    .map((x) => Math.round(x * 100) / 100)
  const nv = options[k % options.length]
  if (nv === undefined) return null
  return step.slice(0, last.index!) + String(nv) + step.slice(last.index! + last[0].length)
}

export function makeFillStep(src: Question): Question | null {
  const steps = src.solutionSteps
  if (steps.length < 2) return null
  // hide a step that contains "=" and a number (prefer a middle/last one)
  const candidates = steps.map((_, i) => i).filter((i) => /=/.test(steps[i]) && /\d/.test(steps[i]))
  if (!candidates.length) return null
  const idx = candidates.length > 1 ? pick(rng, candidates.slice(1)) : candidates[0]
  const correct = steps[idx]
  const wrong = new Set<string>()
  for (let k = 0; wrong.size < 3 && k < 12; k++) {
    const w = perturbStep(correct, k + randInt(rng, 0, 6))
    if (w && w !== correct) wrong.add(w)
  }
  if (wrong.size < 3) return null
  return {
    ...src,
    id: src.id + '-fill-' + randInt(rng, 0, 1e6),
    type: 'fill_step',
    text: 'השלימי את הצעד החסר בפתרון: ' + src.text,
    hiddenIndex: idx,
    options: shuffle(rng, [correct, ...wrong]),
    answer: correct,
    hint: 'בדקי את החישוב בכל אחת מהאפשרויות — רק אחת נכונה.',
  }
}

export function makeMatch(topic: Topic, level: Level): Question {
  const pairs: [string, string][] = []
  const seen = new Set<string>()
  const add = (l: string, r: string) => {
    if (seen.has(r) || seen.has('L' + l)) return
    seen.add(r)
    seen.add('L' + l)
    pairs.push([l, r])
  }
  let text = ''
  let guard = 0
  if (topic === 'pythagoras' || topic === 'combo') {
    text = 'התאימי לכל זוג ניצבים את היתר שלו'
    while (pairs.length < 4 && guard++ < 100) {
      const t = pick(rng, PYTH_TRIPLES.slice(0, level === 1 ? 3 : 6))
      const k = randInt(rng, 1, level === 1 ? 2 : 4)
      add(`${t[0] * k}, ${t[1] * k}`, String(t[2] * k))
    }
  } else if (topic === 'ratio') {
    text = 'התאימי לכל יחס את הצורה המצומצמת שלו'
    while (pairs.length < 4 && guard++ < 100) {
      let a = randInt(rng, 1, 9),
        b = randInt(rng, 1, 9)
      if (a === b || gcd(a, b) !== 1) continue
      const f = randInt(rng, 2, level === 1 ? 6 : 12)
      add(`${a * f}:${b * f}`, `${a}:${b}`)
    }
  } else if (topic === 'proportion') {
    text = 'התאימי לכל פרופורציה את הפתרון שלה'
    while (pairs.length < 4 && guard++ < 100) {
      const a = randInt(rng, 1, 9),
        b = randInt(rng, 2, 9),
        m = randInt(rng, 2, 5)
      add(`x/${b} = ${a * m}/${b * m}`, `x = ${a}`)
    }
  } else {
    text = 'התאימי לכל מרחק במפה את המרחק במציאות'
    const scales = [25000, 50000, 100000, 200000, 250000]
    while (pairs.length < 4 && guard++ < 100) {
      const N = pick(rng, scales)
      const cm = randInt(rng, 1, 8)
      const km = (cm * N) / 100000
      add(`1:${fmtSep(N)} · ${cm} ס"מ`, `${km} ק"מ`)
    }
  }
  return {
    id: 'match-' + randInt(rng, 0, 1e6),
    topics: [topic],
    difficulty: level,
    type: 'match',
    text,
    pairs,
    answer: pairs.map((p) => p.join('→')).join(' | '),
    hint: 'התחילי מהזוג שאת הכי בטוחה בו — כך נשארות פחות אפשרויות.',
    solutionSteps: pairs.map(([l, r]) => `${l} → ${r}`),
  }
}

/** Wrap a regular question into a variety type (fallbacks to the original). */
function varietyFrom(src: Question, topic: Topic, level: Level, slot: number): Question {
  const kind = slot % 3
  if (kind === 0) return makeMatch(topic, level)
  if (kind === 1) return makeOrder(src) ?? makeFillStep(src) ?? src
  return makeFillStep(src) ?? makeOrder(src) ?? src
}

// ----------------------------------------------------------------------------
// Sources
// ----------------------------------------------------------------------------

export interface QuestionSource {
  total: number
  /** Build question #i at the current level. */
  next: (i: number, level: Level, used: Set<string>) => Question
  xpMultiplier: number
}

export function lessonSource(lessonId: string, opts: SessionOptions): QuestionSource {
  const lesson = lessonById[lessonId]
  const unit = CURRICULUM.find((u) => u.id === lesson.unitId)!
  const isBoss = lesson.kind === 'boss' || lesson.kind === 'combo'
  const total = isBoss ? 8 : 10
  const gens = genIds(lesson, opts)
  const varietySlots = isBoss ? [] : [3, 7]

  return {
    total,
    xpMultiplier: isBoss ? 1.5 : 1,
    next(i, levelIn, used) {
      const level = lesson.fixedLevel ?? levelIn
      // boss lessons: word problems for the unit topic
      if (isBoss) {
        const words = BANK.wordProblems.filter((w) =>
          lesson.fixedLevel ? w.difficulty === lesson.fixedLevel : lesson.wordTopic ? w.topics.includes(lesson.wordTopic) : true,
        )
        const atLevel = words.filter((w) => Math.abs(w.difficulty - level) <= (lesson.fixedLevel ? 0 : 1))
        const preferred = atLevel.filter((w) => w.difficulty === level)
        const pool = (preferred.length && rng() < 0.8 ? preferred : atLevel).map((w) => staticById[w.id])
        const statics = (lesson.staticIds ?? []).map((id) => staticById[id])
        if (rng() < 0.6) {
          const w = pickUnused([...pool, ...statics], used)
          if (w) return w
        }
        return generate(pick(rng, gens), lesson.fixedLevel ?? level)
      }
      const lvl = variedLevel(level)
      const fromStatic = (lesson.staticIds?.length ?? 0) > 0 && rng() < 0.4
      let base: Question | undefined
      if (fromStatic) base = pickUnused(staticPool(lesson.staticIds!, lvl), used)
      // inverse-proportion statics are optional content
      if (base && !opts.inverseEnabled && (base.id === 'pr17' || base.id === 'pr18')) base = undefined
      if (!base) base = generate(pick(rng, gens), lvl)
      if (varietySlots.includes(i)) return varietyFrom(base, unit.topic, lvl, i === 3 ? (rng() < 0.5 ? 0 : 1) : 2)
      return base
    },
  }
}

export function practiceSource(topic: MainTopic | 'combo', opts: SessionOptions, total = 10): QuestionSource {
  const gens = GENERATORS.filter((g) => g.topic === topic && (opts.inverseEnabled || !g.inverse)).map((g) => g.id)
  return {
    total,
    xpMultiplier: topic === 'combo' ? 1.5 : 1,
    next(i, level) {
      const lvl = variedLevel(level)
      const base = generate(pick(rng, gens), lvl)
      if (i > 0 && i % 4 === 3) return varietyFrom(base, topic, lvl, i)
      return base
    },
  }
}

export interface MistakeRef {
  key: string
  questionId?: string
  generatorId?: string
  level: Level
}

export function mistakesSource(items: MistakeRef[]): QuestionSource {
  const list = shuffle(rng, items)
  return {
    total: list.length,
    xpMultiplier: 1,
    next(i) {
      const m = list[i % list.length]
      // static questions: half the time the same one, half a fresh similar one
      if (m.questionId && staticById[m.questionId] && (!m.generatorId || rng() < 0.5)) {
        return { ...staticById[m.questionId], reviewKey: m.key }
      }
      const q = generate(m.generatorId!, m.level)
      return { ...q, reviewKey: m.key }
    },
  }
}

/** 12 questions: 2 from each main topic + 4 combined word problems. */
export function buildExam(opts: SessionOptions): Question[] {
  const level = opts.level
  const qs: Question[] = []
  for (const topic of MAIN_TOPICS) {
    const pool = BANK.questions.filter((q) => q.topics[0] === topic && q.difficulty === level && (q.type === 'numeric' || q.type === 'text'))
    const st = pickUnused(pool, new Set())
    if (st) qs.push(st)
    const gens = GENERATORS.filter((g) => g.topic === topic && !g.inverse && g.levels.includes(level))
    const gs = gens.length ? gens : GENERATORS.filter((g) => g.topic === topic && !g.inverse)
    qs.push(generate(pick(rng, gs).id, level))
    if (!st) qs.push(generate(pick(rng, gs).id, level))
  }
  const words = shuffle(
    rng,
    BANK.wordProblems.filter((w) => w.difficulty === level),
  ).slice(0, 4)
  qs.push(...words.map((w) => staticById[w.id]))
  return qs
}

export const isGenerated = (q: Question) => Boolean(q.generatorId && GEN_BY_ID[q.generatorId])
