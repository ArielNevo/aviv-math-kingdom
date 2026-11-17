import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { META } from '../lib/curriculum'
import { MAX_HEARTS, useStore } from '../lib/store'
import type { Level } from '../lib/types'

type BtnVariant = 'primary' | 'gold' | 'pink' | 'ghost' | 'green' | 'red' | 'white'
const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-royal-700 text-white',
  gold: 'bg-gold-400 text-royal-950',
  pink: 'bg-fuchsia-royal text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-rose-500 text-white',
  white: 'bg-white text-royal-900 border-2 border-royal-200',
  ghost: 'bg-transparent text-royal-800 shadow-none',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: { children: ReactNode; variant?: BtnVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`btn-3d min-h-12 rounded-2xl px-5 py-3 text-lg font-extrabold disabled:opacity-40 disabled:shadow-none ${variant === 'ghost' ? '' : ''} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function ProgressBar({ value, className = '', color = 'bg-gold-400' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-4 w-full overflow-hidden rounded-full bg-royal-100 ${className}`}>
      <motion.div className={`relative h-full rounded-full ${color}`} initial={false} animate={{ width: `${Math.min(100, value * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/50" />
      </motion.div>
    </div>
  )
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-royal-950/50 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="safe-bottom max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl sm:rounded-3xl"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {title && <h2 className="mb-3 text-center text-2xl font-black text-royal-900">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Aviv's photo framed with a crown. Falls back to an illustrated avatar if the image is missing. */
export function Avatar({ size = 56, glow = false }: { size?: number; glow?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`h-full w-full overflow-hidden rounded-full border-[3px] border-gold-400 bg-royal-200 ${glow ? 'shadow-[0_0_24px_rgba(245,179,1,0.7)]' : 'shadow'}`}>
        {failed ? (
          <svg viewBox="0 0 64 64" className="h-full w-full">
            <rect width="64" height="64" fill="#ddd6fe" />
            <circle cx="32" cy="26" r="12" fill="#fcd9b8" />
            <path d="M14 64 c0 -16 8 -22 18 -22 s18 6 18 22Z" fill="#db2777" />
            <path d="M20 26 c0 -12 24 -12 24 0 c0 -16 -24 -16 -24 0Z" fill="#b45309" />
          </svg>
        ) : (
          <img src={`${import.meta.env.BASE_URL}avatar/aviv.jpg`} alt={META.student.name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        )}
      </div>
      <svg viewBox="0 0 40 24" className="absolute left-1/2 -translate-x-1/2 drop-shadow" style={{ width: size * 0.62, top: -size * 0.3 }} aria-hidden>
        <path d="M3 22 L5 6 L13 14 L20 2 L27 14 L35 6 L37 22Z" fill="#f5b301" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="20" cy="15" r="2.4" fill="#db2777" />
        <circle cx="11" cy="18" r="1.6" fill="#7c3aed" />
        <circle cx="29" cy="18" r="1.6" fill="#7c3aed" />
      </svg>
    </div>
  )
}

export const levelInfo = (l: Level) => META.difficultyLevels.find((d) => d.level === l)!

export function Hearts({ value, compact = false }: { value: number; compact?: boolean }) {
  if (compact)
    return (
      <span className="flex items-center gap-1 font-extrabold text-rose-500">
        ❤️ <span dir="ltr">{Number.isInteger(value) ? value : value.toFixed(1)}</span>
      </span>
    )
  return (
    <span className="flex gap-0.5" aria-label={`${value} לבבות`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <span key={i} className={`text-lg ${i < Math.floor(value) ? '' : i < value ? 'opacity-60' : 'opacity-20 grayscale'}`}>
          {i < value && i + 1 > value ? '💔' : '❤️'}
        </span>
      ))}
    </span>
  )
}

export function TopBar({ onLevel, onProfile }: { onLevel: () => void; onProfile: () => void }) {
  const { streak, xp, hearts, level, adaptive } = useStore()
  const li = levelInfo(level)
  return (
    <header className="sticky top-0 z-30 border-b border-royal-100 bg-cream/90 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.6rem)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        <button onClick={onProfile} className="pt-3" aria-label="פרופיל">
          <Avatar size={40} />
        </button>
        <button onClick={onLevel} className="flex items-center gap-1 rounded-full bg-royal-100 px-3 py-1.5 text-sm font-extrabold text-royal-900" aria-label="בחירת רמה">
          <span className="text-lg">{li.emoji}</span>
          {li.name}
          {adaptive && <span className="rounded-full bg-gold-400 px-1.5 text-[10px] text-royal-950">אדפטיבי</span>}
        </button>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-extrabold text-orange-500" title="רצף ימים">
            🔥 <span dir="ltr">{streak}</span>
          </span>
          <span className="flex items-center gap-1 font-extrabold text-gold-600" title="נקודות XP">
            ⭐ <span dir="ltr">{xp}</span>
          </span>
          <Hearts value={hearts} compact />
        </div>
      </div>
    </header>
  )
}

export function LevelPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { level, adaptive, setLevel, set } = useStore()
  return (
    <Modal open={open} onClose={onClose} title="באיזו רמה נשחק היום?">
      <div className="space-y-3">
        {META.difficultyLevels.map((d) => (
          <button
            key={d.level}
            onClick={() => setLevel(d.level)}
            className={`flex w-full items-center gap-3 rounded-2xl border-[3px] p-4 text-right transition ${
              level === d.level ? 'border-royal-700 bg-royal-100' : 'border-royal-100 bg-white'
            }`}
          >
            <span className="text-4xl">{d.emoji}</span>
            <span className="flex-1">
              <span className="block text-xl font-black">{d.name}</span>
              <span className="block text-sm text-royal-800">{d.description}</span>
            </span>
            <span dir="ltr" className="text-sm font-bold text-gold-600">
              +{[10, 15, 25][d.level - 1]} XP
            </span>
          </button>
        ))}
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
          <span>
            <span className="block font-black">מצב אדפטיבי ✨</span>
            <span className="block text-sm text-royal-800">4 נכונות ברצף → עולים רמה. 3 טעויות בשיעור → יורדים בעדינות.</span>
          </span>
          <Toggle checked={adaptive} onChange={(v) => set({ adaptive: v })} label="אדפטיבי" />
        </label>
        <Button className="w-full" onClick={onClose}>
          יאללה! 👑
        </Button>
      </div>
    </Modal>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-royal-700' : 'bg-gray-300'}`}
    >
      <motion.span className="absolute top-1 h-6 w-6 rounded-full bg-white shadow" animate={{ right: checked ? 4 : 28 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 border-royal-100 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}
