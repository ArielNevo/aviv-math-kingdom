import React from 'react'
import { C } from '../theme'
import { pop, ramp } from '../anim'
import { Card, Eq, M, Pop, Recap, Say, Stage, Stamp, Steps, draw } from '../components/ui'
import type { VisualFn } from '../Explainer'

const D = 6 // audio delay
const tt = (narr: number, frac: number) => D + Math.round(narr * frac)

/** The 40 × 30 field, drawn at 10 px per meter. */
const Field: React.FC<{ f: number; narr: number; mode: 'run' | 'tri' | 'answer' }> = ({ f, narr, mode }) => {
  const x0 = 120, y0 = 90, w = 400, h = 300
  const run = mode === 'run' ? ramp(f, tt(narr, 0.55), 40) : 1
  const diag = mode === 'run' ? ramp(f, tt(narr, 0.8), 25) : ramp(f, 4, 25)
  const tri = mode === 'tri' ? ramp(f, tt(narr, 0.2), 20) : mode === 'answer' ? 1 : 0
  const legs = mode === 'tri' ? pop(f, tt(narr, 0.38)) : 0
  const hyp = mode === 'tri' ? pop(f, tt(narr, 0.68)) : 0
  const pathLen = h + w
  // runner dot along the sides: bottom-right → top-right → top-left
  const dist = run * pathLen
  const dot = dist < h ? { x: x0 + w, y: y0 + h - dist } : { x: x0 + w - (dist - h), y: y0 }
  return (
    <svg width="660" height="470" viewBox="0 0 640 470">
      <rect x={x0} y={y0} width={w} height={h} rx="8" fill={C.grass} stroke={C.green} strokeWidth="6" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x0 + i * 50} y={y0} width="25" height={h} fill="#bbf7d0" opacity="0.5" />
      ))}
      {tri > 0 && <path d={`M${x0} ${y0} L${x0 + w} ${y0 + h} L${x0} ${y0 + h} Z`} fill={C.violet} opacity={0.22 * tri} />}
      {tri > 0 && <path d={`M${x0} ${y0 + h - 30} h30 v30`} stroke={C.purple} strokeWidth="5" fill="none" opacity={tri} />}
      {mode === 'run' && (
        <path d={`M${x0 + w} ${y0 + h} L${x0 + w} ${y0} L${x0} ${y0}`} stroke={C.gold} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="20 14" style={{ opacity: run > 0 ? 1 : 0 }} />
      )}
      <path d={`M${x0 + w} ${y0 + h} L${x0} ${y0}`} stroke={C.fuchsia} strokeWidth="10" fill="none" strokeLinecap="round" style={draw(diag, 500)} />
      {/* labels */}
      <text x={x0 + w / 2} y={y0 + h + 52} textAnchor="middle" fontSize="38" fontWeight="800" fill={C.ink} direction="rtl">40 מ׳</text>
      <text x={x0 + w + 22} y={y0 + h / 2 + 12} textAnchor="end" fontSize="38" fontWeight="800" fill={C.ink} direction="rtl">30 מ׳</text>
      {mode === 'tri' && (
        <g fontWeight="800" fontSize="36">
          <text x={x0 + w / 2} y={y0 + h - 16} textAnchor="middle" fill={C.purple} direction="rtl" opacity={legs} transform={`translate(0 ${(1 - legs) * 20})`}>ניצב</text>
          <text x={x0 - 14} y={y0 + h / 2 + 12} textAnchor="start" fill={C.purple} direction="rtl" opacity={legs}>ניצב</text>
          <g opacity={hyp} transform={`translate(${x0 + w / 2 + 10} ${y0 + h / 2 - 20}) scale(${0.5 + 0.5 * hyp})`}>
            <rect x="-60" y="-34" width="120" height="50" rx="14" fill={C.fuchsia} />
            <text x="0" y="5" textAnchor="middle" fill="#fff" direction="rtl">יתר</text>
          </g>
        </g>
      )}
      {mode === 'run' && diag > 0.6 && (
        <text x={x0 + w / 2 + 20} y={y0 + h / 2 - 12} textAnchor="middle" fontSize="72" fontWeight="800" fill={C.fuchsia} opacity={ramp(f, tt(narr, 0.9), 8)}>?</text>
      )}
      {mode === 'answer' && (
        <g transform={`translate(${x0 + w / 2 + 70} ${y0 + h / 2 - 50})`}><rect x="-62" y="-34" width="124" height="50" rx="14" fill={C.fuchsia} /><text x="0" y="5" textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" direction="rtl">50 מ׳</text></g>
      )}
      {/* Aviv as a crowned dot */}
      <g transform={`translate(${dot.x} ${dot.y})`}>
        <circle r="18" fill={C.fuchsia} stroke="#fff" strokeWidth="5" />
        <text y="-24" textAnchor="middle" fontSize="30">👑</text>
      </g>
    </svg>
  )
}

