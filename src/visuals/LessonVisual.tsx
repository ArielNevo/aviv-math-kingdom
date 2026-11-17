import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const P = '#6d28d9'
const P2 = '#a78bfa'
const GOLD = '#f5b301'
const PINK = '#db2777'
const INK = '#2e1065'
const SOFT = '#ede9fe'

const draw = (delay = 0) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.9, delay, ease: 'easeOut' as const },
})
const pop = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, type: 'spring' as const, stiffness: 220, damping: 16 },
})

function T({ x, y, children, size = 15, color = INK, rtl = false, anchor = 'middle', delay = 0 }: { x: number; y: number; children: ReactNode; size?: number; color?: string; rtl?: boolean; anchor?: 'middle' | 'start' | 'end'; delay?: number }) {
  return (
    <motion.text x={x} y={y} fontSize={size} fontWeight={800} fill={color} textAnchor={anchor} direction={rtl || /[\u0590-\u05FF]/.test(String(children)) ? 'rtl' : 'ltr'} {...pop(delay)}>
      {children}
    </motion.text>
  )
}

const Frame = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 320 200" className="h-auto w-full" aria-hidden>
    {children}
  </svg>
)

function Tri({ a, b, c, x0 = 70, y0 = 170, w = 180, h = 130, delay = 0 }: { a: string; b: string; c: string; x0?: number; y0?: number; w?: number; h?: number; delay?: number }) {
  return (
    <g>
      <motion.path d={`M${x0} ${y0} H${x0 + w} V${y0 - h} Z`} fill={SOFT} stroke={P} strokeWidth={3} strokeLinejoin="round" {...draw(delay)} />
      <path d={`M${x0 + w - 12} ${y0} v-12 h12`} fill="none" stroke={INK} strokeWidth={1.5} />
      <T x={x0 + w / 2} y={y0 + 20} delay={delay + 0.4}>
        {a}
      </T>
      <T x={x0 + w + 22} y={y0 - h / 2 + 5} delay={delay + 0.5}>
        {b}
      </T>
      <T x={x0 + w / 2 - 18} y={y0 - h / 2 - 6} color={PINK} delay={delay + 0.6}>
        {c}
      </T>
    </g>
  )
}

