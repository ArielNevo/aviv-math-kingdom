import { motion } from 'framer-motion'

export type PitiMood = 'happy' | 'encourage' | 'celebrate'

/** "פיתי" — an original little owl with a gold crown. */
export function Piti({ mood = 'happy', size = 96, className }: { mood?: PitiMood; size?: number; className?: string }) {
  const bounce =
    mood === 'celebrate'
      ? { y: [0, -14, 0, -8, 0], rotate: [0, -6, 6, -3, 0] }
      : mood === 'encourage'
        ? { rotate: [0, -4, 4, 0] }
        : { y: [0, -4, 0] }
  return (
    <motion.svg
      viewBox="0 0 120 130"
      width={size}
      height={size * (130 / 120)}
      className={className}
      animate={bounce}
      transition={{ duration: mood === 'celebrate' ? 1.1 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
      role="img"
      aria-label="פיתי הינשופה"
    >
      <defs>
        <linearGradient id="pitiBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="pitiCrown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#e09b00" />
        </linearGradient>
      </defs>
      {/* feet */}
      <path d="M44 120 l-4 6 M48 120 v7 M52 120 l4 6 M68 120 l-4 6 M72 120 v7 M76 120 l4 6" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
      {/* wings */}
      <motion.path
        d="M22 70 C8 82 10 104 26 110 C30 96 30 82 22 70Z"
        fill="#6d28d9"
        style={{ originX: '26px', originY: '74px' }}
        animate={mood === 'celebrate' ? { rotate: [0, 35, 0] } : { rotate: 0 }}
        transition={{ duration: 0.55, repeat: Infinity }}
      />
      <motion.path
        d="M98 70 C112 82 110 104 94 110 C90 96 90 82 98 70Z"
        fill="#6d28d9"
        style={{ originX: '94px', originY: '74px' }}
        animate={mood === 'celebrate' ? { rotate: [0, -35, 0] } : mood === 'encourage' ? { rotate: [0, -18, 0] } : { rotate: 0 }}
        transition={{ duration: 0.55, repeat: Infinity, repeatDelay: mood === 'encourage' ? 0.6 : 0 }}
      />
      {/* body */}
      <path d="M60 30 C88 30 100 52 100 80 C100 106 84 122 60 122 C36 122 20 106 20 80 C20 52 32 30 60 30Z" fill="url(#pitiBody)" />
      {/* ear tufts */}
      <path d="M30 42 L26 22 L44 34Z M90 42 L94 22 L76 34Z" fill="#5b21b6" />
      {/* belly */}
      <ellipse cx="60" cy="92" rx="25" ry="24" fill="#f3e8ff" />
      <path d="M50 86 q5 4 10 0 q5 4 10 0 M46 96 q5 4 10 0 q5 4 10 0 q5 4 10 0 M52 106 q4 3 8 0 q4 3 8 0" stroke="#c4b5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <circle cx="44" cy="62" r="15" fill="#fff" />
      <circle cx="76" cy="62" r="15" fill="#fff" />
      {mood === 'celebrate' ? (
        <>
          <path d="M36 64 q8 -10 16 0" stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M68 64 q8 -10 16 0" stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <motion.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ originY: '62px' }}>
            <circle cx={mood === 'encourage' ? 46 : 44} cy="63" r="7" fill="#1e1b4b" />
            <circle cx={mood === 'encourage' ? 78 : 76} cy="63" r="7" fill="#1e1b4b" />
            <circle cx={mood === 'encourage' ? 48 : 46} cy="60" r="2.5" fill="#fff" />
            <circle cx={mood === 'encourage' ? 80 : 78} cy="60" r="2.5" fill="#fff" />
          </motion.g>
          {mood === 'encourage' && <path d="M32 46 l20 5 M88 46 l-20 5" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />}
        </>
      )}
      {/* beak */}
      <path d="M55 72 L65 72 L60 82Z" fill="#f59e0b" />
      {/* cheeks */}
      <circle cx="32" cy="78" r="5" fill="#f472b6" opacity="0.55" />
      <circle cx="88" cy="78" r="5" fill="#f472b6" opacity="0.55" />
      {/* crown */}
      <motion.g animate={mood === 'celebrate' ? { y: [0, -6, 0] } : {}} transition={{ duration: 0.55, repeat: Infinity }}>
        <path d="M40 30 L42 12 L51 22 L60 6 L69 22 L78 12 L80 30Z" fill="url(#pitiCrown)" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="60" cy="22" r="3.2" fill="#db2777" />
        <circle cx="48" cy="25" r="2.2" fill="#7c3aed" />
        <circle cx="72" cy="25" r="2.2" fill="#7c3aed" />
        <circle cx="42" cy="12" r="2.4" fill="#ffd84d" />
        <circle cx="60" cy="6" r="2.6" fill="#ffd84d" />
        <circle cx="78" cy="12" r="2.4" fill="#ffd84d" />
      </motion.g>
      {mood === 'celebrate' && (
        <g fill="#f5b301">
          <motion.path d="M10 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity }} />
          <motion.path d="M108 26 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" animate={{ scale: [1.1, 0.6, 1.1] }} transition={{ duration: 0.9, repeat: Infinity }} />
        </g>
      )}
    </motion.svg>
  )
}

export function SpeechBubble({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'bad' }) {
  const colors =
    tone === 'good' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : tone === 'bad' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-white border-violet-200 text-violet-950'
  return <div className={`relative rounded-2xl border-2 px-4 py-2 font-bold shadow-sm ${colors}`}>{children}</div>
}
