import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ALL_LESSONS, CURRICULUM, similarGenerator } from './curriculum'
import type { Level, Question, Topic } from './types'

export const MAX_HEARTS = 5
export const HEART_REFILL_MS = 4 * 60 * 60 * 1000
export const XP_BY_LEVEL: Record<Level, number> = { 1: 10, 2: 15, 3: 25 }
/** spaced repetition intervals: 1 day, 3 days, 1 week */
const INTERVALS_DAYS = [1, 3, 7]
const DAY = 24 * 60 * 60 * 1000

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayDiff = (a: string, b: string) => Math.round((new Date(b + 'T12:00').getTime() - new Date(a + 'T12:00').getTime()) / DAY)

export interface Mistake {
  key: string
  questionId?: string
  generatorId?: string
  topic: Topic
  level: Level
  due: number
  stage: number // index into INTERVALS_DAYS
  misses: number
  text: string
}

export interface LessonProgress {
  completed: boolean
  best: number // accuracy 0..1
  times: number
}

export interface ExamResult {
  date: number
  score: number
  level: Level
  byTopic: Record<string, { correct: number; total: number }>
}

type Stat = { correct: number; total: number }

export interface ProgressState {
  // settings
  level: Level
  adaptive: boolean
  inverse: boolean
  sound: boolean
  unlockAll: boolean
  // progress
  xp: number
  hearts: number
  heartsAt: number
  streak: number
  lastDay: string | null
  days: Record<string, { xp: number; correct: number; total: number }>
  lessons: Record<string, LessonProgress>
  stats: Record<string, Record<Level, Stat>>
  correctL3: number
  mistakes: Record<string, Mistake>
  badges: Record<string, number>
  exams: ExamResult[]
  newBadges: string[]
}

interface Actions {
  setLevel: (l: Level) => void
  set: (patch: Partial<ProgressState>) => void
  tickHearts: () => void
  spendHearts: (n: number) => void
  refillHearts: () => void
  recordAnswer: (q: Question, correct: boolean, level: Level, xpMult: number) => number
  finishLesson: (lessonId: string | null, accuracy: number, perfect: boolean) => void
  finishExam: (r: ExamResult) => void
  completeIntro: (lessonId: string) => void
  clearNewBadges: () => void
  reset: () => void
  importState: (s: Partial<ProgressState>) => void
}

const initial: ProgressState = {
  level: 2,
  adaptive: true,
  inverse: false,
  sound: true,
  unlockAll: false,
  xp: 0,
  hearts: MAX_HEARTS,
  heartsAt: Date.now(),
  streak: 0,
  lastDay: null,
  days: {},
  lessons: {},
  stats: {},
  correctL3: 0,
  mistakes: {},
  badges: {},
  exams: [],
  newBadges: [],
}

function mistakeKey(q: Question): string {
  // generated questions are tracked by "kind of question" (generator + level), statics by id
  return q.generatorId ? `${q.generatorId}@${q.difficulty}` : q.id
}

function computeBadges(s: ProgressState): string[] {
  const done = (id: string, min = 0) => s.lessons[id]?.completed && s.lessons[id].best >= min
  const unitDone = (unitId: string, min = 0) =>
    CURRICULUM.find((u) => u.id === unitId)!.lessons.filter((l) => l.kind !== 'intro').every((l) => done(l.id, min))
  const earned: string[] = []
  if (ALL_LESSONS.some((l) => l.kind !== 'intro' && s.lessons[l.id]?.completed)) earned.push('first_lesson')
  if (unitDone('u1', 0.8)) earned.push('pyth_master')
  if (unitDone('u2', 0.8)) earned.push('ratio_queen')
  if (unitDone('u3')) earned.push('prop_bridge')
  if (unitDone('u4')) earned.push('cartographer')
  if (Object.values(s.lessons).some((l) => l.best === 1)) earned.push('perfect')
  if (s.streak >= 7) earned.push('streak7')
  if (ALL_LESSONS.filter((l) => l.kind === 'boss').every((l) => done(l.id))) earned.push('boss_slayer')
  if (s.correctL3 >= 50) earned.push('empress')
  if (s.exams.some((e) => e.score >= 85)) earned.push('mock_exam')
  return earned
}

function withBadges(s: ProgressState): Partial<ProgressState> {
  const now = Date.now()
  const earned = computeBadges(s).filter((b) => !s.badges[b])
  if (!earned.length) return {}
  return {
    badges: { ...s.badges, ...Object.fromEntries(earned.map((b) => [b, now])) },
    newBadges: [...s.newBadges, ...earned],
  }
}

function touchStreak(s: ProgressState): Partial<ProgressState> {
  const today = todayKey()
  if (s.lastDay === today) return {}
  const cont = s.lastDay && dayDiff(s.lastDay, today) === 1
  return { lastDay: today, streak: cont ? s.streak + 1 : 1 }
}

