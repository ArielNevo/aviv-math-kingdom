import React from 'react'
import { C, fontFamily } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp, Steps, draw } from '../components/ui'
import type { VisualFn } from '../Explainer'

const tt = (narr: number, frac: number) => 6 + Math.round(narr * frac)

const Frac: React.FC<{ top: React.ReactNode; bottom: React.ReactNode; size?: number; color?: string }> = ({ top, bottom, size = 84, color = C.ink }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontFamily, fontWeight: 800, fontSize: size, color, lineHeight: 1.05, minWidth: size * 1.3 }}>
    <div>{top}</div>
    <div style={{ height: 7, background: C.ink, borderRadius: 4, alignSelf: 'stretch', margin: '6px 0' }} />
    <div>{bottom}</div>
  </div>
)

/** a/b = c/d laid out LTR, with optional cross arrows. */
const Proportion: React.FC<{ f: number; a: React.ReactNode; b: React.ReactNode; c: React.ReactNode; d: React.ReactNode; cross?: number; size?: number }> = ({
  a, b, c, d, cross = 0, size = 84,
}) => (
  <div dir="ltr" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 36 }}>
    <Frac top={a} bottom={b} size={size} />
    <div style={{ fontFamily, fontWeight: 800, fontSize: size, color: C.ink }}>=</div>
    <Frac top={c} bottom={d} size={size} />
    {cross > 0 && (
      <svg width="420" height="260" viewBox="0 0 420 260" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible' }}>
        <path d="M70 60 L350 205" stroke={C.fuchsia} strokeWidth="9" strokeLinecap="round" opacity="0.75" style={draw(cross, 320)} />
        <path d="M350 60 L70 205" stroke={C.violet} strokeWidth="9" strokeLinecap="round" opacity="0.75" style={draw(Math.max(0, cross * 2 - 1), 320)} />
      </svg>
    )}
  </div>
)

const Notebooks: React.FC<{ f: number; n: number; start: number }> = ({ f, n, start }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {Array.from({ length: n }, (_, i) => (
      <svg key={i} width="52" height="66" viewBox="0 0 52 66" style={{ transform: `scale(${pop(f, start + i * 3)})` }}>
        <rect x="4" y="2" width="44" height="62" rx="6" fill={i % 2 ? C.fuchsia : C.violet} />
        <rect x="12" y="14" width="28" height="10" rx="3" fill="#fff" opacity="0.85" />
        {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx="6" cy={10 + k * 11} r="3" fill="#fff" />)}
      </svg>
    ))}
  </div>
)

export const proportionCross: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage style={{ gap: 30 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Notebooks f={f} n={5} start={4} />
            <Pop f={f} start={T(0.3)}><Say size={50}><M>5</M> מחברות = <M color={C.green}>30 ₪</M></Say></Pop>
          </Card>
          <Card border={C.gold} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Notebooks f={f} n={8} start={T(0.55)} />
            <Pop f={f} start={T(0.7)}><Say size={50}><M>8</M> מחברות = <M color={C.fuchsia}>?</M></Say></Pop>
          </Card>
        </Stage>
      )
    case 'write':
      return (
        <Stage>
          <Pop f={f} start={T(0.05)}><Say size={46} color={C.purple}>פרופורציה = שוויון בין שני יחסים</Say></Pop>
          <Pop f={f} start={T(0.5)} from="scale">
            <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Proportion f={f} a="5" b="30" c="8" d={<span style={{ color: C.fuchsia }}>x</span>} />
              <div dir="rtl" style={{ fontFamily, fontSize: 30, fontWeight: 700, color: '#6b5a8e', lineHeight: 2.6 }}>
                <div>מחברות ←</div>
                <div>שקלים ←</div>
              </div>
            </div>
          </Pop>
        </Stage>
      )
    case 'cross':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={56} color={C.fuchsia} weight={800}>✨ הכפלה צולבת ✨</Say></Pop>
          <Proportion f={f} a="5" b="30" c="8" d={<span style={{ color: C.fuchsia }}>x</span>} cross={ramp(f, T(0.3), 30)} />
          <Pop f={f} start={T(0.55)}><Eq size={66} bg={C.goldSoft}>5 · x = 30 · 8</Eq></Pop>
        </Stage>
      )
    case 'solve':
      return (
        <Stage>
          <Card style={{ width: 560 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.0), node: <Eq size={64}>5x = 240</Eq> },
                { at: T(0.4), node: <Eq size={56}>x = 240 ÷ 5</Eq> },
                { at: T(0.62), node: <Eq size={72} color={C.fuchsia}>x = 48</Eq> },
              ]}
            />
          </Card>
          <Stamp f={f} start={T(0.85)}>48 ₪ 🎉</Stamp>
        </Stage>
      )
    case 'sanity':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={52} color={C.purple} weight={800}>בדיקת שפיות 🧠</Say></Pop>
          <Card style={{ width: 640 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.1), node: <Say size={40}>מחברת אחת: <M>30 ÷ 5 = 6</M> ₪</Say> },
                { at: T(0.5), node: <Say size={40}>שמונה מחברות: <M>8 × 6 = 48</M> ₪</Say> },
              ]}
            />
          </Card>
          <Stamp f={f} start={T(0.85)}>מסתדר ✓</Stamp>
        </Stage>
      )
    case 'brackets':
      return (
        <Stage>
          <Pop f={f} start={T(0.05)}>
            <Proportion f={f} size={70} a={<span>(x + 2)</span>} b="5" c="12" d="10" cross={ramp(f, T(0.42), 24)} />
          </Pop>
          <Card style={{ width: 560 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.48), node: <Eq size={52}>10(x + 2) = 60</Eq> },
                { at: T(0.72), node: <Eq size={52}>x + 2 = 6</Eq> },
                { at: T(0.86), node: <Eq size={62} color={C.fuchsia}>x = 4</Eq> },
              ]}
              gap={10}
            />
          </Card>
        </Stage>
      )
    default:
      return <Recap f={f} lines={[<>אותו סוג גדלים באותו מקום</>, <>כופלים באלכסון ✖️</>, <>פותרים משוואה</>]} formula={<Eq size={56} bg={C.goldSoft} color={C.purple}>a/b = c/d → a·d = b·c</Eq>} />
  }
}
