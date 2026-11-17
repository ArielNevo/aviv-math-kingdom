import type { Question } from './types'

/**
 * Parse a numeric answer typed by the student.
 * Accepts: 5 / 5.0 / 5,5 / 1,000 / √50 / 5√2 / 5*sqrt(2) / sqrt(50) / 3/4 / −2 / "5 ס"מ"
 * Returns NaN when it cannot be understood.
 */
export function parseNumeric(raw: string): number {
  let s = raw
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/sqrt/gi, '√')
    .replace(/שורש/g, '√')
    .replace(/[֐-׿"'״׳]/g, '') // Hebrew unit words / quotes
    .replace(/\s+/g, '')
    .replace(/[×*·]/g, '')
  if (!s) return NaN
  // thousands separators: 1,000 / 12,500.5
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')
  else s = s.replace(/,/g, '.')

  // a√b, √b, √(b), a√(b)
  const sq = s.match(/^(-?\d*\.?\d*)√\(?(\d+\.?\d*)\)?$/)
  if (sq) {
    const coef = sq[1] === '' ? 1 : sq[1] === '-' ? -1 : Number(sq[1])
    return coef * Math.sqrt(Number(sq[2]))
  }
  // fraction a/b
  const fr = s.match(/^(-?\d+\.?\d*)\/(\d+\.?\d*)$/)
  if (fr) return Number(fr[1]) / Number(fr[2])
  if (/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return Number(s)
  return NaN
}

/** Numeric value of an "exact" string such as "5√2" or "√130". */
export const exactValue = (exact: string) => parseNumeric(exact)

export function normalizeText(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/[／/∶]/g, ':')
    .replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/[−–]/g, '-')
}

export function checkNumeric(q: Question, input: string): boolean {
  const v = parseNumeric(input)
  if (!Number.isFinite(v)) return false
  const ans = Number(q.answer)
  const tol = Math.max(q.tolerance ?? 0.01, Math.abs(ans) * 1e-9)
  if (Math.abs(v - ans) <= tol + 1e-9) return true
  if (q.exact) {
    const ex = exactValue(q.exact)
    if (Number.isFinite(ex) && Math.abs(v - ex) <= Math.max(1e-6, tol)) return true
  }
  return false
}

export function checkText(q: Question, input: string): boolean {
  const n = normalizeText(input)
  if (!n) return false
  const accepted = [String(q.answer), ...(q.acceptedAnswers ?? [])].map(normalizeText)
  return accepted.includes(n)
}

/** Generic checker for single-answer question types. */
export function checkAnswer(q: Question, input: string | boolean): boolean {
  switch (q.type) {
    case 'numeric':
      return checkNumeric(q, String(input))
    case 'text':
      return checkText(q, String(input))
    case 'true_false':
      return input === q.answer
    case 'mcq':
    case 'find_error':
    case 'fill_step':
      return String(input) === String(q.answer)
    default:
      return false
  }
}

/** Human display of the correct answer (both exact and rounded when available). */
export function answerDisplay(q: Question): string {
  if (q.type === 'true_false') return q.answer ? 'נכון' : 'לא נכון'
  if (q.type === 'numeric') {
    const unit = q.unit ? ' ' + q.unit : ''
    const ans = Number(q.answer)
    const shown = Number.isInteger(ans) && Math.abs(ans) >= 10000 ? ans.toLocaleString('en-US') : String(q.answer)
    if (q.exact && q.exact !== shown) return `${q.exact} ≈ ${shown}${unit}`
    return shown + unit
  }
  return String(q.answer)
}
