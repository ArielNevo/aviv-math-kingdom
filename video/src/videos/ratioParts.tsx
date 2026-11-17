import React from 'react'
import { C, fontFamily } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp } from '../components/ui'
import type { VisualFn } from '../Explainer'

const tt = (narr: number, frac: number) => 6 + Math.round(narr * frac)
const COLORS = [C.violet, C.fuchsia, '#f59e0b']

/** A row of equal blocks grouped by owner. groups: [{name, n, color}] ; value shown in each block once `showAt` passed. */
const PartsBar: React.FC<{
  f: number; groups: { name: string; n: number; color: string }[]; start: number; value?: string; showAt?: number; totals?: string[]; totalsAt?: number; width?: number
}> = ({ f, groups, start, value, showAt = 1e9, totals, totalsAt = 1e9, width = 640 }) => {
  const total = groups.reduce((a, g) => a + g.n, 0)
  const bw = Math.min(110, (width - (total - 1) * 8) / total)
  let k = 0
  return (
    <div dir="ltr" style={{ display: 'flex', gap: 18, alignItems: 'flex-end', justifyContent: 'center', fontFamily }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: g.n }, (_, i) => {
              const p = pop(f, start + (k++) * 3)
              return (
                <div key={i} style={{ width: bw, height: 96, borderRadius: 16, background: g.color, transform: `scale(${p})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: bw > 70 ? 38 : 30, boxShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                  <span style={{ opacity: ramp(f, showAt + i * 2, 6) }} dir="ltr">{value}</span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: g.color, opacity: ramp(f, start + 6, 8) }}>{g.name}</div>
          {totals && (
            <div style={{ fontSize: 40, fontWeight: 800, color: C.ink, opacity: ramp(f, totalsAt + gi * 10, 8), transform: `scale(${0.6 + 0.4 * pop(f, totalsAt + gi * 10)})` }}>
              <M>{totals[gi]}</M>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const Candies: React.FC<{ f: number; n: number; start: number }> = ({ f, n, start }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 46px)', gap: 10 }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ width: 46, height: 46, borderRadius: '50%', background: COLORS[i % 3], transform: `scale(${pop(f, start + i * 0.6)})`, boxShadow: 'inset -6px -6px 0 rgba(0,0,0,0.12), inset 6px 6px 0 rgba(255,255,255,0.35)' }} />
    ))}
  </div>
)

export const ratioParts: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <Candies f={f} n={60} start={4} />
          <Pop f={f} start={T(0.25)}><Say size={46}>60 סוכריות 🍬</Say></Pop>
          <Pop f={f} start={T(0.55)} from="scale"><Eq size={84} bg={C.goldSoft} color={C.purple}>2 : 3</Eq></Pop>
        </Stage>
      )
    case 'parts':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={52} color={C.purple} weight={800}>חושבים על חלקים, לא על סוכריות</Say></Pop>
          <PartsBar f={f} start={T(0.4)} groups={[{ name: 'את', n: 2, color: C.violet }, { name: 'נועה', n: 3, color: C.fuchsia }]} />
          <Pop f={f} start={T(0.78)}><Card border={C.gold} style={{ padding: '10px 28px' }}><Say size={54}><M>2 + 3 = 5</M> חלקים</Say></Card></Pop>
        </Stage>
      )
    case 'onepart':
      return (
        <Stage>
          <PartsBar f={f} start={0} value="12" showAt={T(0.6)} groups={[{ name: 'את', n: 2, color: C.violet }, { name: 'נועה', n: 3, color: C.fuchsia }]} />
          <Pop f={f} start={T(0.15)}><Eq size={66}>60 ÷ 5 = 12</Eq></Pop>
          <Pop f={f} start={T(0.6)}><Say size={44}>חלק אחד = <M color={C.fuchsia}>12</M></Say></Pop>
        </Stage>
      )
    case 'answer':
      return (
        <Stage>
          <PartsBar
            f={f} start={0} value="12" showAt={0} totalsAt={T(0.05)}
            totals={['2 × 12 = 24', '3 × 12 = 36']}
            groups={[{ name: 'את', n: 2, color: C.violet }, { name: 'נועה', n: 3, color: C.fuchsia }]}
          />
          <Pop f={f} start={T(0.62)}><Eq size={56} bg={C.goldSoft}>24 + 36 = 60</Eq></Pop>
          <Stamp f={f} start={T(0.9)}>בול! ✓</Stamp>
        </Stage>
      )
    case 'three':
      return (
        <Stage>
          <Pop f={f} start={4}><Card border={C.gold} style={{ padding: '10px 28px' }}><Say size={52}><M>120</M> ₪ ביחס <M color={C.fuchsia}>2 : 3 : 5</M></Say></Card></Pop>
          <PartsBar
            f={f} start={T(0.25)} value="12" showAt={T(0.55)} totalsAt={T(0.72)} width={600}
            totals={['24', '36', '60']}
            groups={[{ name: 'א', n: 2, color: C.violet }, { name: 'ב', n: 3, color: C.fuchsia }, { name: 'ג', n: 5, color: '#d97706' }]}
          />
          <Pop f={f} start={T(0.4)}><Eq size={48}>2 + 3 + 5 = 10</Eq></Pop>
          <Pop f={f} start={T(0.5)}><Eq size={48} color={C.fuchsia}>120 ÷ 10 = 12</Eq></Pop>
        </Stage>
      )
    case 'trap':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={50} color={C.red} weight={800}>⚠️ מלכודת!</Say></Pop>
          <Pop f={f} start={T(0.08)}><Card border={C.gold} style={{ padding: '10px 28px' }}><Say size={50}>יחס <M color={C.fuchsia}>3 : 7</M>, הגדול = <M>42</M></Say></Card></Pop>
          <PartsBar
            f={f} start={T(0.35)} value="6" showAt={T(0.68)} totalsAt={T(0.8)} width={620}
            totals={['3 × 6 = 18', '42']}
            groups={[{ name: 'הקטן', n: 3, color: C.violet }, { name: 'הגדול', n: 7, color: C.fuchsia }]}
          />
          <Pop f={f} start={T(0.5)}><Card style={{ padding: '10px 24px' }}><Say size={38}>42 הם <M color={C.fuchsia}>7</M> חלקים ← חלק = <M>42 ÷ 7 = 6</M></Say></Card></Pop>
        </Stage>
      )
    default:
      return <Recap f={f} lines={[<>סופרים חלקים</>, <>מוצאים חלק אחד ➗</>, <>כופלים ✖️</>]} />
  }
}
