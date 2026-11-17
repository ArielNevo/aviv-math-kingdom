import type { Level, Question, Topic } from './types'
import {
  type Rng,
  PYTH_TRIPLES,
  SCALES,
  fmt,
  fmtSep,
  gcd,
  gcdAll,
  isPerfectSquare,
  lcm,
  pick,
  randInt,
  round,
  scaleText,
  shuffle,
  sqrtText,
} from './math'

export interface Generator {
  id: string
  topic: Topic
  levels: Level[]
  inverse?: boolean
  make: (level: Level, rng: Rng) => Question
}

let counter = 0
const uid = (id: string) => `${id}#${++counter}`

const CM = 'ס"מ'
const M = "מ'"
const KM = 'ק"מ'
const NIS = 'ש"ח'

function base(
  gen: string,
  topic: Topic | Topic[],
  level: Level,
  partial: Omit<Question, 'id' | 'topics' | 'difficulty' | 'generatorId'>,
): Question {
  return {
    id: uid(gen),
    topics: Array.isArray(topic) ? topic : [topic],
    difficulty: level,
    generatorId: gen,
    tolerance: 0.05,
    ...partial,
  }
}

/** Pick a Pythagorean triple and multiplier, legs randomly ordered. */
function triple(rng: Rng, opts: { maxIdx?: number; kMax?: number; kMin?: number } = {}) {
  const t = pick(rng, PYTH_TRIPLES.slice(0, opts.maxIdx ?? PYTH_TRIPLES.length))
  const k = randInt(rng, opts.kMin ?? 1, opts.kMax ?? 5)
  const swap = rng() < 0.5
  const [a, b] = swap ? [t[1], t[0]] : [t[0], t[1]]
  return { a: a * k, b: b * k, c: t[2] * k, k, base: t }
}

const sq = (x: number) => x * x

// =====================================================================
// PYTHAGORAS
// =====================================================================

const pythHypTriple: Generator = {
  id: 'pyth_hyp_triple',
  topic: 'pythagoras',
  levels: [1, 2],
  make(level, rng) {
    const { a, b, c } = level === 1 ? triple(rng, { maxIdx: 4, kMax: 3 }) : triple(rng, { kMax: 5 })
    const unit = pick(rng, [CM, M])
    const text = pick(rng, [
      `במשולש ישר-זווית אורכי הניצבים הם ${a} ${unit} ו-${b} ${unit}. מצאי את אורך היתר.`,
      `ניצבי משולש ישר-זווית הם ${a} ו-${b} (${unit}). מהו אורך היתר?`,
      `מצאי את היתר במשולש ישר-זווית שניצביו ${a} ${unit} ו-${b} ${unit}.`,
    ])
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text,
      answer: c,
      unit,
      figure: { kind: 'triangle', a: String(a), b: String(b), c: '?' },
      hint: 'היתר מול הזווית הישרה. ריבוע היתר = סכום ריבועי הניצבים.',
      solutionSteps: [`c² = ${a}² + ${b}² = ${sq(a)} + ${sq(b)} = ${sq(c)}`, `c = √${sq(c)} = ${c} ${unit}`],
      params: { a, b, c },
    })
  },
}

const pythLegTriple: Generator = {
  id: 'pyth_leg_triple',
  topic: 'pythagoras',
  levels: [1, 2],
  make(level, rng) {
    const { a, b, c } = level === 1 ? triple(rng, { maxIdx: 4, kMax: 3 }) : triple(rng, { kMax: 5 })
    const unit = pick(rng, [CM, M])
    const text = pick(rng, [
      `במשולש ישר-זווית היתר הוא ${c} ${unit} ואחד הניצבים ${a} ${unit}. מצאי את הניצב השני.`,
      `היתר ${c} ${unit}, ניצב אחד ${a} ${unit}. מהו אורך הניצב השני?`,
    ])
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text,
      answer: b,
      unit,
      figure: { kind: 'triangle', a: String(a), b: '?', c: String(c) },
      hint: 'מחפשים ניצב? מחסרים: ניצב² = יתר² − ניצב².',
      solutionSteps: [`b² = ${c}² − ${a}² = ${sq(c)} − ${sq(a)} = ${sq(b)}`, `b = √${sq(b)} = ${b} ${unit}`],
      params: { a, b, c },
    })
  },
}

const pythHypIrrational: Generator = {
  id: 'pyth_hyp_irrational',
  topic: 'pythagoras',
  levels: [2, 3],
  make(level, rng) {
    const findLeg = level === 3 && rng() < 0.5
    if (findLeg) {
      let c = 0,
        a = 0,
        n = 0
      do {
        c = randInt(rng, 5, 15)
        a = randInt(rng, 1, c - 1)
        n = sq(c) - sq(a)
      } while (isPerfectSquare(n))
      const ans = round(Math.sqrt(n), 2)
      return base(this.id, 'pythagoras', level, {
        type: 'numeric',
        text: `במשולש ישר-זווית היתר ${c} ס"מ ואחד הניצבים ${a} ס"מ. מצאי את הניצב השני (עגלי לשתי ספרות אחרי הנקודה, או כתבי בצורת שורש).`,
        answer: ans,
        exact: sqrtText(n),
        unit: CM,
        figure: { kind: 'triangle', a: String(a), b: '?', c: String(c) },
        hint: 'ניצב² = יתר² − ניצב². אם התוצאה לא ריבוע שלם — השאירי שורש.',
        solutionSteps: [
          `b² = ${c}² − ${a}² = ${sq(c)} − ${sq(a)} = ${n}`,
          `b = √${n}${sqrtText(n) !== '√' + n ? ' = ' + sqrtText(n) : ''} ≈ ${ans} ס"מ`,
        ],
        params: { a, c, n },
      })
    }
    let a = 0,
      b = 0,
      n = 0
    do {
      a = randInt(rng, 1, 12)
      b = randInt(rng, 1, 12)
      n = sq(a) + sq(b)
    } while (isPerfectSquare(n))
    const ans = round(Math.sqrt(n), 2)
    const ex = sqrtText(n)
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `ניצבי משולש ישר-זווית הם ${a} ו-${b}. מצאי את היתר (עגלי לשתי ספרות אחרי הנקודה, או כתבי בצורת שורש).`,
      answer: ans,
      exact: ex,
      unit: '',
      figure: { kind: 'triangle', a: String(a), b: String(b), c: '?' },
      hint: 'לא כל תשובה היא מספר שלם! חשבי c² ואז הוציאי שורש.',
      solutionSteps: [`c² = ${a}² + ${b}² = ${sq(a)} + ${sq(b)} = ${n}`, `c = √${n}${ex !== '√' + n ? ' = ' + ex : ''} ≈ ${ans}`],
      params: { a, b, n },
    })
  },
}

const pythIsRight: Generator = {
  id: 'pyth_is_right',
  topic: 'pythagoras',
  levels: [1, 2],
  make(level, rng) {
    const { a, b, c } = triple(rng, { maxIdx: level === 1 ? 4 : 6, kMax: level === 1 ? 3 : 4 })
    const real = rng() < 0.5
    const cc = real ? c : c + (rng() < 0.5 ? 1 : -1)
    const sides = [a, b, cc]
    const shown = level === 2 ? shuffle(rng, sides) : [...sides].sort((x, y) => x - y)
    const sorted = [...sides].sort((x, y) => x - y)
    const [s1, s2, s3] = sorted
    const isRight = sq(s1) + sq(s2) === sq(s3)
    return base(this.id, 'pythagoras', level, {
      type: 'true_false',
      text: `משולש שצלעותיו ${shown.join(', ')} הוא משולש ישר-זווית.`,
      answer: isRight,
      hint: 'המשפט ההפוך: בדקי אם ריבוע הצלע הגדולה שווה לסכום ריבועי השתיים האחרות.',
      solutionSteps: [
        `הצלע הגדולה: ${s3}. ${s3}² = ${sq(s3)}`,
        `${s1}² + ${s2}² = ${sq(s1)} + ${sq(s2)} = ${sq(s1) + sq(s2)}`,
        isRight ? `שווה ✓ → המשולש ישר-זווית` : `${sq(s1) + sq(s2)} ≠ ${sq(s3)} → לא ישר-זווית`,
      ],
      params: { s1, s2, s3 },
    })
  },
}

