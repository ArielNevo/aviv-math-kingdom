import bankJson from '../data/questionBank.json'
import type { Level, MainTopic, Question, QuestionBank, Topic } from './types'

export const BANK = bankJson as unknown as QuestionBank
export const META = BANK.meta

export const staticById: Record<string, Question> = Object.fromEntries(
  [...BANK.questions, ...BANK.wordProblems.map((w) => ({ ...w, boss: true }))].map((q) => [q.id, q]),
)

export type LessonKind = 'intro' | 'practice' | 'boss' | 'combo' | 'exam'

export interface LessonDef {
  id: string
  unitId: string
  title: string
  kind: LessonKind
  generators?: string[]
  staticIds?: string[]
  /** include word problems whose topics contain this topic (boss lessons) */
  wordTopic?: MainTopic
  /** unit 5 levels are fixed regardless of the chosen level */
  fixedLevel?: Level
  /** lesson content is optional "inverse proportion" */
  inverseGens?: string[]
}

export interface UnitDef {
  id: string
  title: string
  topic: Topic
  emoji: string
  art: string
  color: string
  lessons: LessonDef[]
}

const L = (unitId: string, n: number, title: string, kind: LessonKind, rest: Partial<LessonDef> = {}): LessonDef => ({
  id: `${unitId}-${n}`,
  unitId,
  title,
  kind,
  ...rest,
})

export const CURRICULUM: UnitDef[] = [
  {
    id: 'u1',
    title: META.units[0].title,
    topic: 'pythagoras',
    emoji: '📐',
    art: 'castle-pythagoras',
    color: '#7c3aed',
    lessons: [
      L('u1', 0, 'שיעורון', 'intro'),
      L('u1', 1, 'יתר', 'practice', { generators: ['pyth_hyp_triple', 'pyth_hyp_irrational'], staticIds: ['p01', 'p02', 'p03', 'p08', 'p19'] }),
      L('u1', 2, 'ניצב', 'practice', { generators: ['pyth_leg_triple'], staticIds: ['p04', 'p05', 'p14', 'p20'] }),
      L('u1', 3, 'המשפט ההפוך', 'practice', { generators: ['pyth_is_right'], staticIds: ['p06', 'p07', 'p25'] }),
      L('u1', 4, 'צורות מתחבאות', 'practice', {
        generators: ['pyth_rect_diagonal', 'pyth_isosceles_height', 'pyth_rhombus_side'],
        staticIds: ['p09', 'p10', 'p11', 'p12', 'p16', 'p21', 'p23', 'p24'],
      }),
      L('u1', 5, 'מרחק בין נקודות', 'practice', { generators: ['pyth_distance_points'], staticIds: ['p17', 'p18'] }),
      L('u1', 6, 'בוס: בעיות מהחיים', 'boss', { generators: ['pyth_ladder_kite'], staticIds: ['p13', 'p15', 'p22'], wordTopic: 'pythagoras' }),
    ],
  },
  {
    id: 'u2',
    title: META.units[1].title,
    topic: 'ratio',
    emoji: '⚖️',
    art: 'castle-ratio',
    color: '#db2777',
    lessons: [
      L('u2', 0, 'שיעורון', 'intro'),
      L('u2', 1, 'צמצום יחסים', 'practice', { generators: ['ratio_simplify'], staticIds: ['r01', 'r02', 'r03', 'r05', 'r07', 'r17'] }),
      L('u2', 2, 'חלוקה לפי יחס', 'practice', { generators: ['ratio_divide_total'], staticIds: ['r04', 'r08', 'r09', 'r18', 'r19', 'r20'] }),
      L('u2', 3, 'חלק אחד נתון', 'practice', { generators: ['ratio_given_one', 'ratio_given_diff'], staticIds: ['r06', 'r10', 'r11', 'r12'] }),
      L('u2', 4, 'יחס משולש', 'practice', { generators: ['ratio_chain'], staticIds: ['r13'] }),
      L('u2', 5, 'יחס שמשתנה', 'practice', { generators: ['ratio_change', 'ratio_perimeter_rect'], staticIds: ['r14', 'r15', 'r16'] }),
      L('u2', 6, 'בוס: יחס + פיתגורס', 'boss', { generators: ['combo_ratio_pyth'], wordTopic: 'ratio' }),
    ],
  },
  {
    id: 'u3',
    title: META.units[2].title,
    topic: 'proportion',
    emoji: '🌉',
    art: 'bridge-proportion',
    color: '#0e7490',
    lessons: [
      L('u3', 0, 'שיעורון', 'intro'),
      L('u3', 1, 'הכפלה צולבת', 'practice', { generators: ['prop_solve_x'], staticIds: ['pr01', 'pr02', 'pr06', 'pr08'] }),
      L('u3', 2, 'מחיר, מהירות, מתכון', 'practice', { generators: ['prop_unit_price'], staticIds: ['pr03', 'pr04', 'pr05', 'pr07', 'pr09', 'pr10', 'pr13', 'pr14', 'pr20'] }),
      L('u3', 3, 'צל וגובה', 'practice', { generators: ['prop_shadow'], staticIds: ['pr11', 'pr12'] }),
      L('u3', 4, 'פרופורציה עם x', 'practice', {
        generators: ['prop_solve_x'],
        staticIds: ['pr15', 'pr16', 'pr19', 'pr17', 'pr18'],
        inverseGens: ['prop_inverse'],
      }),
      L('u3', 5, 'בוס: פרופורציה + יחס', 'boss', { generators: ['combo_ratio_prop_money'], wordTopic: 'proportion' }),
    ],
  },
  {
    id: 'u4',
    title: META.units[3].title,
    topic: 'scale',
    emoji: '🗺️',
    art: 'map-scale',
    color: '#b45309',
    lessons: [
      L('u4', 0, 'שיעורון', 'intro'),
      L('u4', 1, 'ממפה למציאות', 'practice', { generators: ['scale_map_to_real'], staticIds: ['s01', 's02', 's03', 's07', 's08', 's10', 's13', 's20'] }),
      L('u4', 2, 'ממציאות למפה', 'practice', { generators: ['scale_real_to_map'], staticIds: ['s04', 's09', 's12', 's19'] }),
      L('u4', 3, 'מציאת קנה מידה', 'practice', { generators: ['scale_find'], staticIds: ['s05', 's06', 's14'] }),
      L('u4', 4, 'שטח בקנה מידה', 'practice', { generators: ['scale_area', 'scale_between_maps'], staticIds: ['s11', 's15', 's16', 's17', 's18'] }),
      L('u4', 5, 'בוס: מפה + פיתגורס', 'boss', { generators: ['combo_map_pyth', 'combo_scale_shadow'], wordTopic: 'scale' }),
    ],
  },
  {
    id: 'u5',
    title: META.units[4].title,
    topic: 'combo',
    emoji: '🏰',
    art: 'tower-final',
    color: '#4c1d95',
    lessons: [
      L('u5', 0, 'רמה 1', 'combo', { fixedLevel: 1, generators: ['combo_map_pyth', 'combo_ratio_prop_money'] }),
      L('u5', 1, 'רמה 2', 'combo', { fixedLevel: 2, generators: ['combo_map_pyth', 'combo_ratio_pyth', 'combo_scale_shadow', 'combo_ratio_prop_money'] }),
      L('u5', 2, 'רמה 3', 'combo', { fixedLevel: 3, generators: ['combo_map_pyth', 'combo_ratio_pyth', 'combo_scale_shadow'] }),
      L('u5', 3, 'בוס סופי: מבחן מדומה', 'exam'),
    ],
  },
]