export function LessonVisual({ id }: { id: string }) {
  switch (id) {
    // ---------------- Pythagoras ----------------
    case 'rect_diagonal':
      return (
        <Frame>
          <rect x={40} y={30} width={240} height={140} fill="#dcfce7" stroke="#16a34a" strokeWidth={3} rx={4} />
          <motion.path d="M40 170 H280 V30" fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="8 6" {...draw()} />
          <motion.path d="M40 170 L280 30" stroke={PINK} strokeWidth={4} {...draw(0.8)} />
          <motion.circle r={8} fill={P} initial={{ cx: 40, cy: 170 }} animate={{ cx: [40, 280], cy: [170, 30] }} transition={{ duration: 2, delay: 1.4, repeat: Infinity, repeatDelay: 1 }} />
          <T x={160} y={192}>{`40 מ'`}</T>
          <T x={300} y={105}>{`30`}</T>
          <T x={140} y={92} color={PINK} rtl>
            ?
          </T>
        </Frame>
      )
    case 'right_triangle':
      return (
        <Frame>
          <Tri a="a" b="b" c="c" />
          {/* squares on sides */}
          <motion.rect x={70} y={170} width={180} height={24} fill={P2} opacity={0.25} {...pop(0.8)} />
          <T x={60} y={40} size={22} color={P} delay={1}>
            a² + b² = c²
          </T>
          <T x={110} y={75} size={12} color={PINK} rtl anchor="middle" delay={1.2}>
            היתר — מול הזווית הישרה
          </T>
        </Frame>
      )
    case 'example_3_4_5':
      return (
        <Frame>
          <Tri a="40" b="30" c="50" />
          <T x={70} y={30} size={14} delay={1}>
            900 + 1600 = 2500
          </T>
          <T x={70} y={52} size={14} color={PINK} delay={1.3}>
            √2500 = 50
          </T>
        </Frame>
      )
    case 'leg_example':
      return (
        <Frame>
          <Tri a="?" b="5" c="13" />
          <T x={70} y={30} size={14} delay={1}>
            b² = 169 − 25 = 144
          </T>
          <T x={70} y={52} size={14} color={PINK} delay={1.3}>
            b = 12
          </T>
        </Frame>
      )
    case 'triples':
      return (
        <Frame>
          {[
            ['3', '4', '5'],
            ['5', '12', '13'],
            ['8', '15', '17'],
            ['7', '24', '25'],
          ].map((t, i) => (
            <motion.g key={i} {...pop(i * 0.2)}>
              <rect x={20 + (i % 2) * 150} y={20 + Math.floor(i / 2) * 85} width={130} height={70} rx={16} fill={i % 2 ? '#fce7f3' : SOFT} stroke={i % 2 ? PINK : P} strokeWidth={2} />
              <text x={85 + (i % 2) * 150} y={64 + Math.floor(i / 2) * 85} fontSize={24} fontWeight={900} textAnchor="middle" fill={INK} direction="ltr">
                {t.join(' · ')}
              </text>
            </motion.g>
          ))}
        </Frame>
      )
    case 'hidden_triangles':
      return (
        <Frame>
          {/* rectangle */}
          <rect x={14} y={30} width={88} height={60} fill={SOFT} stroke={P} strokeWidth={2} />
          <motion.path d="M14 90 L102 30" stroke={PINK} strokeWidth={3} {...draw()} />
          {/* isosceles */}
          <path d="M160 30 L205 90 L115 90Z" fill={SOFT} stroke={P} strokeWidth={2} />
          <motion.path d="M160 30 V90" stroke={PINK} strokeWidth={3} {...draw(0.3)} />
          {/* rhombus */}
          <path d="M262 22 L304 60 L262 98 L220 60Z" fill={SOFT} stroke={P} strokeWidth={2} />
          <motion.path d="M262 22 V98 M220 60 H304" stroke={PINK} strokeWidth={2.5} {...draw(0.6)} />
          {/* ladder */}
          <line x1={40} y1={185} x2={120} y2={185} stroke="#9ca3af" strokeWidth={3} />
          <rect x={112} y={110} width={10} height={75} fill="#e5e7eb" />
          <motion.path d="M48 185 L112 118" stroke={PINK} strokeWidth={4} {...draw(0.9)} />
          {/* points */}
          <line x1={180} y1={185} x2={300} y2={185} stroke="#9ca3af" />
          <line x1={190} y1={195} x2={190} y2={110} stroke="#9ca3af" />
          <motion.path d="M210 175 H280 V125" fill="none" stroke={GOLD} strokeWidth={2.5} strokeDasharray="5 4" {...draw(1.1)} />
          <motion.path d="M210 175 L280 125" stroke={PINK} strokeWidth={3} {...draw(1.2)} />
          <circle cx={210} cy={175} r={4} fill={P} />
          <circle cx={280} cy={125} r={4} fill={P} />
        </Frame>
      )
    // ---------------- Ratio ----------------
    case 'ratio_dots':
      return (
        <Frame>
          {Array.from({ length: 12 }, (_, i) => (
            <motion.circle key={'b' + i} cx={30 + (i % 6) * 24} cy={50 + Math.floor(i / 6) * 26} r={9} fill={P} {...pop(i * 0.04)} />
          ))}
          {Array.from({ length: 18 }, (_, i) => (
            <motion.circle key={'g' + i} cx={30 + (i % 6) * 24} cy={120 + Math.floor(i / 6) * 26} r={9} fill={PINK} {...pop(0.5 + i * 0.04)} />
          ))}
          <T x={250} y={70} size={14} rtl delay={0.4}>
            12 בנים
          </T>
          <T x={250} y={150} size={14} rtl delay={1}>
            18 בנות
          </T>
          <T x={250} y={112} size={26} color={GOLD} delay={1.6}>
            2 : 3
          </T>
        </Frame>
      )
    case 'ratio_simplify':
      return (
        <Frame>
          <T x={160} y={50} size={30}>
            12 : 18
          </T>
          <motion.path d="M160 62 v36" stroke={GOLD} strokeWidth={3} {...draw(0.5)} />
          <T x={200} y={86} size={16} color={GOLD} delay={0.6}>
            ÷6
          </T>
          <T x={160} y={130} size={34} color={PINK} delay={1}>
            2 : 3
          </T>
          <T x={160} y={180} size={16} color={P} delay={1.4}>
            2:3 = 4:6 = 20:30
          </T>
        </Frame>
      )
    case 'ratio_parts': {
      const parts = [2, 3, 5]
      const colors = [P, PINK, GOLD]
      let x = 10
      return (
        <Frame>
          <T x={160} y={30} size={15} rtl>
            {'120 ש"ח ביחס 2:3:5'}
          </T>
          {parts.map((p, i) => {
            const g = (
              <g key={i}>
                {Array.from({ length: p }, (_, j) => (
                  <motion.rect key={j} x={x + j * 30 + 1} y={60} width={27} height={50} rx={6} fill={colors[i]} {...pop(0.2 + (i * 5 + j) * 0.06)} />
                ))}
                <T x={x + (p * 30) / 2} y={140} size={18} color={colors[i]} delay={1.2 + i * 0.2}>
                  {String(p * 12)}
                </T>
              </g>
            )
            x += p * 30
            return g
          })}
          <T x={160} y={180} size={14} delay={1.8}>
            120 ÷ 10 = 12
          </T>
        </Frame>
      )
    }
    case 'ratio_given_part':
      return (
        <Frame>
          {Array.from({ length: 3 }, (_, j) => (
            <motion.rect key={'a' + j} x={20 + j * 28} y={50} width={25} height={40} rx={5} fill={P} {...pop(j * 0.08)} />
          ))}
          {Array.from({ length: 7 }, (_, j) => (
            <motion.rect key={'b' + j} x={20 + j * 28} y={110} width={25} height={40} rx={5} fill={PINK} {...pop(0.3 + j * 0.08)} />
          ))}
          <T x={260} y={140} size={18} color={PINK} delay={1}>
            7 = 42
          </T>
          <T x={260} y={175} size={15} delay={1.3}>
            1 = 6
          </T>
          <T x={150} y={78} size={18} color={P} delay={1.6}>
            3 × 6 = 18
          </T>
        </Frame>
      )
    case 'ratio_algebra':
      return (
        <Frame>
          <T x={160} y={40} size={20}>
            3x + 6 = 4x
          </T>
          <T x={160} y={90} size={26} color={PINK} delay={0.6}>
            x = 6
          </T>
          <T x={160} y={140} size={16} rtl delay={1}>
            בנות = 4 × 6 = 24
          </T>
          <motion.circle cx={60} cy={165} r={14} fill={GOLD} {...pop(1.3)} />
          <T x={60} y={171} size={16} color={INK} delay={1.3}>
            x
          </T>
        </Frame>
      )
    // ---------------- Proportion ----------------
    case 'prop_notebooks':
      return (
        <Frame>
          {Array.from({ length: 5 }, (_, i) => (
            <motion.rect key={i} x={20 + i * 26} y={40} width={22} height={30} rx={3} fill={i % 2 ? PINK : P} {...pop(i * 0.08)} />
          ))}
          <T x={250} y={62} size={18} rtl delay={0.4}>
            {'30 ש"ח'}
          </T>
          {Array.from({ length: 8 }, (_, i) => (
            <motion.rect key={'b' + i} x={20 + i * 26} y={110} width={22} height={30} rx={3} fill={i % 2 ? PINK : P} {...pop(0.6 + i * 0.06)} />
          ))}
          <T x={265} y={132} size={22} color={PINK} delay={1.2}>
            ?
          </T>
          <T x={160} y={185} size={16} delay={1.5}>
            5/30 = 8/x
          </T>
        </Frame>
      )
    case 'prop_cross':
    case 'prop_solve':
      return (
        <Frame>
          <T x={110} y={70} size={30}>
            {id === 'prop_cross' ? 'a' : '5'}
          </T>
          <line x1={85} y1={85} x2={135} y2={85} stroke={INK} strokeWidth={3} />
          <T x={110} y={122} size={30}>
            {id === 'prop_cross' ? 'b' : '30'}
          </T>
          <T x={160} y={98} size={30}>
            =
          </T>
          <T x={210} y={70} size={30}>
            {id === 'prop_cross' ? 'c' : '8'}
          </T>
          <line x1={185} y1={85} x2={235} y2={85} stroke={INK} strokeWidth={3} />
          <T x={210} y={122} size={30} color={id === 'prop_solve' ? PINK : INK}>
            {id === 'prop_cross' ? 'd' : 'x'}
          </T>
          <motion.path d="M120 60 L200 115" stroke={GOLD} strokeWidth={4} strokeLinecap="round" {...draw(0.6)} />
          <motion.path d="M120 115 L200 60" stroke={PINK} strokeWidth={4} strokeLinecap="round" {...draw(1)} />
          <T x={160} y={175} size={20} color={P} delay={1.4}>
            {id === 'prop_cross' ? 'a · d = b · c' : '5x = 240 → x = 48'}
          </T>
        </Frame>
      )
    case 'prop_life':
      return (
        <Frame>
          {[
            ['🚗', 'מרחק ↔ זמן'],
            ['🍰', 'מתכון ↔ אנשים'],
            ['🌳', 'צל ↔ גובה'],
            ['🛒', 'מחיר ↔ כמות'],
          ].map(([e, t], i) => (
            <motion.g key={i} {...pop(i * 0.2)}>
              <rect x={14 + (i % 2) * 150} y={20 + Math.floor(i / 2) * 85} width={142} height={72} rx={16} fill={i % 3 ? SOFT : '#fef3c7'} stroke={P2} strokeWidth={2} />
              <text x={85 + (i % 2) * 150} y={52 + Math.floor(i / 2) * 85} fontSize={24} textAnchor="middle">
                {e}
              </text>
              <text x={85 + (i % 2) * 150} y={78 + Math.floor(i / 2) * 85} fontSize={14} fontWeight={800} textAnchor="middle" fill={INK} direction="rtl">
                {t}
              </text>
            </motion.g>
          ))}
        </Frame>
      )
    case 'prop_algebra':
      return (
        <Frame>
          {['(x+2)/5 = 12/10', '10(x+2) = 60', 'x + 2 = 6', 'x = 4'].map((s, i) => (
            <T key={i} x={160} y={40 + i * 42} size={i === 3 ? 26 : 20} color={i === 3 ? PINK : INK} delay={i * 0.45}>
              {s}
            </T>
          ))}
        </Frame>
      )
    // ---------------- Scale ----------------
    case 'scale_map':
    case 'scale_to_real':
      return (
        <Frame>
          <rect x={14} y={14} width={292} height={150} rx={14} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
          <path d="M30 130 q50 -40 100 -10 t110 -50 t60 -30" stroke="#93c5fd" strokeWidth={8} fill="none" opacity={0.6} />
          <circle cx={80} cy={90} r={9} fill={P} />
          <circle cx={240} cy={90} r={9} fill={PINK} />
          <motion.path d="M80 90 H240" stroke={INK} strokeWidth={2.5} strokeDasharray="6 4" {...draw(0.3)} />
          <T x={160} y={80} size={15} rtl delay={0.6}>
            {id === 'scale_map' ? '3 ס"מ' : '4 ס"מ'}
          </T>
          <g transform="translate(30 140)">
            <rect width={40} height={8} fill={INK} />
            <rect x={40} width={40} height={8} fill="#fff" stroke={INK} />
          </g>
          <T x={220} y={150} size={14} color="#92400e">
            {id === 'scale_map' ? '1:100,000' : '1:50,000'}
          </T>
          <T x={160} y={192} size={16} color={PINK} delay={1}>
            {id === 'scale_map' ? '1 ס"מ = 100,000 ס"מ = 1 ק"מ' : '4 × 50,000 = 200,000 ס"מ = 2 ק"מ'}
          </T>
        </Frame>
      )
    case 'scale_units':
      return (
        <Frame>
          {[
            ['ק"מ', 30],
            ["מ'", 140],
            ['ס"מ', 250],
          ].map(([u, x], i) => (
            <motion.g key={i} {...pop(i * 0.2)}>
              <rect x={Number(x) - 10} y={60} width={80} height={60} rx={16} fill={[P, PINK, GOLD][i]} />
              <text x={Number(x) + 30} y={98} fontSize={20} fontWeight={900} textAnchor="middle" fill="#fff" direction="rtl">
                {u}
              </text>
            </motion.g>
          ))}
          <T x={115} y={50} size={13} color={P} delay={0.7}>
            ×1,000
          </T>
          <T x={225} y={50} size={13} color={PINK} delay={0.9}>
            ×100
          </T>
          <motion.path d="M100 90 h30 M210 90 h30" stroke={INK} strokeWidth={3} {...draw(0.6)} />
          <T x={160} y={160} size={15} delay={1.2}>
            {'1 ק"מ = 1,000 מ\' = 100,000 ס"מ'}
          </T>
        </Frame>
      )
    case 'scale_to_map':
      return (
        <Frame>
          {['5 ק"מ = 500,000 ס"מ', '500,000 ÷ 25,000', '= 20 ס"מ'].map((s, i) => (
            <T key={i} x={160} y={55 + i * 50} size={i === 2 ? 26 : 19} color={i === 2 ? PINK : INK} delay={i * 0.5}>
              {s}
            </T>
          ))}
        </Frame>
      )
    case 'scale_find':
      return (
        <Frame>
          <rect x={30} y={40} width={60} height={14} rx={4} fill={P} />
          <T x={60} y={80} size={14}>
            {'6 ס"מ'}
          </T>
          <motion.rect x={30} y={110} width={260} height={14} rx={4} fill={PINK} initial={{ width: 60 }} animate={{ width: 260 }} transition={{ duration: 1.2, delay: 0.3 }} />
          <T x={160} y={150} size={14} delay={0.8}>
            {"3 מ' = 300 ס\"מ"}
          </T>
          <T x={160} y={188} size={22} color={GOLD} delay={1.3}>
            6 : 300 = 1 : 50
          </T>
        </Frame>
      )
    case 'scale_area':
      return (
        <Frame>
          <rect x={30} y={60} width={30} height={30} fill={P} />
          <T x={45} y={110} size={13}>
            1×1
          </T>
          <motion.g {...pop(0.4)}>
            {Array.from({ length: 100 }, (_, i) => (
              <rect key={i} x={130 + (i % 10) * 15} y={20 + Math.floor(i / 10) * 15} width={13} height={13} fill={i % 11 === 0 ? PINK : P2} opacity={0.75} />
            ))}
          </motion.g>
          <T x={70} y={160} size={16} color={PINK} delay={1}>
            ×10 → ×100
          </T>
          <T x={205} y={190} size={14} delay={1.3}>
            1:100 → 1:10,000
          </T>
        </Frame>
      )
    default:
      return (
        <Frame>
          <T x={160} y={110} size={40}>
            👑
          </T>
        </Frame>
      )
  }
}
