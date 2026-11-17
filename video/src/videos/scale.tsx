import React from 'react'
import { C, fontFamily } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp, Steps, draw } from '../components/ui'
import type { VisualFn } from '../Explainer'

const tt = (narr: number, frac: number) => 6 + Math.round(narr * frac)

/** Parchment map with two villages 4 cm apart (60 px per cm) and a ruler. */
const MapCard: React.FC<{ f: number; ruler: number; scale?: string; q?: number }> = ({ f, ruler, scale = '1:50,000', q = 0 }) => (
  <svg width="640" height="420" viewBox="0 0 640 420">
    <rect x="10" y="10" width="620" height="400" rx="26" fill="#fdf3dc" stroke="#d6b77a" strokeWidth="6" />
    <path d="M30 300 C150 250 230 340 360 290 S560 240 610 280" stroke="#93c5fd" strokeWidth="18" fill="none" opacity="0.7" />
    {[[90, 90], [520, 110], [470, 350], [130, 340]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`} opacity="0.55">
        <path d="M0 -22 L16 8 L-16 8 Z" fill="#86efac" />
        <path d="M0 -10 L20 22 L-20 22 Z" fill="#4ade80" />
      </g>
    ))}
    {/* villages: A at x=200, B at x=440 → 240 px = 4 cm */}
    <path d="M200 190 L440 190" stroke={C.purple} strokeWidth="6" strokeDasharray="14 10" style={draw(ramp(f, 6, 20), 240)} />
    {[200, 440].map((x, i) => (
      <g key={x} transform={`translate(${x} 190) scale(${pop(f, 2 + i * 6)})`}>
        <path d="M-24 6 L0 -20 L24 6 Z" fill={C.fuchsia} />
        <rect x="-18" y="6" width="36" height="26" fill="#fff" stroke={C.fuchsia} strokeWidth="4" />
        <rect x="-5" y="16" width="10" height="16" fill={C.fuchsia} />
      </g>
    ))}
    {/* ruler */}
    <g opacity={ruler} transform={`translate(0 ${(1 - ruler) * 20})`}>
      <rect x="190" y="240" width="270" height="56" rx="8" fill={C.gold} stroke="#b45309" strokeWidth="3" />
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <line x1={200 + i * 60} y1="240" x2={200 + i * 60} y2="266" stroke="#78350f" strokeWidth="4" />
          <text x={200 + i * 60} y="290" textAnchor="middle" fontSize="20" fontWeight="800" fill="#78350f">{i}</text>
        </g>
      ))}
      <text x="320" y="230" textAnchor="middle" fontSize="38" fontWeight="800" fill={C.purple} direction="rtl">4 ס״מ</text>
    </g>
    <g transform="translate(470 40)">
      <rect width="140" height="46" rx="12" fill={C.purple} />
      <text x="70" y="32" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" direction="ltr">{scale}</text>
    </g>
    {q > 0 && <text x="320" y="150" textAnchor="middle" fontSize="80" fontWeight="800" fill={C.fuchsia} opacity={q}>?</text>}
  </svg>
)

/** cm → m → km staircase. */
const UnitStairs: React.FC<{ f: number; start: number; vals?: string[]; valsAt?: number[] }> = ({ f, start, vals, valsAt = [] }) => {
  const units = ['ס״מ', 'מ׳', 'ק״מ']
  const ops = ['÷ 100', '÷ 1000']
  return (
    <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily }}>
      {units.map((u, i) => (
        <React.Fragment key={u}>
          <div style={{ transform: `scale(${pop(f, start + i * 14)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 128, height: 100, borderRadius: 24, background: [C.violet, C.fuchsia, '#d97706'][i], color: '#fff', display: 'grid', placeItems: 'center', fontSize: 46, fontWeight: 800 }}>{u}</div>
            {vals && <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, opacity: ramp(f, valsAt[i] ?? 1e9, 8) }}><M>{vals[i]}</M></div>}
          </div>
          {i < 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ramp(f, start + i * 14 + 8, 10) }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.purple }}><M>{ops[i]}</M></div>
              <div style={{ fontSize: 46, color: C.gold, lineHeight: 1 }}>⬅</div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export const scaleMap: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <MapCard f={f} ruler={ramp(f, T(0.2), 14)} scale="1 : ???" q={ramp(f, T(0.5), 8)} />
          <Pop f={f} start={T(0.75)}><Say size={46} color={C.fuchsia} weight={800}>בלי קנה מידה — אין לדעת!</Say></Pop>
        </Stage>
      )
    case 'meaning':
      return (
        <Stage>
          <Pop f={f} start={4} from="scale"><Eq size={96} color={C.purple} bg={C.goldSoft}>1 : 50,000</Eq></Pop>
          <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Pop f={f} start={T(0.35)}><Card border={C.violet}><Say size={42}>במפה<br /><M color={C.violet}>1</M> ס״מ</Say></Card></Pop>
            <Pop f={f} start={T(0.5)}><div style={{ fontSize: 60, color: C.gold }}>⬅</div></Pop>
            <Pop f={f} start={T(0.6)}><Card border={C.fuchsia}><Say size={42}>במציאות<br /><M color={C.fuchsia}>50,000</M> ס״מ</Say></Card></Pop>
          </div>
        </Stage>
      )
    case 'multiply':
      return (
        <Stage>
          <MapCard f={f} ruler={1} />
          <Pop f={f} start={T(0.05)}><Say size={50} color={C.purple} weight={800}>ממפה למציאות — כופלים ✖️</Say></Pop>
          <Pop f={f} start={T(0.4)}><Card border={C.gold} style={{ padding: '10px 26px' }}><Say size={42}><M>4 × 50,000 = 200,000</M> ס״מ</Say></Card></Pop>
        </Stage>
      )
    case 'table':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={50} color={C.purple} weight={800}>הטבלה שחוסכת טעויות 🛡️</Say></Pop>
          <UnitStairs f={f} start={T(0.25)} />
        </Stage>
      )
    case 'convert':
      return (
        <Stage>
          <UnitStairs f={f} start={0} vals={['200,000', '2,000', '2']} valsAt={[2, T(0.3), T(0.65)]} />
          <Stamp f={f} start={T(0.8)}>2 ק״מ! 🎉</Stamp>
        </Stage>
      )
    case 'reverse':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={50} color={C.purple} weight={800}>ממציאות למפה — מחלקים ➗</Say></Pop>
          <Pop f={f} start={T(0.2)}><Card border={C.gold} style={{ padding: '10px 26px' }}><Say size={44}><M>5</M> ק״מ, מפה <M color={C.purple}>1 : 25,000</M></Say></Card></Pop>
          <Card style={{ width: 650, padding: '22px 16px' }}>
            <Steps
              f={f}
              items={[
                { at: T(0.45), node: <Say size={40}><M>5</M> ק״מ = <M>500,000</M> ס״מ</Say> },
                { at: T(0.72), node: <Say size={40}><M>500,000 ÷ 25,000 = 20</M> ס״מ</Say> },
              ]}
            />
          </Card>
        </Stage>
      )
    default:
      return <Recap f={f} lines={[<>ממפה למציאות — כופלים</>, <>ממציאות למפה — מחלקים</>, <>ס״מ ← מ׳ ← ק״מ</>]} formula={<Eq size={54} bg={C.goldSoft} color={C.purple}>÷ 100 , ÷ 1000</Eq>} />
  }
}

