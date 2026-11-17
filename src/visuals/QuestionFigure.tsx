import { motion } from 'framer-motion'
import type { Figure } from '../lib/types'

const P = '#6d28d9'
const GOLD = '#f5b301'
const PINK = '#db2777'
const INK = '#2e1065'

const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.8, ease: 'easeOut' as const } }

function Label({ x, y, t, color = INK, size = 15 }: { x: number; y: number; t: string; color?: string; size?: number }) {
  const unknown = t === '?'
  return (
    <g>
      {unknown && <circle cx={x} cy={y - 5} r={12} fill={PINK} opacity={0.15} />}
      <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={800} fill={unknown ? PINK : color} direction={/[\u0590-\u05FF]/.test(t) ? 'rtl' : 'ltr'}>
        {t}
      </text>
    </g>
  )
}

const RightAngle = ({ x, y, dx = 1, dy = -1 }: { x: number; y: number; dx?: number; dy?: number }) => (
  <path d={`M${x + 12 * dx} ${y} v${12 * dy} h${-12 * dx}`} fill="none" stroke={INK} strokeWidth={1.5} />
)

export function QuestionFigure({ figure }: { figure: Figure }) {
  return (
    <div className="mx-auto my-2 w-full max-w-[300px]" aria-hidden>
      <svg viewBox="0 0 300 190" className="h-auto w-full">
        <Inner f={figure} />
      </svg>
    </div>
  )
}