const pythRectDiagonal: Generator = {
  id: 'pyth_rect_diagonal',
  topic: 'pythagoras',
  levels: [2],
  make(level, rng) {
    if (rng() < 0.35) {
      const s = randInt(rng, 2, 12)
      const ans = round(s * Math.SQRT2, 2)
      return base(this.id, 'pythagoras', level, {
        type: 'numeric',
        text: `צלע ריבוע היא ${s} ס"מ. מצאי את אורך האלכסון (עגלי לשתי ספרות, או כתבי בצורת שורש).`,
        answer: ans,
        exact: `${s}√2`,
        unit: CM,
        figure: { kind: 'rect', w: String(s), h: String(s), d: '?', square: true },
        hint: 'האלכסון מחלק את הריבוע לשני משולשים ישרי-זווית שהניצבים שלהם הם צלעות הריבוע.',
        solutionSteps: [`d² = ${s}² + ${s}² = ${2 * s * s}`, `d = √${2 * s * s} = ${s}√2 ≈ ${ans} ס"מ`],
        params: { w: s, h: s },
      })
    }
    const { a, b, c } = triple(rng, { maxIdx: 4, kMax: 4 })
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `אורך מלבן ${Math.max(a, b)} ס"מ ורוחבו ${Math.min(a, b)} ס"מ. מצאי את אורך האלכסון.`,
      answer: c,
      unit: CM,
      figure: { kind: 'rect', w: String(Math.max(a, b)), h: String(Math.min(a, b)), d: '?' },
      hint: 'האלכסון הוא יתר במשולש שהניצבים שלו הם האורך והרוחב.',
      solutionSteps: [`d² = ${a}² + ${b}² = ${sq(a)} + ${sq(b)} = ${sq(c)}`, `d = ${c} ס"מ`],
      params: { w: a, h: b },
    })
  },
}

const pythIsoscelesHeight: Generator = {
  id: 'pyth_isosceles_height',
  topic: 'pythagoras',
  levels: [2],
  make(level, rng) {
    const { a, b, c } = triple(rng, { maxIdx: 4, kMax: 3 })
    const baseLen = 2 * a
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `במשולש שווה-שוקיים אורך השוק ${c} ס"מ והבסיס ${baseLen} ס"מ. מצאי את הגובה לבסיס.`,
      answer: b,
      unit: CM,
      figure: { kind: 'isosceles', leg: String(c), base: String(baseLen), h: '?' },
      hint: 'הגובה במשולש שווה-שוקיים חוצה את הבסיס! כך נוצר משולש ישר-זווית עם חצי בסיס.',
      solutionSteps: [`חצי בסיס: ${baseLen} ÷ 2 = ${a}`, `h² = ${c}² − ${a}² = ${sq(c)} − ${sq(a)} = ${sq(b)}`, `h = ${b} ס"מ`],
      params: { leg: c, base: baseLen },
    })
  },
}

const pythRhombusSide: Generator = {
  id: 'pyth_rhombus_side',
  topic: 'pythagoras',
  levels: [2],
  make(level, rng) {
    const { a, b, c } = triple(rng, { maxIdx: 4, kMax: 3 })
    const d1 = 2 * a,
      d2 = 2 * b
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `אלכסוני מעוין הם ${d1} ס"מ ו-${d2} ס"מ. מצאי את אורך צלע המעוין.`,
      answer: c,
      unit: CM,
      figure: { kind: 'rhombus', d1: String(d1), d2: String(d2), side: '?' },
      hint: 'אלכסוני מעוין מאונכים וחוצים זה את זה — חצאי האלכסונים הם ניצבים.',
      solutionSteps: [`חצאי האלכסונים: ${a} ו-${b}`, `צלע² = ${a}² + ${b}² = ${sq(a)} + ${sq(b)} = ${sq(c)}`, `צלע = ${c} ס"מ`],
      params: { d1, d2 },
    })
  },
}

const pythDistancePoints: Generator = {
  id: 'pyth_distance_points',
  topic: 'pythagoras',
  levels: [3],
  make(level, rng) {
    const { a, b, c } = triple(rng, { maxIdx: 3, kMax: 2 })
    const ax = randInt(rng, -10, 10),
      ay = randInt(rng, -10, 10)
    const bx = ax + (rng() < 0.5 ? a : -a)
    const by = ay + (rng() < 0.5 ? b : -b)
    const p = (x: number) => (x < 0 ? '−' + Math.abs(x) : String(x))
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `מצאי את המרחק בין הנקודות A(${p(ax)}, ${p(ay)}) ו-B(${p(bx)}, ${p(by)}) במערכת צירים.`,
      answer: c,
      unit: '',
      figure: { kind: 'points', ax, ay, bx, by },
      hint: 'Δx ו-Δy הם הניצבים, והמרחק הוא היתר.',
      solutionSteps: [
        `Δx = |${p(bx)} − (${p(ax)})| = ${a},  Δy = |${p(by)} − (${p(ay)})| = ${b}`,
        `d² = ${a}² + ${b}² = ${sq(a)} + ${sq(b)} = ${sq(c)}`,
        `d = ${c}`,
      ],
      params: { ax, ay, bx, by },
    })
  },
}

const pythLadderKite: Generator = {
  id: 'pyth_ladder_kite',
  topic: 'pythagoras',
  levels: [2, 3],
  make(level, rng) {
    // level 3 uses decimals (triple × 0.5 or × 1.5)
    const t = pick(rng, PYTH_TRIPLES.slice(0, 4))
    const k = level === 3 ? pick(rng, [0.5, 1.5, 2.5]) : randInt(rng, 1, 3)
    const [x, y, z] = [t[0] * k, t[1] * k, t[2] * k].map((v) => round(v, 2))
    const kind = pick(rng, ['ladder', 'kite', 'tower'] as const)
    if (kind === 'ladder') {
      // base distance = smaller leg, height = bigger leg
      const [d, h] = [Math.min(x, y), Math.max(x, y)]
      return base(this.id, 'pythagoras', level, {
        type: 'numeric',
        text: `סולם באורך ${fmt(z)} מ' נשען על קיר. בסיס הסולם במרחק ${fmt(d)} מ' מהקיר. לאיזה גובה מגיע הסולם?`,
        answer: h,
        unit: M,
        figure: { kind: 'ladder', len: fmt(z), base: fmt(d), height: '?', item: 'ladder' },
        hint: 'הסולם הוא היתר, הקיר והרצפה הם הניצבים.',
        solutionSteps: [`h² = ${fmt(z)}² − ${fmt(d)}² = ${fmt(z * z)} − ${fmt(d * d)} = ${fmt(h * h)}`, `h = ${fmt(h)} מ'`],
        params: { hyp: z, leg: d },
      })
    }
    if (kind === 'kite') {
      const [d, h] = [Math.min(x, y), Math.max(x, y)]
      return base(this.id, 'pythagoras', level, {
        type: 'numeric',
        text: `חוט עפיפון באורך ${fmt(z)} מ' מתוח ישר. העפיפון נמצא ${fmt(d)} מ' אופקית מאביב. באיזה גובה העפיפון (מעל ידה של אביב)?`,
        answer: h,
        unit: M,
        figure: { kind: 'ladder', len: fmt(z), base: fmt(d), height: '?', item: 'kite' },
        hint: 'החוט הוא היתר.',
        solutionSteps: [`h² = ${fmt(z)}² − ${fmt(d)}² = ${fmt(z * z)} − ${fmt(d * d)} = ${fmt(h * h)}`, `h = ${fmt(h)} מ'`],
        params: { hyp: z, leg: d },
      })
    }
    return base(this.id, 'pythagoras', level, {
      type: 'numeric',
      text: `מגדל בגובה ${fmt(x)} מ' מטיל צל באורך ${fmt(y)} מ'. מה המרחק מראש המגדל לקצה הצל?`,
      answer: z,
      unit: M,
      figure: { kind: 'ladder', len: '?', base: fmt(y), height: fmt(x), item: 'tower' },
      hint: 'המגדל והצל הם הניצבים; המרחק המבוקש הוא היתר.',
      solutionSteps: [`d² = ${fmt(x)}² + ${fmt(y)}² = ${fmt(x * x)} + ${fmt(y * y)} = ${fmt(z * z)}`, `d = ${fmt(z)} מ'`],
      params: { leg1: x, leg2: y },
    })
  },
}