export const ALL_LESSONS = CURRICULUM.flatMap((u) => u.lessons)
export const lessonById: Record<string, LessonDef> = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]))
export const unitById: Record<string, UnitDef> = Object.fromEntries(CURRICULUM.map((u) => [u.id, u]))

/** Which generator makes "a similar one" for a static question. */
export function similarGenerator(q: Question): string | undefined {
  if (q.generatorId) return q.generatorId
  for (const lesson of ALL_LESSONS) {
    if (lesson.staticIds?.includes(q.id) && lesson.generators?.length) {
      if (q.id === 'pr17' || q.id === 'pr18') return 'prop_inverse'
      return lesson.generators[0]
    }
  }
  const t = new Set(q.topics)
  if (t.has('scale') && t.has('pythagoras')) return 'combo_map_pyth'
  if (t.has('ratio') && t.has('pythagoras')) return 'combo_ratio_pyth'
  if (t.has('proportion') && t.has('pythagoras')) return 'combo_scale_shadow'
  if (t.has('ratio') || t.has('proportion')) return 'combo_ratio_prop_money'
  return undefined
}

export const TOPIC_NAMES: Record<Topic, string> = {
  pythagoras: 'פיתגורס',
  ratio: 'יחס',
  proportion: 'פרופורציה',
  scale: 'קנה מידה',
  combo: 'משולבות',
}
export const MAIN_TOPICS: MainTopic[] = ['pythagoras', 'ratio', 'proportion', 'scale']