/** A blueprint square of side `px` with grid. */
const Blueprint: React.FC<{ f: number; label: string; px: number; grid?: number; start?: number; color?: string }> = ({ f, label, px, grid = 2, start = 0, color = C.violet }) => {
  const p = pop(f, start)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily }}>
      <svg width={px + 20} height={px + 20} viewBox={`-10 -10 ${px + 20} ${px + 20}`} style={{ transform: `scale(${p})` }}>
        <rect width={px} height={px} fill="#e0f2fe" stroke={color} strokeWidth="6" />
        {Array.from({ length: grid - 1 }, (_, i) => (
          <g key={i}>
            <line x1={((i + 1) * px) / grid} y1="0" x2={((i + 1) * px) / grid} y2={px} stroke={color} strokeWidth="2" opacity="0.5" />
            <line y1={((i + 1) * px) / grid} x1="0" y2={((i + 1) * px) / grid} x2={px} stroke={color} strokeWidth="2" opacity="0.5" />
          </g>
        ))}
      </svg>
      <div dir="rtl" style={{ fontSize: 36, fontWeight: 800, color }}>{label}</div>
    </div>
  )
}

export const scaleArea: VisualFn = (key, f, _d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <Pop f={f} start={4}><Eq size={70} color={C.purple} bg={C.goldSoft}>1 : 100</Eq></Pop>
          <Blueprint f={f} px={200} start={T(0.4)} label="2 ס״מ × 2 ס״מ" />
          <Pop f={f} start={T(0.85)}><Say size={50} color={C.fuchsia} weight={800}>מה השטח האמיתי? 🤔</Say></Pop>
        </Stage>
      )
    case 'lengths':
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={50} color={C.purple} weight={800}>כל אורך × 100</Say></Pop>
          <Pop f={f} start={T(0.25)}><Card border={C.gold} style={{ padding: '10px 26px' }}><Say size={46}><M>2</M> ס״מ ← <M>200</M> ס״מ = <M color={C.fuchsia}>2</M> מ׳</Say></Card></Pop>
          <Blueprint f={f} px={300} start={T(0.6)} label="2 מ׳ × 2 מ׳" color={C.fuchsia} />
        </Stage>
      )
    case 'areas':
      return (
        <Stage>
          <div dir="rtl" style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <Pop f={f} start={T(0.02)}><Card border={C.violet}><Say size={38}>בשרטוט<br /><M color={C.violet}>4</M> סמ״ר</Say></Card></Pop>
            <Pop f={f} start={T(0.25)}><div style={{ fontSize: 56, color: C.gold }}>⬅</div></Pop>
            <Pop f={f} start={T(0.3)}><Card border={C.fuchsia}><Say size={38}>במציאות<br /><M color={C.fuchsia}>40,000</M> סמ״ר<br />= <M>4</M> מ״ר</Say></Card></Pop>
          </div>
          <Stamp f={f} start={T(0.7)} color={C.fuchsia} size={52}>פי 10,000 — לא פי 100!</Stamp>
        </Stage>
      )
    case 'why': {
      const g = ramp(f, T(0.3), 30)
      return (
        <Stage>
          <Pop f={f} start={4}><Say size={46}>שטח = אורך × רוחב</Say></Pop>
          <div style={{ position: 'relative' }}>
            <svg width="270" height="270" viewBox="0 0 400 400">
              {Array.from({ length: 100 }, (_, i) => (
                <rect key={i} x={(i % 10) * 40 + 2} y={Math.floor(i / 10) * 40 + 2} width="36" height="36" rx="5" fill={i % 2 ? '#c4b5fd' : '#f9a8d4'} opacity={i / 100 < g ? 1 : 0.08} />
              ))}
            </svg>
          </div>
          <Pop f={f} start={T(0.5)}><Eq size={60} bg={C.goldSoft}>100 × 100 = 10,000</Eq></Pop>
          <Pop f={f} start={T(0.75)}><Say size={40} color={C.fuchsia} weight={800}>שטח: קנה המידה בריבוע!</Say></Pop>
        </Stage>
      )
    }
    case 'example':
      return (
        <Stage>
          <Card style={{ width: 640 }}>
            <Steps
              f={f}
              items={[
                { at: T(0.02), node: <Say size={42}><M>6</M> סמ״ר בשרטוט <M color={C.purple}>1 : 100</M></Say> },
                { at: T(0.32), node: <Say size={42}><M>6 × 10,000 = 60,000</M> סמ״ר</Say> },
                { at: T(0.62), node: <Say size={42}><M>1</M> מ״ר = <M>10,000</M> סמ״ר</Say> },
                { at: T(0.85), node: <Say size={52} color={C.fuchsia} weight={800}>= <M>6</M> מ״ר</Say> },
              ]}
            />
          </Card>
        </Stage>
      )
    default:
      return (
        <Recap
          f={f}
          lines={[<>אורך: × קנה המידה</>, <>שטח: × קנה המידה²</>, <>1 מ״ר = 10,000 סמ״ר</>]}
          formula={<Eq size={60} bg={C.goldSoft} color={C.purple}>100² = 10,000</Eq>}
        />
      )
  }
}