export const useStore = create<ProgressState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setLevel: (level) => set({ level }),
      set: (patch) => set(patch),
      tickHearts: () => {
        const s = get()
        if (s.hearts >= MAX_HEARTS) return set({ heartsAt: Date.now() })
        const gained = Math.floor((Date.now() - s.heartsAt) / HEART_REFILL_MS)
        if (gained > 0) {
          const hearts = Math.min(MAX_HEARTS, s.hearts + gained)
          set({ hearts, heartsAt: hearts >= MAX_HEARTS ? Date.now() : s.heartsAt + gained * HEART_REFILL_MS })
        }
      },
      spendHearts: (n) => {
        const s = get()
        set({ hearts: Math.max(0, s.hearts - n), heartsAt: s.hearts >= MAX_HEARTS ? Date.now() : s.heartsAt })
      },
      refillHearts: () => set({ hearts: MAX_HEARTS, heartsAt: Date.now() }),

      recordAnswer: (q, correct, level, xpMult) => {
        const s = get()
        const topics = q.topics.filter((t) => t !== 'combo')
        const stats = { ...s.stats }
        for (const t of topics.length ? topics : q.topics) {
          const byLevel = { ...(stats[t] ?? {}) } as Record<Level, Stat>
          const cur = byLevel[level] ?? { correct: 0, total: 0 }
          byLevel[level] = { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 }
          stats[t] = byLevel
        }
        const xp = correct ? Math.round(XP_BY_LEVEL[level] * xpMult) : 0
        const today = todayKey()
        const d = s.days[today] ?? { xp: 0, correct: 0, total: 0 }
        const days = { ...s.days, [today]: { xp: d.xp + xp, correct: d.correct + (correct ? 1 : 0), total: d.total + 1 } }

        // spaced repetition deck
        const mistakes = { ...s.mistakes }
        const key = q.reviewKey ?? mistakeKey(q)
        const existing = mistakes[key]
        if (!correct && !['match', 'order', 'fill_step'].includes(q.type)) {
          mistakes[key] = {
            key,
            questionId: q.generatorId ? undefined : q.id.replace(/-(order|fill)-\d+$/, ''),
            generatorId: q.generatorId ?? similarGenerator(q),
            topic: q.topics[0],
            level,
            due: Date.now() + INTERVALS_DAYS[0] * DAY,
            stage: 0,
            misses: (existing?.misses ?? 0) + 1,
            text: q.text,
          }
        } else if (correct && existing && q.reviewKey) {
          const stage = existing.stage + 1
          if (stage >= INTERVALS_DAYS.length) delete mistakes[key]
          else mistakes[key] = { ...existing, stage, due: Date.now() + INTERVALS_DAYS[stage] * DAY }
        }

        const next: ProgressState = {
          ...s,
          ...touchStreak(s),
          xp: s.xp + xp,
          stats,
          days,
          mistakes,
          correctL3: s.correctL3 + (correct && level === 3 ? 1 : 0),
        }
        set({ ...next, ...withBadges(next) })
        return xp
      },

      finishLesson: (lessonId, accuracy, perfect) => {
        const s = get()
        if (!lessonId) return
        const prev = s.lessons[lessonId]
        const lessons = {
          ...s.lessons,
          [lessonId]: { completed: true, best: Math.max(prev?.best ?? 0, perfect ? 1 : accuracy), times: (prev?.times ?? 0) + 1 },
        }
        const next = { ...s, lessons }
        set({ lessons, ...withBadges(next) })
      },
      finishExam: (r) => {
        const s = get()
        const next = { ...s, exams: [...s.exams, r] }
        set({ exams: next.exams, ...withBadges(next) })
        if (r.score >= 60) get().finishLesson('u5-3', r.score / 100, r.score === 100)
      },
      completeIntro: (lessonId) => {
        const s = get()
        const prev = s.lessons[lessonId]
        // watching a mini-lesson refills hearts (the brief: "או ע"י צפייה בשיעורון")
        set({ lessons: { ...s.lessons, [lessonId]: { completed: true, best: 1, times: (prev?.times ?? 0) + 1 } }, hearts: MAX_HEARTS, heartsAt: Date.now() })
      },
      clearNewBadges: () => set({ newBadges: [] }),
      reset: () => set({ ...initial, heartsAt: Date.now() }),
      importState: (imported) => set({ ...initial, ...imported }),
    }),
    {
      name: 'aviv-math-kingdom',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // functions are not persisted
        const { setLevel, set, tickHearts, spendHearts, refillHearts, recordAnswer, finishLesson, finishExam, completeIntro, clearNewBadges, reset, importState, ...data } = s
        void [setLevel, set, tickHearts, spendHearts, refillHearts, recordAnswer, finishLesson, finishExam, completeIntro, clearNewBadges, reset, importState]
        return data
      },
    },
  ),
)

/** Lesson availability: sequential within a unit, unit opens after the previous unit's last lesson. */
export function isLessonUnlocked(lessonId: string, s: ProgressState): boolean {
  if (s.unlockAll) return true
  for (let u = 0; u < CURRICULUM.length; u++) {
    const unit = CURRICULUM[u]
    const idx = unit.lessons.findIndex((l) => l.id === lessonId)
    if (idx === -1) continue
    if (idx > 0) return Boolean(s.lessons[unit.lessons[idx - 1].id]?.completed)
    if (u === 0) return true
    const prevUnit = CURRICULUM[u - 1]
    return Boolean(s.lessons[prevUnit.lessons[prevUnit.lessons.length - 1].id]?.completed)
  }
  return false
}

export const dueMistakes = (s: ProgressState) => Object.values(s.mistakes).filter((m) => m.due <= Date.now())

export function exportProgress(): string {
  const raw = localStorage.getItem('aviv-math-kingdom')
  return raw ?? '{}'
}