// =====================================================================
// RATIO
// =====================================================================

function coprimePair(rng: Rng, max = 9, distinct = true): [number, number] {
  let a = 0,
    b = 0
  do {
    a = randInt(rng, 1, max)
    b = randInt(rng, 1, max)
  } while (gcd(a, b) !== 1 || (distinct && a === b))
  return [a, b]
}

const ratioAccepted = (...xs: number[]) => [xs.join(':'), xs.join(' : '), ...(xs.length === 2 ? [xs.join('/')] : [])]

const ratioSimplify: Generator = {
  id: 'ratio_simplify',
  topic: 'ratio',
  levels: [1],
  make(level, rng) {
    const [a, b] = coprimePair(rng)
    const f = randInt(rng, 2, 12)
    const A = a * f,
      B = b * f
    const ctx = pick(rng, [
      `צמצמי את היחס ${A}:${B}.`,
      `בשקית ${A} סוכריות תות ו-${B} סוכריות לימון. כתבי את היחס תות:לימון בצורה מצומצמת.`,
      `בחוג ${A} בנות ו-${B} בנים. מהו היחס בין הבנות לבנים, בצורה מצומצמת?`,
      `במתכון ${A} גרם שוקולד ו-${B} גרם חמאה. כתבי את היחס שוקולד:חמאה בצורה מצומצמת.`,
    ])
    return base(this.id, 'ratio', level, {
      type: 'text',
      text: ctx,
      answer: `${a}:${b}`,
      acceptedAnswers: ratioAccepted(a, b),
      hint: 'חלקי את שני המספרים במחלק המשותף הגדול ביותר.',
      solutionSteps: [`${A}:${B} — שניהם מתחלקים ב-${f}`, `${A} ÷ ${f} = ${a},  ${B} ÷ ${f} = ${b}`, `היחס המצומצם: ${a}:${b}`],
      params: { A, B },
    })
  },
}

const ratioDivideTotal: Generator = {
  id: 'ratio_divide_total',
  topic: 'ratio',
  levels: [1, 2],
  make(level, rng) {
    const three = level === 2
    let parts: number[]
    do {
      parts = three ? [randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9)] : [randInt(rng, 1, 9), randInt(rng, 1, 9)]
    } while (new Set(parts).size !== parts.length || gcdAll(parts) !== 1)
    const sum = parts.reduce((s, x) => s + x, 0)
    const m = level === 1 ? randInt(rng, 2, 20) : randInt(rng, 10, 60)
    const total = sum * m
    const sorted = [...parts].sort((x, y) => x - y)
    const which = three ? pick(rng, ['big', 'small', 'mid'] as const) : pick(rng, ['big', 'small'] as const)
    const target = which === 'big' ? sorted[sorted.length - 1] : which === 'small' ? sorted[0] : sorted[1]
    const who = which === 'big' ? 'הכי הרבה' : which === 'small' ? 'הכי מעט' : 'את הסכום האמצעי'
    const ratio = parts.join(':')
    const names = three ? 'שלושה חברים' : 'שתי אחיות'
    const thing = pick(rng, [
      { what: `${total} ש"ח`, unit: NIS, verb: 'מחולקים' },
      { what: `${total} סוכריות`, unit: 'סוכריות', verb: 'מחולקות' },
      { what: `${total} מדבקות`, unit: 'מדבקות', verb: 'מחולקות' },
    ])
    return base(this.id, 'ratio', level, {
      type: 'numeric',
      text: `${thing.what} ${thing.verb} בין ${names} ביחס ${ratio}. כמה מקבל/ת מי שמקבל/ת ${who}?`,
      answer: target * m,
      unit: thing.unit,
      figure: { kind: 'parts', parts },
      hint: 'שיטת החלקים: סכמי את החלקים, מצאי כמה שווה חלק אחד, והכפילי.',
      solutionSteps: [
        `סכום החלקים: ${parts.join(' + ')} = ${sum}`,
        `חלק אחד: ${total} ÷ ${sum} = ${m}`,
        `${target} × ${m} = ${target * m}`,
      ],
      params: { total, target, sum },
    })
  },
}

const ratioGivenOne: Generator = {
  id: 'ratio_given_one',
  topic: 'ratio',
  levels: [2],
  make(level, rng) {
    const [a, b] = coprimePair(rng)
    const k = randInt(rng, 2, 15)
    const ctx = pick(rng, [
      { t: `היחס בין בנים לבנות בחוג הוא ${a}:${b}. יש ${a * k} בנים. כמה בנות יש?`, u: 'בנות' },
      { t: `במתכון היחס סוכר:קמח הוא ${a}:${b}. השתמשו ב-${a * k * 10} גרם סוכר. כמה גרם קמח צריך?`, u: 'גרם', mul: 10 },
      { t: `היחס בין שני מספרים הוא ${a}:${b}. המספר הראשון הוא ${a * k}. מהו המספר השני?`, u: '' },
    ])
    const mul = ctx.mul ?? 1
    const given = a * k * mul,
      ans = b * k * mul
    return base(this.id, 'ratio', level, {
      type: 'numeric',
      text: ctx.t,
      answer: ans,
      unit: ctx.u,
      hint: 'כמה שווה חלק אחד? חלקי את הנתון במספר החלקים שלו.',
      solutionSteps: [`${a} חלקים = ${given} → חלק אחד = ${given / a}`, `${b} חלקים = ${b} × ${given / a} = ${ans}`],
      params: { a, b, given },
    })
  },
}

const ratioGivenDiff: Generator = {
  id: 'ratio_given_diff',
  topic: 'ratio',
  levels: [2],
  make(level, rng) {
    let [a, b] = coprimePair(rng)
    if (a < b) [a, b] = [b, a]
    const k = randInt(rng, 2, 12)
    const diff = (a - b) * k
    const askBig = rng() < 0.6
    const ans = askBig ? a * k : b * k
    return base(this.id, 'ratio', level, {
      type: 'numeric',
      text: `שתי כמויות נמצאות ביחס ${a}:${b}, וההפרש ביניהן ${diff}. מהי הכמות ה${askBig ? 'גדולה' : 'קטנה'}?`,
      answer: ans,
      unit: '',
      hint: 'ההפרש שווה להפרש החלקים. כמה חלקים זה?',
      solutionSteps: [`הפרש החלקים: ${a} − ${b} = ${a - b}`, `${a - b} חלקים = ${diff} → חלק = ${k}`, `${askBig ? a : b} × ${k} = ${ans}`],
      params: { a, b, diff, askBig: askBig ? 1 : 0 },
    })
  },
}

const ratioChain: Generator = {
  id: 'ratio_chain',
  topic: 'ratio',
  levels: [2, 3],
  make(level, rng) {
    let a: number, b: number, b2: number, c: number, L: number
    do {
      ;[a, b] = coprimePair(rng, level === 2 ? 6 : 9)
      ;[b2, c] = coprimePair(rng, level === 2 ? 6 : 9)
      L = lcm(b, b2)
    } while (b === b2 || L > 60)
    const raw = [(a * L) / b, L, (c * L) / b2]
    const g = gcdAll(raw)
    const res = raw.map((x) => x / g)
    return base(this.id, 'ratio', level, {
      type: 'text',
      text: `נתון a:b = ${a}:${b} ו-b:c = ${b2}:${c}. מצאי את היחס a:b:c (בצורה מצומצמת).`,
      answer: res.join(':'),
      acceptedAnswers: ratioAccepted(...res),
      hint: `צריך ש-b יהיה אותו מספר בשני היחסים. מה הכפולה המשותפת הקטנה של ${b} ו-${b2}?`,
      solutionSteps: [
        `כפולה משותפת של ${b} ו-${b2}: ${L}`,
        `a:b = ${a}:${b} = ${raw[0]}:${L}`,
        `b:c = ${b2}:${c} = ${L}:${raw[2]}`,
        `a:b:c = ${raw.join(':')}${g > 1 ? ' = ' + res.join(':') : ''}`,
      ],
      params: { a, b, b2, c },
    })
  },
}

