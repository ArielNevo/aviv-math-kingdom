export type Level = 1 | 2 | 3
export type Topic = 'pythagoras' | 'ratio' | 'proportion' | 'scale' | 'combo'
export type MainTopic = Exclude<Topic, 'combo'>

export type QuestionType =
  | 'numeric'
  | 'mcq'
  | 'true_false'
  | 'text'
  | 'find_error'
  // extra types built on top of generators / static bank
  | 'match'
  | 'order'
  | 'fill_step'

/** A diagram attached to a question (rendered by <QuestionFigure/>). */
export type Figure =
  | { kind: 'triangle'; a: string; b: string; c: string } // legs a (bottom), b (side), hypotenuse c
  | { kind: 'rect'; w: string; h: string; d: string; square?: boolean }
  | { kind: 'rhombus'; d1: string; d2: string; side: string }
  | { kind: 'isosceles'; leg: string; base: string; h: string }
  | { kind: 'points'; ax: number; ay: number; bx: number; by: number }
  | { kind: 'ladder'; len: string; base: string; height: string; item: 'ladder' | 'kite' | 'tower' }
  | { kind: 'map'; east: string; north: string; scale: string }
  | { kind: 'parts'; parts: number[]; labels?: string[] }
  | { kind: 'shadow'; h1: string; s1: string; h2: string; s2: string }

export interface Question {
  id: string
  topics: Topic[]
  difficulty: Level
  type: QuestionType
  text: string
  answer: number | string | boolean
  exact?: string | null
  unit?: string | null
  tolerance?: number
  acceptedAnswers?: string[] | null
  options?: string[]
  correctAnswer?: number | string
  hint: string
  solutionSteps: string[]
  // ---- runtime extras ----
  /** generator that produced this (enables "try a similar one") */
  generatorId?: string
  /** came from the wordProblems list or a combo generator */
  boss?: boolean
  /** optional inverse-proportion content */
  inverse?: boolean
  figure?: Figure
  /** a formula to show big (KaTeX), e.g. "\\frac{x}{6}=\\frac{10}{15}" */
  tex?: string
  /** spaced-repetition key when served from the mistakes deck */
  reviewKey?: string
  /** raw generator parameters (used by tests) */
  params?: Record<string, number | string>
  /** match: left→right pairs (correct pairing) */
  pairs?: [string, string][]
  /** order: steps in the correct order */
  steps?: string[]
  /** fill_step: solution with one hidden step index */
  hiddenIndex?: number
}

export interface DifficultyLevel {
  level: Level
  name: string
  emoji: string
  description: string
}

export interface Unit {
  id: string
  title: string
  topic: Topic
  lessons: string[]
}

export interface LessonCard {
  title: string
  body: string
  visual: string
}

export interface Badge {
  id: string
  name: string
  condition: string
}

export interface GeneratorSpec {
  id: string
  topic: Topic
  difficulty: Level[]
  description: string
  params: string
  answer: string
  note?: string
}

export interface QuestionBank {
  meta: {
    appName: string
    student: { name: string; fullName: string; title: string; grade: string; avatarPath: string }
    difficultyLevels: DifficultyLevel[]
    difficultyMode: string[]
    units: Unit[]
    mascot: { name: string; kind: string; correct: string[]; wrong: string[]; streak: string[] }
    badges: Badge[]
  }
  lessons: Record<MainTopic, { title: string; cards: LessonCard[] }>
  questions: Question[]
  wordProblems: Question[]
  generators: GeneratorSpec[]
}