/** 3-4-5 triangle with growing squares on each side (unit = 34 px). */
const Squares: React.FC<{ f: number; narr: number }> = ({ f, narr }) => {
  const u = 46
  const ox = 175, oy = 345 // right-angle corner
  const g1 = ramp(f, tt(narr, 0.25), 18), g2 = ramp(f, tt(narr, 0.33), 18), g3 = ramp(f, tt(narr, 0.5), 22)
  const grid = (n: number, color: string) =>
    Array.from({ length: n * n }, (_, i) => (
      <rect key={i} x={(i % n) * u} y={Math.floor(i / n) * u} width={u - 3} height={u - 3} rx="4" fill={color} />
    ))
  // triangle: A=(ox,oy) right angle, B=(ox+4u, oy) , Cc=(ox, oy-3u)
  const ang = (Math.atan2(3, 4) * 180) / Math.PI // direction of the hypotenuse from C to B
  return (
    <svg width="640" height="590" viewBox="0 0 660 600">
      {/* square on vertical leg (3), grows leftwards from the leg */}
      <g transform={`translate(${ox} ${oy - 3 * u}) scale(${g1} 1) translate(${-3 * u} 0)`}>{grid(3, '#c4b5fd')}</g>
      {/* square on horizontal leg (4), grows downwards */}
      <g transform={`translate(${ox} ${oy}) scale(1 ${g2})`}>{grid(4, '#f9a8d4')}</g>
      {/* square on hypotenuse (5), grows outwards from the hypotenuse */}
      <g transform={`translate(${ox} ${oy - 3 * u}) rotate(${ang}) scale(1 ${g3}) translate(0 ${-5 * u})`}>{grid(5, '#fde68a')}</g>
      <path d={`M${ox} ${oy} L${ox + 4 * u} ${oy} L${ox} ${oy - 3 * u} Z`} fill="#fff" stroke={C.purple} strokeWidth="6" strokeLinejoin="round" />
      <path d={`M${ox} ${oy - 22} h22 v22`} stroke={C.purple} strokeWidth="4" fill="none" />
      <g fontWeight="800" fontSize="40">
        <text x={ox - 1.5 * u} y={oy - 1.5 * u + 14} textAnchor="middle" fill={C.purple} opacity={g1}>9</text>
        <text x={ox + 2 * u} y={oy + 2 * u + 14} textAnchor="middle" fill={C.fuchsia} opacity={g2}>16</text>
        <text x={ox + 3.5 * u} y={oy - 3.5 * u + 14} textAnchor="middle" fill="#b45309" opacity={g3}>25</text>
      </g>
    </svg>
  )
}