const ratioChange: Generator = {
  id: 'ratio_change',
  topic: 'ratio',
  levels: [3],
  make(level, rng) {
    // build backwards: counts p·x and q·x, add d to the first group, new ratio r:s
    for (;;) {
      const [p, q] = coprimePair(rng, 7)
      const x = randInt(rng, 2, 10)
      const d = randInt(rng, 1, 12)
      const add = rng() < 0.65
      const n1 = p * x + (add ? d : -d)
      const n2 = q * x
      if (n1 <= 0) continue
      const g = gcd(n1, n2)
      const r = n1 / g,
        s = n2 / g
      if (r > 12 || s > 12 || r * q === s * p) continue
      const ctx = pick(rng, [
        { g1: 'בנים', g2: 'בנות', act: add ? `הצטרפו ${d} בנים` : `${d} בנים עברו לכיתה אחרת`, where: 'בכיתה' },
        { g1: 'כדורים אדומים', g2: 'כדורים כחולים', act: add ? `הוסיפו ${d} כדורים אדומים` : `הוציאו ${d} כדורים אדומים`, where: 'בקופסה' },
      ])
      const askFirst = rng() < 0.5
      const ans = askFirst ? p * x : q * x
      return base(this.id, 'ratio', level, {
        type: 'numeric',
        text: `היחס בין ה${ctx.g1} ל${ctx.g2} ${ctx.where} היה ${p}:${q}. ${ctx.act} והיחס הפך ל-${r}:${s}. ${
          askFirst ? `כמה ${ctx.g1} היו בהתחלה?` : `כמה ${ctx.g2} יש?`
        }`,
        answer: ans,
        unit: '',
        hint: `סמני: ${ctx.g1} = ${p}x, ${ctx.g2} = ${q}x. כתבי פרופורציה עם המצב החדש.`,
        solutionSteps: [
          `${ctx.g1}: ${p}x, ${ctx.g2}: ${q}x`,
          `(${p}x ${add ? '+' : '−'} ${d}) / ${q}x = ${r}/${s}`,
          `${s}(${p}x ${add ? '+' : '−'} ${d}) = ${r}·${q}x → ${s * p}x ${add ? '+' : '−'} ${s * d} = ${r * q}x`,
          `x = ${x}`,
          `${askFirst ? ctx.g1 + ' בהתחלה' : ctx.g2}: ${askFirst ? p : q} × ${x} = ${ans}`,
        ],
        params: { p, q, d: add ? d : -d, r, s, askFirst: askFirst ? 1 : 0 },
      })
    }
  },
}

const ratioPerimeterRect: Generator = {
  id: 'ratio_perimeter_rect',
  topic: 'ratio',
  levels: [2],
  make(level, rng) {
    let [a, b] = coprimePair(rng, 7)
    if (a < b) [a, b] = [b, a]
    const x = randInt(rng, 2, 8)
    const P = 2 * (a + b) * x
    const area = a * b * x * x
    return base(this.id, 'ratio', level, {
      type: 'numeric',
      text: `אורך מלבן ורוחבו ביחס ${a}:${b}, והיקפו ${P} ס"מ. מצאי את שטח המלבן.`,
      answer: area,
      unit: 'סמ"ר',
      hint: `אורך = ${a}x, רוחב = ${b}x. ההיקף הוא פעמיים (אורך + רוחב).`,
      solutionSteps: [
        `2(${a}x + ${b}x) = ${P} → ${2 * (a + b)}x = ${P} → x = ${x}`,
        `אורך = ${a * x}, רוחב = ${b * x}`,
        `שטח = ${a * x} × ${b * x} = ${area} סמ"ר`,
      ],
      params: { a, b, P },
    })
  },
}

// =====================================================================
// PROPORTION
// =====================================================================

const frac = (n: string | number, d: string | number) => `\\frac{${n}}{${d}}`

const propSolveX: Generator = {
  id: 'prop_solve_x',
  topic: 'proportion',
  levels: [1, 2, 3],
  make(level, rng) {
    if (level === 3) {
      if (rng() < 0.5) {
        // (x + k)/b = c/d
        const x = randInt(rng, 1, 12)
        const k = randInt(rng, 1, 6) * (rng() < 0.7 ? 1 : -1)
        const N = x + k
        if (N <= 0) return this.make(level, rng)
        const b = randInt(rng, 2, 10)
        const g = gcd(N, b)
        let t = randInt(rng, 1, 3)
        if (t === g) t++
        const c = (N / g) * t,
          d = (b / g) * t
        const ks = k > 0 ? `+ ${k}` : `− ${-k}`
        return base(this.id, 'proportion', level, {
          type: 'numeric',
          text: `פתרי: (x ${ks})/${b} = ${c}/${d}`,
          tex: `${frac(`x ${ks.replace('−', '-')}`, b)} = ${frac(c, d)}`,
          answer: x,
          unit: '',
          hint: 'הכפלה צולבת: המכפלות באלכסון שוות.',
          solutionSteps: [`${d}(x ${ks}) = ${b} × ${c}`, `${d}x ${k > 0 ? '+' : '−'} ${d * Math.abs(k)} = ${b * c}`, `${d}x = ${b * c - d * k}`, `x = ${x}`],
          params: { form: 1, k, b, c, d },
        })
      }
      // x/(x + k) = c/d  → x = ck/(d − c)
      for (;;) {
        const x = randInt(rng, 2, 15)
        const k = randInt(rng, 1, 9)
        const g = gcd(x, x + k)
        const c = x / g,
          d = (x + k) / g
        if (d > 15) continue
        return base(this.id, 'proportion', level, {
          type: 'numeric',
          text: `פתרי: x/(x + ${k}) = ${c}/${d}`,
          tex: `${frac('x', `x + ${k}`)} = ${frac(c, d)}`,
          answer: x,
          unit: '',
          hint: 'הכפלה צולבת, ואז אספי את ה-x לצד אחד.',
          solutionSteps: [`${d}x = ${c}(x + ${k})`, `${d}x = ${c}x + ${c * k}`, `${d - c}x = ${c * k}`, `x = ${x}`],
          params: { form: 2, k, c, d },
        })
      }
    }
    // a/b = c/x style; x in a random place
    let a: number, b: number, m: number
    if (level === 1) {
      a = randInt(rng, 1, 9)
      b = randInt(rng, 2, 12)
      m = randInt(rng, 2, 5)
    } else {
      a = randInt(rng, 1, 9) + 0.5
      b = randInt(rng, 2, 9)
      m = pick(rng, [1.5, 2.5, 3, 4, 0.5])
    }
    const nums = [a, b, round(a * m, 2), round(b * m, 2)] // a/b = (a·m)/(b·m)
    const hole = randInt(rng, 0, 3)
    const ans = nums[hole]
    const show = nums.map((v, i) => (i === hole ? 'x' : fmt(v)))
    // a·d = b·c — the "known pair" for solving
    const [A, B, C, D] = nums
    const steps: string[] = []
    if (hole === 0) steps.push(`x · ${fmt(D)} = ${fmt(B)} · ${fmt(C)}`, `x = ${fmt(B * C)} ÷ ${fmt(D)} = ${fmt(ans)}`)
    if (hole === 1) steps.push(`${fmt(A)} · ${fmt(D)} = x · ${fmt(C)}`, `x = ${fmt(A * D)} ÷ ${fmt(C)} = ${fmt(ans)}`)
    if (hole === 2) steps.push(`${fmt(A)} · ${fmt(D)} = ${fmt(B)} · x`, `x = ${fmt(A * D)} ÷ ${fmt(B)} = ${fmt(ans)}`)
    if (hole === 3) steps.push(`${fmt(A)} · x = ${fmt(B)} · ${fmt(C)}`, `x = ${fmt(B * C)} ÷ ${fmt(A)} = ${fmt(ans)}`)
    return base(this.id, 'proportion', level, {
      type: 'numeric',
      text: `פתרי: ${show[0]}/${show[1]} = ${show[2]}/${show[3]}`,
      tex: `${frac(show[0], show[1])} = ${frac(show[2], show[3])}`,
      answer: ans,
      unit: '',
      hint: 'הכפלה צולבת: מכפלת האלכסון האחד שווה למכפלת האלכסון השני.',
      solutionSteps: steps,
      params: { A, B, C, D, hole },
    })
  },
}

