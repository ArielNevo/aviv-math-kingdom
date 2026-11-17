import React from 'react'
import { C, fontFamily } from '../theme'
import { pop, ramp } from '../anim'

/** Left-to-right island for math inside Hebrew text. */
export const M: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <span dir="ltr" style={{ unicodeBidi: 'isolate', fontVariantNumeric: 'tabular-nums', color, whiteSpace: 'nowrap' }}>
    {children}
  </span>
)

/** Centered stage area (where scene visuals live). */
export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      position: 'absolute', left: 20, right: 20, top: 200, height: 700, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 22, direction: 'rtl', fontFamily, ...style,
    }}
  >
    {children}
  </div>
)

/** A line that pops in at frame `start`. */
export const Pop: React.FC<{ f: number; start: number; children: React.ReactNode; style?: React.CSSProperties; from?: 'up' | 'scale' }> = ({
  f, start, children, style, from = 'up',
}) => {
  const p = pop(f, start)
  const o = ramp(f, start, 8)
  const transform = from === 'scale' ? `scale(${0.4 + 0.6 * p})` : `translateY(${(1 - p) * 40}px)`
  return <div style={{ opacity: o, transform, ...style }}>{children}</div>
}

/** Big LTR equation line. */
export const Eq: React.FC<{ children: React.ReactNode; size?: number; color?: string; bg?: string; style?: React.CSSProperties }> = ({
  children, size = 54, color = C.ink, bg, style,
}) => (
  <div
    dir="ltr"
    style={{
      fontFamily, fontWeight: 700, fontSize: size, color, background: bg, padding: bg ? '10px 26px' : 0,
      borderRadius: 22, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5, textAlign: 'center', ...style,
    }}
  >
    {children}
  </div>
)

/** Hebrew label line. */
export const Say: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  children, size = 40, color = C.ink, weight = 700, style,
}) => (
  <div dir="rtl" style={{ fontFamily, fontSize: size, color, fontWeight: weight, textAlign: 'center', lineHeight: 1.25, ...style }}>
    {children}
  </div>
)

/** White rounded card. */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; border?: string }> = ({ children, style, border = C.lilac }) => (
  <div
    style={{
      background: '#fff', borderRadius: 32, border: `4px solid ${border}`, boxShadow: '0 14px 40px rgba(76,29,149,0.16)',
      padding: '26px 30px', direction: 'rtl', fontFamily, ...style,
    }}
  >
    {children}
  </div>
)

/** A sequence of equation lines that appear one after another at given frames. */
export const Steps: React.FC<{ f: number; items: { at: number; node: React.ReactNode }[]; gap?: number }> = ({ f, items, gap = 18 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>
    {items.map((it, i) => (
      <Pop key={i} f={f} start={it.at}>
        {it.node}
      </Pop>
    ))}
  </div>
)

/** Rubber stamp (✓ / ✗ / text). */
export const Stamp: React.FC<{ f: number; start: number; children: React.ReactNode; color?: string; rotate?: number; size?: number }> = ({
  f, start, children, color = C.green, rotate = -8, size = 46,
}) => {
  const p = pop(f, start)
  return (
    <div
      style={{
        opacity: ramp(f, start, 5), transform: `rotate(${rotate}deg) scale(${2.2 - 1.2 * Math.min(p, 1.05)})`,
        border: `6px solid ${color}`, color, borderRadius: 20, padding: '6px 22px', fontFamily, fontWeight: 800, fontSize: size,
        direction: 'rtl', background: 'rgba(255,255,255,0.85)',
      }}
    >
      {children}
    </div>
  )
}

/** Stroke-draw helper for SVG paths: pass the path length. */
export const draw = (progress: number, len: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - progress) })

/** "זוכרת?" recap card with bullet lines. */
export const Recap: React.FC<{ f: number; lines: React.ReactNode[]; formula?: React.ReactNode }> = ({ f, lines, formula }) => (
  <Stage>
    <Pop f={f} start={0} from="scale">
      <div style={{ fontFamily, fontWeight: 800, fontSize: 76, color: C.fuchsia, direction: 'rtl' }}>זוכרת? 👑</div>
    </Pop>
    <Card border={C.gold} style={{ width: 600 }}>
      {lines.map((l, i) => (
        <Pop key={i} f={f} start={8 + i * 14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '10px 0', fontSize: 40, fontWeight: 700, color: C.ink }}>
            <span style={{ background: C.gold, color: C.purple, borderRadius: 999, width: 48, height: 48, display: 'grid', placeItems: 'center', fontSize: 28, flex: 'none' }}>
              {i + 1}
            </span>
            <span>{l}</span>
          </div>
        </Pop>
      ))}
    </Card>
    {formula && (
      <Pop f={f} start={10 + lines.length * 14}>
        {formula}
      </Pop>
    )}
  </Stage>
)
