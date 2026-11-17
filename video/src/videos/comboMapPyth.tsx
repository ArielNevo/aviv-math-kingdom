import React from 'react'
import { C } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp, Steps, draw } from '../components/ui'
import type { VisualFn } from '../Explainer'

const tt = (narr: number, frac: number) => 6 + Math.round(narr * frac)

/** Grid map, 40 px per cm. A at (120, 400); 6 cm east → (360, 400); 8 cm north → (360, 80). */
const GridMap: React.FC<{ f: number; legs: number; right: number; hyp: number; labels?: boolean }> = ({ f, legs, right, hyp, labels = true }) => (
  <svg width="600" height="500" viewBox="0 0 600 500">
    <rect x="10" y="10" width="580" height="480" rx="24" fill="#fdf3dc" stroke="#d6b77a" strokeWidth="6" />
    {Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={40 + i * 40} y1="30" x2={40 + i * 40} y2="470" stroke="#e7d3a6" strokeWidth="2" />)}
    {Array.from({ length: 11 }, (_, i) => <line key={'h' + i} x1="30" y1={40 + i * 40} x2="570" y2={40 + i * 40} stroke="#e7d3a6" strokeWidth="2" />)}
    {/* compass */}
    <g transform="translate(478 92)">
      <circle r="42" fill="#fff" stroke={C.purple} strokeWidth="4" />
      <path d="M0 -32 L9 0 L0 32 L-9 0 Z" fill={C.fuchsia} />
      <text y="-48" textAnchor="middle" fontSize="24" fontWeight="800" fill={C.purple} direction="rtl">צ</text>
      <text x="56" y="8" textAnchor="middle" fontSize="24" fontWeight="800" fill={C.purple} direction="rtl">מז</text>
    </g>
    <path d="M120 400 L360 400" stroke={C.violet} strokeWidth="10" strokeLinecap="round" style={draw(legs, 240)} />
    <path d="M360 400 L360 80" stroke={C.violet} strokeWidth="10" strokeLinecap="round" style={draw(Math.max(0, legs * 2 - 1), 320)} />
    {right > 0 && <path d="M330 400 v-30 h30" stroke={C.purple} strokeWidth="5" fill="none" opacity={right} />}
    <path d="M120 400 L360 80" stroke={C.fuchsia} strokeWidth="10" strokeLinecap="round" strokeDasharray="18 12" opacity={hyp > 0 ? 1 : 0} style={{ strokeDashoffset: (1 - hyp) * 400 }} />
    {labels && (
      <g fontSize="34" fontWeight="800">
        <text x="240" y="446" textAnchor="middle" fill={C.violet} direction="rtl" opacity={legs}>6 ס״מ מזרחה</text>
        <text x="380" y="250" textAnchor="end" fill={C.violet} direction="rtl" opacity={legs}>8 ס״מ</text>
        <text x="380" y="288" textAnchor="end" fill={C.violet} direction="rtl" opacity={legs}>צפונה</text>
      </g>
    )}
    {[[120, 400, 'א'], [360, 80, 'ב']].map(([x, y, n], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${pop(f, 2 + i * 5)})`}>
        <circle r="22" fill={C.fuchsia} stroke="#fff" strokeWidth="5" />
        <text y="10" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">{n}</text>
      </g>
    ))}
    <g transform="translate(40 40)">
      <rect width="170" height="46" rx="12" fill={C.purple} />
      <text x="85" y="32" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">1:50,000</text>
    </g>
  </svg>
)

export const comboMapPyth: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <Pop f={f} start={2} from="scale"><Say size={54} color={C.fuchsia} weight={800}>⚔️ שאלת בוס!</Say></Pop>
          <GridMap f={f} legs={ramp(f, T(0.45), 40)} right={0} hyp={0} />
        </Stage>
      )
    case 'spot':
      return (
        <Stage>
          <GridMap f={f} legs={1} right={ramp(f, T(0.25), 10)} hyp={ramp(f, T(0.55), 30)} />
          <Pop f={f} start={T(0.3)}><Say size={46}>מזרחה + צפונה = <span style={{ color: C.purple }}>זווית ישרה</span> ⦜</Say></Pop>
        </Stage>
      )
    case 'pyth':
      return (
        <Stage>
          <GridMap f={f} legs={1} right={1} hyp={1} labels={false} />
          <Card style={{ width: 640, padding: '14px 20px' }}>
            <Steps
              f={f}
              gap={8}
              items={[
                { at: T(0.05), node: <Eq size={42}>6² + 8² = 36 + 64 = 100</Eq> },
                { at: T(0.7), node: <Eq size={56} color={C.fuchsia}>√100 = 10</Eq> },
              ]}
            />
          </Card>
        </Stage>
      )
    case 'scale':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={50} color={C.purple} weight={800}>עכשיו קנה מידה ✖️</Say></Pop>
          <Pop f={f} start={T(0.3)}><Card border={C.gold} style={{ padding: '12px 26px' }}><Say size={42}><M>10 × 50,000 = 500,000</M> ס״מ</Say></Card></Pop>
        </Stage>
      )
    case 'convert':
      return (
        <Stage>
          <Card style={{ width: 640 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.02), node: <Say size={42}><M>500,000 ÷ 100 = 5,000</M> מ׳</Say> },
                { at: T(0.5), node: <Say size={42}><M>5,000 ÷ 1000 = <span style={{ color: C.fuchsia }}>5</span></M> ק״מ</Say> },
              ]}
            />
          </Card>
          <Stamp f={f} start={T(0.85)}>5 ק״מ! 🏆</Stamp>
        </Stage>
      )
    case 'order':
      return (
        <Stage>
          {['פיתגורס במפה 📐', 'קנה מידה ✖️', 'המרת יחידות 🔁'].map((t, i) => (
            <Pop key={i} f={f} start={T(0.15 + i * 0.25)}>
              <Card border={[C.violet, C.fuchsia, C.gold][i]} style={{ width: 520, display: 'flex', alignItems: 'center', gap: 20, padding: '18px 26px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: [C.violet, C.fuchsia, C.gold][i], color: '#fff', fontSize: 38, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{i + 1}</div>
                <Say size={44}>{t}</Say>
              </Card>
            </Pop>
          ))}
        </Stage>
      )
    default:
      return <Recap f={f} lines={[<>שאלת בוס = צעדים קטנים</>, <>אחד אחרי השני</>, <>ואת יודעת את כולם! 👑</>]} />
  }
}