const propUnitPrice: Generator = {
  id: 'prop_unit_price',
  topic: 'proportion',
  levels: [1, 2],
  make(level, rng) {
    const kind = pick(rng, ['notebooks', 'fuel', 'recipe', 'speed'] as const)
    if (kind === 'notebooks') {
      const unit = level === 1 ? randInt(rng, 3, 15) : randInt(rng, 3, 15) + 0.5
      const n1 = randInt(rng, 2, 8)
      let n2 = randInt(rng, 2, 12)
      if (n2 === n1) n2++
      const item = pick(rng, ['מחברות', 'עטים', 'גלידות', 'כרטיסים לסרט'])
      const p1 = round(unit * n1, 2),
        ans = round(unit * n2, 2)
      return base(this.id, 'proportion', level, {
        type: 'numeric',
        text: `${n1} ${item} עולים ${fmt(p1)} ש"ח. כמה עולים ${n2} ${item}?`,
        answer: ans,
        unit: NIS,
        hint: 'מצאי כמה עולה אחד, או כתבי פרופורציה.',
        solutionSteps: [`${n1}/${fmt(p1)} = ${n2}/x`, `מחיר ליחידה: ${fmt(p1)} ÷ ${n1} = ${fmt(unit)} ש"ח`, `${n2} × ${fmt(unit)} = ${fmt(ans)} ש"ח`],
        params: { n1, p1, n2 },
      })
    }
    if (kind === 'fuel') {
      const per = pick(rng, [10, 12, 15, 20, 25])
      const l1 = randInt(rng, 4, 12)
      const l2 = level === 1 ? randInt(rng, 2, 20) : randInt(rng, 2, 20) + 0.5
      const km1 = per * l1,
        km2 = round(per * l2, 2)
      return base(this.id, 'proportion', level, {
        type: 'numeric',
        text: `מכונית צורכת ${l1} ליטר דלק ל-${km1} ק"מ. כמה ליטר תצרוך ל-${fmt(km2)} ק"מ?`,
        answer: l2,
        unit: 'ליטר',
        hint: 'כמה ק"מ נוסעים בליטר אחד?',
        solutionSteps: [`${km1} ÷ ${l1} = ${per} ק"מ לליטר`, `${fmt(km2)} ÷ ${per} = ${fmt(l2)} ליטר`],
        params: { l1, km1, km2 },
      })
    }
    if (kind === 'recipe') {
      const perPerson = pick(rng, [[1, 2], [2, 3], [1, 3], [3, 4], [2, 1], [3, 2]] as const) // eggs : people
      const [e, p] = perPerson
      const k1 = randInt(rng, 2, 4),
        k2 = randInt(rng, 1, 6)
      const people1 = p * k1,
        eggs1 = e * k1
      const people2 = p * (k2 === k1 ? k2 + 1 : k2)
      const ans = (people2 / p) * e
      return base(this.id, 'proportion', level, {
        type: 'numeric',
        text: `למתכון ל-${people1} אנשים צריך ${eggs1} ביצים. כמה ביצים צריך ל-${people2} אנשים?`,
        answer: ans,
        unit: 'ביצים',
        hint: 'פי כמה גדל מספר האנשים? באותו יחס גדל מספר הביצים.',
        solutionSteps: [`${people1}/${eggs1} = ${people2}/x`, `x = ${eggs1} × ${people2} ÷ ${people1} = ${ans}`],
        params: { people1, eggs1, people2 },
      })
    }
    // speed
    const v = pick(rng, [40, 50, 60, 70, 80, 90, 100, 120])
    const h1 = randInt(rng, 2, 5)
    if (level === 1) {
      let h2 = randInt(rng, 1, 6)
      if (h2 === h1) h2++
      return base(this.id, 'proportion', level, {
        type: 'numeric',
        text: `מכונית עברה ${v * h1} ק"מ ב-${h1} שעות במהירות קבועה. כמה ק"מ תעבור ב-${h2} שעות?`,
        answer: v * h2,
        unit: KM,
        hint: 'מצאי כמה ק"מ בשעה אחת.',
        solutionSteps: [`${v * h1} ÷ ${h1} = ${v} קמ"ש`, `${v} × ${h2} = ${v * h2} ק"מ`],
        params: { d1: v * h1, h1, h2 },
      })
    }
    const minutes = pick(rng, [15, 20, 30, 40, 45].filter((mm) => Number.isInteger((v * mm) / 60)))
    const hours = randInt(rng, 1, 3)
    const t = hours + minutes / 60
    const ans = round(v * t, 2)
    return base(this.id, 'proportion', level, {
      type: 'numeric',
      text: `רכבת נוסעת במהירות קבועה של ${v} קמ"ש. איזה מרחק תעבור ${hours === 1 ? 'בשעה' : 'ב-' + hours + ' שעות'} ו-${minutes} דקות?`,
      answer: ans,
      unit: KM,
      hint: `המירי את הדקות לשעות: ${minutes} דקות = ${minutes}/60 שעה.`,
      solutionSteps: [`${minutes} דקות = ${fmt(minutes / 60, 3)} שעה → סה"כ ${fmt(t, 3)} שעות`, `${v} × ${fmt(t, 3)} = ${fmt(ans)} ק"מ`],
      params: { v, hours, minutes },
    })
  },
}

const propShadow: Generator = {
  id: 'prop_shadow',
  topic: 'proportion',
  levels: [2],
  make(level, rng) {
    const [p, q] = pick(rng, [[2, 3], [3, 4], [1, 2], [4, 3], [3, 2], [4, 5]] as const) // height : shadow
    const u1 = pick(rng, [0.5, 1])
    const u2 = randInt(rng, 2, 8)
    const h1 = p * u1,
      s1 = q * u1,
      h2 = p * u2,
      s2 = q * u2
    const findHeight = rng() < 0.6
    return base(this.id, 'proportion', level, {
      type: 'numeric',
      text: findHeight
        ? `מקל בגובה ${fmt(h1)} מ' מטיל צל של ${fmt(s1)} מ'. באותה שעה עץ מטיל צל של ${fmt(s2)} מ'. מה גובה העץ?`
        : `מקל בגובה ${fmt(h1)} מ' מטיל צל של ${fmt(s1)} מ'. באותה שעה, מה אורך הצל של בניין בגובה ${fmt(h2)} מ'?`,
      answer: findHeight ? h2 : s2,
      unit: M,
      figure: { kind: 'shadow', h1: fmt(h1), s1: fmt(s1), h2: findHeight ? '?' : fmt(h2), s2: findHeight ? fmt(s2) : '?' },
      hint: 'באותה שעה היחס גובה:צל זהה לכל החפצים.',
      solutionSteps: findHeight
        ? [`${fmt(h1)}/${fmt(s1)} = x/${fmt(s2)}`, `x = ${fmt(h1)} × ${fmt(s2)} ÷ ${fmt(s1)} = ${fmt(h2)} מ'`]
        : [`${fmt(h1)}/${fmt(s1)} = ${fmt(h2)}/x`, `x = ${fmt(s1)} × ${fmt(h2)} ÷ ${fmt(h1)} = ${fmt(s2)} מ'`],
      params: { h1, s1, given: findHeight ? s2 : h2, findHeight: findHeight ? 1 : 0 },
    })
  },
}