export const pythHypotenuse: VisualFn = (key, f, d, narr) => {
  const T = (x: number) => tt(narr, x)
  switch (key) {
    case 'intro':
      return (
        <Stage>
          <Pop f={f} start={4} from="scale">
            <svg width="420" height="330" viewBox="0 0 420 330">
              <path d="M40 300 L380 300 L40 40 Z" fill={C.lilac} stroke={C.purple} strokeWidth="10" strokeLinejoin="round" style={draw(ramp(f, 4, 30), 1200)} />
              <path d="M40 270 h30 v30" stroke={C.purple} strokeWidth="6" fill="none" />
              <path d="M380 300 L40 40" stroke={C.fuchsia} strokeWidth="14" strokeLinecap="round" style={draw(ramp(f, T(0.45), 20), 430)} />
            </svg>
          </Pop>
          <Pop f={f} start={T(0.45)}>
            <Say size={64} color={C.fuchsia} weight={800}>מה זה יתר? 🤔</Say>
          </Pop>
        </Stage>
      )
    case 'field':
      return (
        <Stage>
          <Field f={f} narr={narr} mode="run" />
          <Pop f={f} start={T(0.6)}>
            <Say size={40}>לאורך הצלעות: <M color={C.gold}>30 + 40 = 70</M> מ׳</Say>
          </Pop>
        </Stage>
      )
    case 'triangle':
      return (
        <Stage>
          <Field f={f} narr={narr} mode="tri" />
          <Pop f={f} start={T(0.82)}>
            <Card border={C.fuchsia} style={{ padding: '14px 26px', width: 620 }}>
              <Say size={34}>היתר: מול הזווית הישרה<br /><span style={{ color: C.fuchsia }}>ותמיד הצלע הארוכה ביותר</span></Say>
            </Card>
          </Pop>
        </Stage>
      )
    case 'squares':
      return (
        <Stage style={{ gap: 0 }}>
          <Squares f={f} narr={narr} />
          <Pop f={f} start={T(0.72)}>
            <Eq size={64} bg={C.goldSoft}>9 + 16 = 25</Eq>
          </Pop>
        </Stage>
      )
    case 'formula':
      return (
        <Stage>
          <Pop f={f} start={4} from="scale">
            <svg width="420" height="300" viewBox="0 0 420 300">
              <path d="M60 260 L360 260 L60 40 Z" fill="#fff" stroke={C.purple} strokeWidth="8" strokeLinejoin="round" />
              <path d="M60 232 h28 v28" stroke={C.purple} strokeWidth="5" fill="none" />
              <g fontSize="48" fontWeight="800" fontStyle="italic">
                <text x="30" y="160" fill={C.violet}>a</text>
                <text x="200" y="300" fill={C.violet}>b</text>
                <text x="225" y="135" fill={C.fuchsia}>c</text>
              </g>
            </svg>
          </Pop>
          <Pop f={f} start={T(0.35)} from="scale">
            <Eq size={86} color={C.purple} bg={C.goldSoft} style={{ boxShadow: `0 0 ${20 + 14 * Math.sin(f / 6)}px rgba(245,179,1,0.7)` }}>
              a² + b² = <span style={{ color: C.fuchsia }}>c²</span>
            </Eq>
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
                { at: T(0.0), node: <Eq>30² = 900</Eq> },
                { at: T(0.24), node: <Eq>40² = 1600</Eq> },
                { at: T(0.48), node: <Eq>900 + 1600 = 2500</Eq> },
                { at: T(0.7), node: <Eq color={C.fuchsia} size={64}>√2500 = 50</Eq> },
              ]}
            />
          </Card>
        </Stage>
      )
    case 'answer':
      return (
        <Stage>
          <Field f={f} narr={narr} mode="answer" />
          <div style={{ display: 'flex', gap: 22 }}>
            <Pop f={f} start={T(0.0)}><Card border={C.fuchsia} style={{ padding: '8px 22px' }}><Say size={42} color={C.fuchsia}>באלכסון: <M>50</M> מ׳</Say></Card></Pop>
            <Pop f={f} start={T(0.3)}><Card border={C.gold} style={{ padding: '8px 22px' }}><Say size={42}>בצלעות: <M>70</M> מ׳</Say></Card></Pop>
          </div>
          <Stamp f={f} start={T(0.55)} color={C.green}>חסכת 20 מ׳! 🏃‍♀️</Stamp>
        </Stage>
      )
    default:
      return (
        <Recap
          f={f}
          lines={[<>מחפשים יתר?</>, <>מחברים את הריבועים</>, <>ומוציאים שורש √</>]}
          formula={<Eq size={60} bg={C.goldSoft} color={C.purple}>c = √(a² + b²)</Eq>}
        />
      )
  }
}
