// Small math + random helpers shared by generators, answer checking and tests.

export type Rng = () => number

/** Deterministic PRNG (mulberry32) — used by tests; the app uses Math.random. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randInt = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
export const gcdAll = (xs: number[]) => xs.reduce((g, x) => gcd(g, x))

/** Round to given decimals, avoiding binary float noise. */
export const round = (x: number, d = 2) => {
  const f = 10 ** d
  return Math.round((x + Number.EPSILON) * f) / f
}

/** Format a number for display: thousands separators, up to 2 decimals, no trailing zeros. */
export function fmt(x: number, decimals = 2): string {
  const r = round(x, decimals)
  const [int, dec] = String(Math.abs(r)).split('.')
  const withSep = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : int
  return (r < 0 ? '−' : '') + withSep + (dec ? '.' + dec : '')
}
/** Same as fmt but always uses separators (for scale ratios 1:1,000). */
export function fmtSep(x: number): string {
  const r = round(x, 2)
  const [int, dec] = String(Math.abs(r)).split('.')
  return (r < 0 ? '−' : '') + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec ? '.' + dec : '')
}

/** Simplify √n to k√m. Returns {k, m}; m=1 means perfect square. */
export function simplifySqrt(n: number): { k: number; m: number } {
  let k = 1
  let m = n
  for (let f = Math.floor(Math.sqrt(n)); f > 1; f--) {
    if (n % (f * f) === 0) {
      k = f
      m = n / (f * f)
      break
    }
  }
  return { k, m }
}
export function sqrtText(n: number): string {
  const { k, m } = simplifySqrt(n)
  if (m === 1) return String(k)
  return (k === 1 ? '' : String(k)) + '√' + m
}
export const isPerfectSquare = (n: number) => Number.isInteger(Math.sqrt(n))

export const PYTH_TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
]

/** Map scales used by scale generators. */
export const SCALES = [100, 200, 500, 1000, 25000, 50000, 100000, 250000]
export const scaleText = (n: number) => '1:' + fmtSep(n)