const propInverse: Generator = {
  id: 'prop_inverse',
  topic: 'proportion',
  levels: [3],
  inverse: true,
  make(level, rng) {
    for (;;) {
      const P = randInt(rng, 60, 360)
      const divs = Array.from({ length: 40 }, (_, i) => i + 2).filter((d) => P % d === 0 && P / d >= 2)
      if (divs.length < 2) continue
      const [w1, w2] = shuffle(rng, divs).slice(0, 2)
      const workers = rng() < 0.5
      const d1 = P / w1,
        d2 = P / w2
      if (workers) {
        if (w1 > 30 || w2 > 30) continue
        return base(this.id, 'proportion', level, {
          type: 'numeric',
          inverse: true,
          text: `${w1} פועלים מסיימים עבודה ב-${d1} ימים. בכמה ימים יסיימו אותה ${w2} פועלים? (יחס הפוך)`,
          answer: d2,
          unit: 'ימים',
          hint: 'יחס הפוך: יותר פועלים → פחות ימים. המכפלה פועלים × ימים קבועה.',
          solutionSteps: [`כמות העבודה: ${w1} × ${d1} = ${P} ימי עבודה`, `${P} ÷ ${w2} = ${d2} ימים`],
          params: { w1, d1, w2 },
        })
      }
      // speed × time = distance
      if (w1 > 120 || w2 > 120 || w1 < 20 || w2 < 20) continue
      return base(this.id, 'proportion', level, {
        type: 'numeric',
        inverse: true,
        text: `במהירות ${w1} קמ"ש הנסיעה נמשכת ${d1} שעות. כמה שעות תימשך במהירות ${w2} קמ"ש? (יחס הפוך)`,
        answer: d2,
        unit: 'שעות',
        hint: 'המרחק קבוע: מהירות × זמן = מרחק.',
        solutionSteps: [`מרחק: ${w1} × ${d1} = ${P} ק"מ`, `${P} ÷ ${w2} = ${d2} שעות`],
        params: { w1, d1, w2 },
      })
    }
  },
}

// =====================================================================
// SCALE
// =====================================================================

const cmTo = (cm: number, unit: 'm' | 'km') => (unit === 'm' ? cm / 100 : cm / 100000)

const scaleMapToReal: Generator = {
  id: 'scale_map_to_real',
  topic: 'scale',
  levels: [1, 2],
  make(level, rng) {
    const N = pick(rng, SCALES)
    const cm = level === 1 ? randInt(rng, 1, 12) : randInt(rng, 1, 11) + pick(rng, [0.5, 0.2, 0.4, 0.6, 0.8])
    const unit = N >= 25000 ? 'km' : 'm'
    const realCm = round(cm * N, 4)
    const ans = round(cmTo(realCm, unit), 4)
    const u = unit === 'km' ? KM : M
    const what = N >= 25000 ? 'המרחק בין שתי ערים' : pick(rng, ['אורך חדר', 'אורך גינה', 'רוחב בניין'])
    return base(this.id, 'scale', level, {
      type: 'numeric',
      text: `בשרטוט בקנה מידה ${scaleText(N)} ${what} הוא ${fmt(cm)} ס"מ. מהו האורך במציאות ב${unit === 'km' ? 'ק"מ' : 'מטרים'}?`,
      answer: ans,
      unit: u,
      tolerance: 0.01,
      hint: unit === 'km' ? 'כופלים בקנה המידה, ואז ס"מ → ק"מ: מחלקים ב-100,000.' : 'כופלים בקנה המידה, ואז ס"מ → מ\': מחלקים ב-100.',
      solutionSteps: [
        `${fmt(cm)} × ${fmtSep(N)} = ${fmtSep(realCm)} ס"מ`,
        unit === 'km' ? `${fmtSep(realCm)} ס"מ ÷ 100,000 = ${fmt(ans, 4)} ק"מ` : `${fmtSep(realCm)} ס"מ ÷ 100 = ${fmt(ans, 4)} מ'`,
      ],
      params: { N, cm, unit },
    })
  },
}

const scaleRealToMap: Generator = {
  id: 'scale_real_to_map',
  topic: 'scale',
  levels: [1, 2],
  make(level, rng) {
    const N = pick(rng, SCALES)
    const cm = level === 1 ? randInt(rng, 1, 20) : randInt(rng, 1, 15) + pick(rng, [0.5, 0.25, 0.4, 0.8])
    const unit = N >= 25000 ? 'km' : 'm'
    const real = round(cmTo(cm * N, unit), 4)
    return base(this.id, 'scale', level, {
      type: 'numeric',
      text: `המרחק האמיתי הוא ${fmt(real, 4)} ${unit === 'km' ? 'ק"מ' : "מ'"}. מה יהיה המרחק בשרטוט בקנה מידה ${scaleText(N)} (בס"מ)?`,
      answer: cm,
      unit: CM,
      hint: 'קודם המירי לס"מ, ואז חלקי בקנה המידה.',
      solutionSteps: [
        unit === 'km' ? `${fmt(real, 4)} ק"מ = ${fmtSep(cm * N)} ס"מ` : `${fmt(real, 4)} מ' = ${fmtSep(cm * N)} ס"מ`,
        `${fmtSep(cm * N)} ÷ ${fmtSep(N)} = ${fmt(cm)} ס"מ`,
      ],
      params: { N, real, unit },
    })
  },
}

const NICE_SCALES = [50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000]

const scaleFind: Generator = {
  id: 'scale_find',
  topic: 'scale',
  levels: [1, 2],
  make(level, rng) {
    const N = pick(rng, NICE_SCALES)
    const cm = level === 1 ? randInt(rng, 1, 10) : randInt(rng, 1, 9) + 0.5
    const unit = N >= 10000 ? 'km' : 'm'
    const real = round(cmTo(cm * N, unit), 4)
    return base(this.id, 'scale', level, {
      type: 'text',
      text: `אורך אמיתי של ${fmt(real, 4)} ${unit === 'km' ? 'ק"מ' : "מ'"} מצויר כ-${fmt(cm)} ס"מ. מהו קנה המידה? (כתבי בצורה 1:N)`,
      answer: scaleText(N),
      acceptedAnswers: [`1:${N}`, `1 : ${N}`, scaleText(N), `1/${N}`],
      hint: 'המירי את האורך האמיתי לס"מ, ואז חלקי באורך בשרטוט.',
      solutionSteps: [
        `${fmt(real, 4)} ${unit === 'km' ? 'ק"מ' : "מ'"} = ${fmtSep(cm * N)} ס"מ`,
        `${fmtSep(cm * N)} ÷ ${fmt(cm)} = ${fmtSep(N)}`,
        `קנה המידה: ${scaleText(N)}`,
      ],
      params: { cm, real, unit },
    })
  },
}

const scaleArea: Generator = {
  id: 'scale_area',
  topic: 'scale',
  levels: [3],
  make(level, rng) {
    const N = pick(rng, [50, 100, 200, 500, 1000])
    if (rng() < 0.5) {
      const A = randInt(rng, 2, 20)
      const ans = round((A * N * N) / 10000, 4)
      return base(this.id, 'scale', level, {
        type: 'numeric',
        text: `בשרטוט בקנה מידה ${scaleText(N)} שטח חדר הוא ${A} סמ"ר. מהו שטחו האמיתי במ"ר?`,
        answer: ans,
        unit: 'מ"ר',
        tolerance: 0.01,
        hint: 'בשטח — מעלים את קנה המידה בריבוע! ו-1 מ"ר = 10,000 סמ"ר.',
        solutionSteps: [
          `יחס השטחים: 1:${fmtSep(N)}² = 1:${fmtSep(N * N)}`,
          `${A} × ${fmtSep(N * N)} = ${fmtSep(A * N * N)} סמ"ר`,
          `÷ 10,000 → ${fmt(ans, 4)} מ"ר`,
        ],
        params: { N, A },
      })
    }
    const w = randInt(rng, 2, 10),
      h = randInt(rng, 2, 10)
    const W = (w * N) / 100,
      H = (h * N) / 100
    const ans = round(W * H, 4)
    return base(this.id, 'scale', level, {
      type: 'numeric',
      text: `גינה מלבנית בשרטוט בקנה מידה ${scaleText(N)} היא ${w} ס"מ על ${h} ס"מ. מהו שטחה האמיתי במ"ר?`,
      answer: ans,
      unit: 'מ"ר',
      tolerance: 0.01,
      hint: 'הכי בטוח: המירי כל צלע למטרים במציאות, ורק אז כפלי.',
      solutionSteps: [`${w} × ${fmtSep(N)} = ${fmtSep(w * N)} ס"מ = ${fmt(W)} מ'`, `${h} × ${fmtSep(N)} = ${fmtSep(h * N)} ס"מ = ${fmt(H)} מ'`, `שטח: ${fmt(W)} × ${fmt(H)} = ${fmt(ans, 4)} מ"ר`],
      params: { N, w, h },
    })
  },
}