function Inner({ f }: { f: Figure }) {
  switch (f.kind) {
    case 'triangle':
      // right angle at bottom-left (in screen coords bottom-right feels RTL-natural)
      return (
        <g>
          <motion.path d="M240 160 L60 160 L240 30 Z" fill="#ede9fe" stroke={P} strokeWidth={3} strokeLinejoin="round" {...draw} />
          <RightAngle x={240} y={160} dx={-1} dy={-1} />
          <Label x={150} y={182} t={f.a} />
          <Label x={266} y={100} t={f.b} />
          <Label x={130} y={84} t={f.c} color={PINK} />
        </g>
      )
    case 'rect': {
      const w = f.square ? 130 : 190
      const h = 120
      const x0 = 150 - w / 2,
        y0 = 30
      return (
        <g>
          <motion.rect x={x0} y={y0} width={w} height={h} fill="#ede9fe" stroke={P} strokeWidth={3} rx={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <motion.path d={`M${x0} ${y0 + h} L${x0 + w} ${y0}`} stroke={PINK} strokeWidth={3} strokeDasharray="6 5" {...draw} />
          <Label x={150} y={y0 + h + 22} t={f.w} />
          <Label x={x0 + w + 24} y={y0 + h / 2 + 5} t={f.h} />
          <Label x={150 - 18} y={y0 + h / 2 - 8} t={f.d} color={PINK} />
        </g>
      )
    }
    case 'rhombus':
      return (
        <g>
          <path d="M150 15 L250 95 L150 175 L50 95Z" fill="#ede9fe" stroke={P} strokeWidth={3} />
          <motion.path d="M150 15 V175 M50 95 H250" stroke={GOLD} strokeWidth={2.5} strokeDasharray="5 4" {...draw} />
          <RightAngle x={150} y={95} dx={1} dy={-1} />
          <Label x={100} y={88} t={f.d1 + ' ÷ 2'} size={12} />
          <Label x={172} y={140} t={f.d2 + ' ÷ 2'} size={12} />
          <Label x={218} y={48} t={f.side} color={PINK} />
          <text x={8} y={186} fontSize={11} fill="#6b7280" direction="rtl" textAnchor="start">
            {`אלכסונים: ${f.d1}, ${f.d2}`}
          </text>
        </g>
      )
    case 'isosceles':
      return (
        <g>
          <path d="M150 20 L250 160 L50 160Z" fill="#ede9fe" stroke={P} strokeWidth={3} strokeLinejoin="round" />
          <motion.path d="M150 20 V160" stroke={PINK} strokeWidth={2.5} strokeDasharray="6 4" {...draw} />
          <RightAngle x={150} y={160} dx={1} dy={-1} />
          <Label x={84} y={86} t={f.leg} />
          <Label x={216} y={86} t={f.leg} />
          <Label x={150} y={182} t={f.base} />
          <Label x={166} y={100} t={f.h} color={PINK} />
        </g>
      )
    case 'points': {
      const xs = [f.ax, f.bx],
        ys = [f.ay, f.by]
      const minX = Math.min(...xs, 0) - 1,
        maxX = Math.max(...xs, 0) + 1
      const minY = Math.min(...ys, 0) - 1,
        maxY = Math.max(...ys, 0) + 1
      const sx = (x: number) => 20 + ((x - minX) / (maxX - minX)) * 260
      const sy = (y: number) => 175 - ((y - minY) / (maxY - minY)) * 160
      return (
        <g>
          <line x1={sx(minX)} y1={sy(0)} x2={sx(maxX)} y2={sy(0)} stroke="#9ca3af" strokeWidth={1.5} />
          <line x1={sx(0)} y1={sy(minY)} x2={sx(0)} y2={sy(maxY)} stroke="#9ca3af" strokeWidth={1.5} />
          <motion.path d={`M${sx(f.ax)} ${sy(f.ay)} L${sx(f.bx)} ${sy(f.ay)} L${sx(f.bx)} ${sy(f.by)}`} fill="none" stroke={GOLD} strokeWidth={2.5} strokeDasharray="5 4" {...draw} />
          <motion.path d={`M${sx(f.ax)} ${sy(f.ay)} L${sx(f.bx)} ${sy(f.by)}`} stroke={PINK} strokeWidth={3} {...draw} />
          <circle cx={sx(f.ax)} cy={sy(f.ay)} r={5} fill={P} />
          <circle cx={sx(f.bx)} cy={sy(f.by)} r={5} fill={P} />
          <Label x={sx(f.ax)} y={sy(f.ay) - 10} t="A" />
          <Label x={sx(f.bx)} y={sy(f.by) - 10} t="B" />
          <Label x={(sx(f.ax) + sx(f.bx)) / 2} y={sy(f.ay) + (f.by > f.ay ? 18 : -8)} t="Δx" color="#92400e" size={12} />
          <Label x={sx(f.bx) + (f.bx > f.ax ? 16 : -16)} y={(sy(f.ay) + sy(f.by)) / 2} t="Δy" color="#92400e" size={12} />
        </g>
      )
    }
    case 'ladder':
      if (f.item === 'tower')
        return (
          <g>
            <rect x={60} y={30} width={26} height={135} fill="#c4b5fd" stroke={P} strokeWidth={2} />
            <path d="M56 30 l17 -18 17 18Z" fill={GOLD} />
            <path d="M86 165 L250 165" stroke="#374151" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
            <motion.path d="M73 30 L250 165" stroke={PINK} strokeWidth={2.5} strokeDasharray="6 4" {...draw} />
            <Label x={36} y={100} t={f.height} />
            <Label x={170} y={186} t={f.base} />
            <Label x={176} y={86} t={f.len} color={PINK} />
          </g>
        )
      return (
        <g>
          <line x1={20} y1={168} x2={290} y2={168} stroke="#9ca3af" strokeWidth={3} />
          {f.item === 'ladder' ? (
            <>
              <rect x={232} y={15} width={22} height={153} fill="#e5e7eb" stroke="#9ca3af" />
              <motion.g {...{ initial: { opacity: 0 }, animate: { opacity: 1 } }}>
                <line x1={110} y1={168} x2={232} y2={28} stroke={P} strokeWidth={5} strokeLinecap="round" />
                {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t) => (
                  <line key={t} x1={110 + 122 * t - 8} y1={168 - 140 * t} x2={110 + 122 * t + 6} y2={168 - 140 * t + 4} stroke={P} strokeWidth={3} />
                ))}
              </motion.g>
            </>
          ) : (
            <>
              <circle cx={70} cy={150} r={8} fill={PINK} />
              <path d="M70 158 v10" stroke={PINK} strokeWidth={4} />
              <motion.path d="M70 150 L240 30" stroke={P} strokeWidth={2} {...draw} />
              <path d="M240 10 l18 20 -18 20 -18 -20Z" fill={GOLD} stroke="#b45309" />
              <line x1={240} y1={30} x2={240} y2={150} stroke="#9ca3af" strokeDasharray="4 4" />
            </>
          )}
          <Label x={f.item === 'ladder' ? 170 : 155} y={188} t={f.base} />
          <Label x={f.item === 'ladder' ? 272 : 262} y={100} t={f.height} />
          <Label x={f.item === 'ladder' ? 150 : 140} y={80} t={f.len} color={PINK} />
        </g>
      )
    case 'map':
      return (
        <g>
          <rect x={10} y={8} width={280} height={174} rx={14} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
          <path d="M30 150 q40 -30 80 -10 t90 -40 t70 -50" stroke="#93c5fd" strokeWidth={6} fill="none" opacity={0.6} />
          {/* compass */}
          <g transform="translate(40 40)">
            <path d="M0 -16 L5 0 L0 16 L-5 0Z" fill={INK} />
            <text y={-20} fontSize={11} textAnchor="middle" fontWeight={800} fill={INK}>
              צ
            </text>
          </g>
          <motion.path d="M90 150 H230 V40" fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="7 5" {...draw} />
          <motion.path d="M90 150 L230 40" stroke={PINK} strokeWidth={3.5} {...draw} />
          <circle cx={90} cy={150} r={7} fill={P} />
          <circle cx={230} cy={40} r={7} fill={P} />
          <Label x={160} y={170} t={f.east + ' ס"מ'} size={13} />
          <Label x={258} y={100} t={f.north} size={13} />
          <text x={150} y={22} fontSize={12} textAnchor="middle" fill="#92400e" fontWeight={700} direction="ltr">
            {f.scale}
          </text>
        </g>
      )
    case 'parts': {
      const total = f.parts.reduce((s, x) => s + x, 0)
      const colors = [P, PINK, GOLD]
      let x = 15
      const unit = 270 / total
      return (
        <g>
          {f.parts.map((p, i) => {
            const g = (
              <g key={i}>
                {Array.from({ length: p }, (_, j) => (
                  <motion.rect
                    key={j}
                    x={x + j * unit + 1.5}
                    y={70}
                    width={unit - 3}
                    height={44}
                    rx={6}
                    fill={colors[i % 3]}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: (i * 4 + j) * 0.05 }}
                    style={{ originY: '114px' }}
                  />
                ))}
                <text x={x + (p * unit) / 2} y={140} fontSize={13} textAnchor="middle" fontWeight={800} fill={colors[i % 3]} direction="rtl">
                  {f.labels?.[i] ?? `${p} חלקים`}
                </text>
              </g>
            )
            x += p * unit
            return g
          })}
          <text x={150} y={45} fontSize={14} textAnchor="middle" fontWeight={800} fill={INK} direction="rtl">
            {`סה"כ ${total} חלקים שווים`}
          </text>
        </g>
      )
    }
    case 'shadow':
      return (
        <g>
          <line x1={10} y1={165} x2={290} y2={165} stroke="#9ca3af" strokeWidth={2} />
          <circle cx={270} cy={26} r={14} fill={GOLD} />
          {/* stick */}
          <line x1={60} y1={165} x2={60} y2={115} stroke={P} strokeWidth={5} strokeLinecap="round" />
          <path d="M60 165 L110 165" stroke="#374151" strokeWidth={6} opacity={0.35} />
          <Label x={42} y={145} t={f.h1} size={13} />
          <Label x={85} y={184} t={f.s1} size={13} />
          {/* tree */}
          <rect x={172} y={95} width={10} height={70} fill="#92400e" />
          <circle cx={177} cy={80} r={26} fill="#a78bfa" />
          <path d="M182 165 L270 165" stroke="#374151" strokeWidth={6} opacity={0.35} />
          <Label x={150} y={120} t={f.h2} />
          <Label x={226} y={184} t={f.s2} />
        </g>
      )
  }
}
