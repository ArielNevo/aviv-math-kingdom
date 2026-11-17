import React from 'react'
import { C } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp, Steps, draw } from '../components/ui'
import type { VisualFn } from '../Explainer'

const tt = (narr: number, frac: number) => 6 + Math.round(narr * frac)

/** Right triangle with legs a (vertical) and b (horizontal), labels as given. */
const Tri: React.FC<{ f: number; a: string; b: string; c: string; hi?: 'a' | 'b' | 'c'; drawStart?: number; scale?: number }> = ({
  f, a, b, c, hi, drawStart = 0, scale = 1,
}) => {
  const p = ramp(f, drawStart, 30)
  const glow = (k: string) => (hi === k ? C.fuchsia : C.purple)
  return (
    <svg width={460 * scale} height={470 * scale} viewBox="0 0 460 470">
      <path d="M160 410 L310 410 L160 50 Z" fill={C.lilac} stroke={C.purple} strokeWidth="9" strokeLinejoin="round" style={draw(p, 920)} />
      <path d="M160 380 h30 v30" stroke={C.purple} strokeWidth="5" fill="none" opacity={p} />
      <g fontWeight="800" fontSize="50" direction="ltr" opacity={ramp(f, drawStart + 20, 10)}>
        <text x="128" y="250" textAnchor="end" fill={glow('a')}>{a}</text>
        <text x="235" y="462" textAnchor="middle" fill={glow('b')}>{b}</text>
        <text x="272" y="250" textAnchor="start" fill={glow('c')}>{c}</text>
      </g>
    </svg>
  )
}

export const pythLeg: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <Tri f={f} a="?" b="5" c="13" hi="a" />
          <Pop f={f} start={T(0.5)}>
            <Say size={58} color={C.fuchsia} weight={800}>היתר ידוע… חסר ניצב!</Say>
          </Pop>
        </Stage>
      )
    case 'problem':
      return (
        <Stage>
          <Tri f={f} a="?" b="5" c="13" hi="a" />
          <div style={{ display: 'flex', gap: 18 }}>
            <Pop f={f} start={T(0.2)}><Card border={C.fuchsia} style={{ padding: '8px 20px' }}><Say size={38}>יתר = <M color={C.fuchsia}>13</M></Say></Card></Pop>
            <Pop f={f} start={T(0.45)}><Card border={C.violet} style={{ padding: '8px 20px' }}><Say size={38}>ניצב = <M>5</M></Say></Card></Pop>
            <Pop f={f} start={T(0.7)}><Card border={C.gold} style={{ padding: '8px 20px' }}><Say size={38}>ניצב = <M color={C.fuchsia}>?</M></Say></Card></Pop>
          </div>
        </Stage>
      )
    case 'rule':
      return (
        <Stage>
          <Pop f={f} start={4} from="scale">
            <Say size={76} color={C.purple} weight={800}>מחפשים ניצב?</Say>
          </Pop>
          <Pop f={f} start={T(0.18)} from="scale">
            <Say size={92} color={C.fuchsia} weight={800}>מחסרים! ➖</Say>
          </Pop>
          <Pop f={f} start={T(0.45)}>
            <Eq size={80} bg={C.goldSoft} color={C.purple}>b² = c² − a²</Eq>
          </Pop>
        </Stage>
      )
    case 'compute':
      return (
        <Stage>
          <Card style={{ width: 600 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.0), node: <Eq>b² = 13² − 5²</Eq> },
                { at: T(0.12), node: <Eq>b² = 169 − 25 = 144</Eq> },
                { at: T(0.62), node: <Eq size={66} color={C.fuchsia}>b = √144 = 12</Eq> },
              ]}
            />
          </Card>
          <Tri f={f} a="12" b="5" c="13" hi="a" scale={0.62} drawStart={T(0.75)} />
        </Stage>
      )
    case 'check':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={56} color={C.purple} weight={800}>בדיקה מהירה 🔍</Say></Pop>
          <Card style={{ width: 600 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.1), node: <Eq>5² + 12² = 13²</Eq> },
                { at: T(0.4), node: <Eq>25 + 144 = 169</Eq> },
              ]}
            />
          </Card>
          <Stamp f={f} start={T(0.85)}>בול! ✓</Stamp>
        </Stage>
      )
    case 'mistake': {
      const x = pop(f, T(0.72))
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={52} color={C.red} weight={800}>⚠️ הטעות שכולם עושים</Say></Pop>
          <Card border="#fecaca" style={{ width: 600, background: '#fffdf5' }}>
            <Say size={34} color="#6b5a8e" weight={600}>המחברת של דני:</Say>
            <div style={{ position: 'relative', marginTop: 12 }}>
              <Pop f={f} start={T(0.3)}>
                <Eq size={66} style={{ fontFamily: 'Rubik', color: '#334155' }}>7 + 24 = 31</Eq>
              </Pop>
              <svg width="560" height="100" viewBox="0 0 560 100" style={{ position: 'absolute', top: -6, left: 0, opacity: x }}>
                <path d="M70 52 L490 48" stroke={C.red} strokeWidth="8" strokeLinecap="round" opacity="0.85" style={draw(ramp(f, T(0.72), 12), 420)} />
              </svg>
            </div>
          </Card>
          <Pop f={f} start={T(0.78)}>
            <Say size={40}>חיבר <span style={{ color: C.red }}>צלעות</span> במקום <span style={{ color: C.green }}>ריבועים</span>!</Say>
          </Pop>
        </Stage>
      )
    }
    case 'fix':
      return (
        <Stage>
          <Card border="#bbf7d0" style={{ width: 620 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.0), node: <Eq>7² + 24² = c²</Eq> },
                { at: T(0.1), node: <Eq>49 + 576 = 625</Eq> },
                { at: T(0.72), node: <Eq size={66} color={C.green}>c = √625 = 25</Eq> },
              ]}
            />
          </Card>
          <Stamp f={f} start={T(0.9)}>25, לא 31 ✓</Stamp>
        </Stage>
      )
    default:
      return (
        <Recap
          f={f}
          lines={[<>יתר — מחברים ➕</>, <>ניצב — מחסרים ➖</>, <>תמיד עם ריבועים²</>]}
          formula={<Eq size={56} bg={C.goldSoft} color={C.purple}>b = √(c² − a²)</Eq>}
        />
      )
  }
}