const scaleBetweenMaps: Generator = {
  id: 'scale_between_maps',
  topic: 'scale',
  levels: [3],
  make(level, rng) {
    const MAP = [25000, 50000, 100000, 200000, 250000]
    for (;;) {
      const [N1, N2] = shuffle(rng, MAP).slice(0, 2)
      const d1 = randInt(rng, 2, 16)
      const d2 = round((d1 * N1) / N2, 4)
      if (d2 < 0.5 || d2 > 40 || round(d2, 2) !== d2) continue
      const realKm = (d1 * N1) / 100000
      return base(this.id, 'scale', level, {
        type: 'numeric',
        text: `במפה בקנה מידה ${scaleText(N1)} המרחק בין שני כפרים ${d1} ס"מ. מה יהיה המרחק ביניהם במפה בקנה מידה ${scaleText(N2)}?`,
        answer: d2,
        unit: CM,
        hint: 'קודם מצאי את המרחק האמיתי, ואז העבירי אותו למפה השנייה.',
        solutionSteps: [`במציאות: ${d1} × ${fmtSep(N1)} = ${fmtSep(d1 * N1)} ס"מ (${fmt(realKm, 4)} ק"מ)`, `במפה השנייה: ${fmtSep(d1 * N1)} ÷ ${fmtSep(N2)} = ${fmt(d2)} ס"מ`],
        params: { N1, N2, d1 },
      })
    }
  },
}

// =====================================================================
// COMBO (boss) — 2–3 topics in one question
// =====================================================================

const comboMapPyth: Generator = {
  id: 'combo_map_pyth',
  topic: 'combo',
  levels: [1, 2, 3],
  make(level, rng) {
    const t = level === 1 ? pick(rng, PYTH_TRIPLES.slice(0, 2)) : pick(rng, PYTH_TRIPLES.slice(0, 4))
    const k = level === 1 ? randInt(rng, 1, 2) : level === 2 ? randInt(rng, 1, 3) : pick(rng, [0.5, 1, 1.5])
    const [e, n, c] = [t[0] * k, t[1] * k, t[2] * k]
    const N = level === 1 ? pick(rng, [50000, 100000]) : pick(rng, [25000, 50000, 100000, 200000])
    const km = round((c * N) / 100000, 4)
    if (level === 3) {
      const saved = round(((e + n - c) * N) / 100000, 4)
      return base(this.id, ['combo', 'scale', 'pythagoras'], level, {
        type: 'numeric',
        boss: true,
        text: `במפה בקנה מידה ${scaleText(N)}, כדי להגיע מהבית לבית הספר אביב הולכת ${fmt(e)} ס"מ מזרחה ואז ${fmt(n)} ס"מ צפונה. בכמה ק"מ קצר יותר ללכת בקו ישר?`,
        answer: saved,
        unit: KM,
        tolerance: 0.01,
        figure: { kind: 'map', east: fmt(e), north: fmt(n), scale: scaleText(N) },
        hint: 'פיתגורס במפה → ההפרש בין שני המסלולים → קנה מידה.',
        solutionSteps: [
          `קו ישר במפה: √(${fmt(e)}² + ${fmt(n)}²) = ${fmt(c)} ס"מ`,
          `המסלול הארוך: ${fmt(e)} + ${fmt(n)} = ${fmt(e + n)} ס"מ → ההפרש ${fmt(e + n - c)} ס"מ`,
          `${fmt(e + n - c)} × ${fmtSep(N)} = ${fmtSep((e + n - c) * N)} ס"מ = ${fmt(saved, 4)} ק"מ`,
        ],
        params: { e, n, N, mode: 'saved' },
      })
    }
    return base(this.id, ['combo', 'scale', 'pythagoras'], level, {
      type: 'numeric',
      boss: true,
      text: `במפה בקנה מידה ${scaleText(N)} שתי עיירות נמצאות ${fmt(e)} ס"מ זו מזו בכיוון מזרח ו-${fmt(n)} ס"מ בכיוון צפון. מהו המרחק האמיתי בקו ישר ביניהן, בק"מ?`,
      answer: km,
      unit: KM,
      tolerance: 0.01,
      figure: { kind: 'map', east: fmt(e), north: fmt(n), scale: scaleText(N) },
      hint: 'קודם פיתגורס במפה, ואז קנה מידה.',
      solutionSteps: [
        `במפה: √(${fmt(e)}² + ${fmt(n)}²) = √${fmt(c * c)} = ${fmt(c)} ס"מ`,
        `במציאות: ${fmt(c)} × ${fmtSep(N)} = ${fmtSep(c * N)} ס"מ`,
        `= ${fmt(km, 4)} ק"מ`,
      ],
      params: { e, n, N, mode: 'straight' },
    })
  },
}

const comboRatioPyth: Generator = {
  id: 'combo_ratio_pyth',
  topic: 'combo',
  levels: [2, 3],
  make(level, rng) {
    const [a, b, c] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17]] as const)
    const x = randInt(rng, 1, level === 2 ? 4 : 3)
    const variant = level === 2 ? pick(rng, ['triPerimeter', 'rectDiagPerimeter'] as const) : pick(rng, ['triArea', 'rectDiagArea'] as const)
    if (variant === 'triPerimeter') {
      const P = (a + b + c) * x
      return base(this.id, ['combo', 'ratio', 'pythagoras'], level, {
        type: 'numeric',
        boss: true,
        text: `ניצבי משולש ישר-זווית ביחס ${a}:${b}, והיקף המשולש ${P} ס"מ. מצאי את היתר.`,
        answer: c * x,
        unit: CM,
        figure: { kind: 'triangle', a: `${a}x`, b: `${b}x`, c: '?' },
        hint: `ניצבים ${a}x ו-${b}x → היתר ${c}x (שלשה פיתגורית!). ההיקף הוא סכום שלושתם.`,
        solutionSteps: [`יתר: √((${a}x)² + (${b}x)²) = ${c}x`, `${a}x + ${b}x + ${c}x = ${a + b + c}x = ${P} → x = ${x}`, `יתר = ${c} × ${x} = ${c * x} ס"מ`],
        params: { a, b, c, P, variant },
      })
    }
    if (variant === 'triArea') {
      const S = (a * b * x * x) / 2
      return base(this.id, ['combo', 'ratio', 'pythagoras'], level, {
        type: 'numeric',
        boss: true,
        text: `ניצבי משולש ישר-זווית ביחס ${a}:${b}, ושטחו ${S} סמ"ר. מצאי את היתר.`,
        answer: c * x,
        unit: CM,
        figure: { kind: 'triangle', a: `${a}x`, b: `${b}x`, c: '?' },
        hint: `שטח = ${a}x · ${b}x / 2. מצאי את x ואז את היתר ${c}x.`,
        solutionSteps: [`${a}x · ${b}x / 2 = ${S} → ${(a * b) / 2}x² = ${S}`, `x² = ${x * x} → x = ${x}`, `יתר = ${c}x = ${c * x} ס"מ`],
        params: { a, b, c, S, variant },
      })
    }
    const d = c * x
    if (variant === 'rectDiagPerimeter') {
      const P = 2 * (a + b) * x
      return base(this.id, ['combo', 'ratio', 'pythagoras'], level, {
        type: 'numeric',
        boss: true,
        text: `צלעות מלבן ביחס ${a}:${b} ואלכסונו ${d} ס"מ. מצאי את היקף המלבן.`,
        answer: P,
        unit: CM,
        figure: { kind: 'rect', w: `${b}x`, h: `${a}x`, d: String(d) },
        hint: `צלעות ${a}x ו-${b}x, אלכסון ${c}x.`,
        solutionSteps: [`אלכסון = ${c}x = ${d} → x = ${x}`, `צלעות: ${a * x} ו-${b * x}`, `היקף = 2(${a * x} + ${b * x}) = ${P} ס"מ`],
        params: { a, b, c, d, variant },
      })
    }
    const S = a * b * x * x
    return base(this.id, ['combo', 'ratio', 'pythagoras'], level, {
      type: 'numeric',
      boss: true,
      text: `מסך ביחס רוחב:גובה של ${b}:${a}, ואלכסונו ${d} ס"מ. מצאי את שטח המסך בסמ"ר.`,
      answer: S,
      unit: 'סמ"ר',
      figure: { kind: 'rect', w: `${b}x`, h: `${a}x`, d: String(d) },
      hint: `רוחב ${b}x, גובה ${a}x, אלכסון ${c}x.`,
      solutionSteps: [`אלכסון = ${c}x = ${d} → x = ${x}`, `רוחב ${b * x}, גובה ${a * x}`, `שטח = ${b * x} × ${a * x} = ${S} סמ"ר`],
      params: { a, b, c, d, variant },
    })
  },
}

const comboScaleShadow: Generator = {
  id: 'combo_scale_shadow',
  topic: 'combo',
  levels: [2, 3],
  make(level, rng) {
    const [a, b, c] = pick(rng, PYTH_TRIPLES.slice(0, 3))
    const k = randInt(rng, 1, 3) * (level === 3 ? 1 : 5)
    const N = pick(rng, [100, 200, 500])
    const ans = round((c * k * N) / 100, 4)
    if (level === 2) {
      return base(this.id, ['combo', 'scale', 'pythagoras'], level, {
        type: 'numeric',
        boss: true,
        text: `דגם של מגדל בקנה מידה ${scaleText(N)} גובהו ${a * k} ס"מ ומטיל צל של ${b * k} ס"מ. מהו המרחק האמיתי מקצה הצל לראש המגדל, במטרים?`,
        answer: ans,
        unit: M,
        figure: { kind: 'ladder', len: '?', base: String(b * k), height: String(a * k), item: 'tower' },
        hint: 'פיתגורס בדגם, ואז קנה מידה.',
        solutionSteps: [`בדגם: √(${a * k}² + ${b * k}²) = ${c * k} ס"מ`, `${c * k} × ${fmtSep(N)} = ${fmtSep(c * k * N)} ס"מ = ${fmt(ans)} מ'`],
        params: { h: a * k, s: b * k, N, level },
      })
    }
    // level 3: tower height via model, shadow via stick proportion, then Pythagoras
    const u = pick(rng, [0.5, 1])
    const stickH = a * u,
      stickS = b * u
    const H = (a * k * N) / 100
    return base(this.id, ['combo', 'scale', 'proportion', 'pythagoras'], level, {
      type: 'numeric',
      boss: true,
      text: `דגם של מגדל בקנה מידה ${scaleText(N)} גובהו ${a * k} ס"מ. ביום שמש, מקל בגובה ${fmt(stickH)} מ' מטיל צל של ${fmt(stickS)} מ'. מהו המרחק מראש המגדל האמיתי לקצה הצל שלו, במטרים?`,
      answer: ans,
      unit: M,
      hint: 'שלושה צעדים: קנה מידה → גובה אמיתי; פרופורציה → צל; פיתגורס → מרחק.',
      solutionSteps: [
        `גובה אמיתי: ${a * k} × ${fmtSep(N)} = ${fmtSep(a * k * N)} ס"מ = ${fmt(H)} מ'`,
        `צל: ${fmt(stickH)}/${fmt(stickS)} = ${fmt(H)}/x → x = ${fmt((H * b) / a)} מ'`,
        `מרחק: √(${fmt(H)}² + ${fmt((H * b) / a)}²) = ${fmt(ans)} מ'`,
      ],
      params: { h: a * k, N, stickH, stickS, level },
    })
  },
}

const comboRatioPropMoney: Generator = {
  id: 'combo_ratio_prop_money',
  topic: 'combo',
  levels: [1, 2],
  make(level, rng) {
    for (;;) {
      const [p, q] = coprimePair(rng, 5)
      const unit = pick(rng, [4, 5, 6, 8, 10, 12, 15])
      if (level === 1) {
        // total split p:q; second person buys items at unit price with all her money
        const m = unit * randInt(rng, 1, 6)
        const total = (p + q) * m
        const items = (q * m) / unit
        return base(this.id, ['combo', 'ratio', 'proportion'], level, {
          type: 'numeric',
          boss: true,
          text: `${total} ש"ח חולקו בין אביב לאחותה ביחס ${p}:${q} (אביב:אחות). האחות קנתה בכל הכסף שלה מחברות שכל אחת עולה ${unit} ש"ח. כמה מחברות קנתה?`,
          answer: items,
          unit: 'מחברות',
          figure: { kind: 'parts', parts: [p, q], labels: ['אביב', 'אחות'] },
          hint: 'קודם חלוקה לפי יחס, ואז מחיר ליחידה.',
          solutionSteps: [`${p + q} חלקים = ${total} → חלק = ${m}`, `האחות: ${q} × ${m} = ${q * m} ש"ח`, `${q * m} ÷ ${unit} = ${items} מחברות`],
          params: { total, p, q, unit },
        })
      }
      // level 2: price per kg → total → split
      const kg1 = randInt(rng, 2, 4)
      const price = randInt(rng, 4, 12)
      const kg2 = randInt(rng, 3, 9)
      const total = price * kg2
      if (total % (p + q) !== 0) continue
      const share = (total / (p + q)) * q
      return base(this.id, ['combo', 'ratio', 'proportion'], level, {
        type: 'numeric',
        boss: true,
        text: `${kg1} ק"ג תפוחים עולים ${kg1 * price} ש"ח. אמא קנתה ${kg2} ק"ג וחילקה את התשלום בינה לבין סבתא ביחס ${p}:${q} (אמא:סבתא). כמה שילמה סבתא?`,
        answer: share,
        unit: NIS,
        hint: 'קודם המחיר הכולל (פרופורציה), ואז חלוקה לפי יחס.',
        solutionSteps: [`${kg1 * price} ÷ ${kg1} = ${price} ש"ח לק"ג → ${kg2} ק"ג = ${total} ש"ח`, `${p + q} חלקים = ${total} → חלק = ${total / (p + q)}`, `סבתא: ${q} × ${total / (p + q)} = ${share} ש"ח`],
        params: { kg1, price, kg2, p, q },
      })
    }
  },
}

export const GENERATORS: Generator[] = [
  pythHypTriple,
  pythLegTriple,
  pythHypIrrational,
  pythIsRight,
  pythRectDiagonal,
  pythIsoscelesHeight,
  pythRhombusSide,
  pythDistancePoints,
  pythLadderKite,
  ratioSimplify,
  ratioDivideTotal,
  ratioGivenOne,
  ratioGivenDiff,
  ratioChain,
  ratioChange,
  ratioPerimeterRect,
  propSolveX,
  propUnitPrice,
  propShadow,
  propInverse,
  scaleMapToReal,
  scaleRealToMap,
  scaleFind,
  scaleArea,
  scaleBetweenMaps,
  comboMapPyth,
  comboRatioPyth,
  comboScaleShadow,
  comboRatioPropMoney,
]

export const GEN_BY_ID: Record<string, Generator> = Object.fromEntries(GENERATORS.map((g) => [g.id, g]))

/** Nearest level the generator supports. */
export function clampLevel(g: Generator, level: Level): Level {
  if (g.levels.includes(level)) return level
  return [...g.levels].sort((a, b) => Math.abs(a - level) - Math.abs(b - level))[0]
}

export function generate(id: string, level: Level, rng: Rng = Math.random): Question {
  const g = GEN_BY_ID[id]
  if (!g) throw new Error('unknown generator ' + id)
  return g.make(clampLevel(g, level), rng)
}
