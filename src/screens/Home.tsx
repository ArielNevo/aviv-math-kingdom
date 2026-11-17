import { motion } from 'framer-motion'
import { useState } from 'react'
import { Piti } from '../components/Piti'
import { Avatar, Button, Card, ProgressBar, levelInfo } from '../components/ui'
import { CURRICULUM, type LessonDef, type UnitDef } from '../lib/curriculum'
import { dueMistakes, isLessonUnlocked, todayKey, useStore } from '../lib/store'

const DAILY_GOAL = 100

export function Home({ onLesson, onMistakes }: { onLesson: (l: LessonDef) => void; onMistakes: () => void }) {
  const s = useStore()
  const today = s.days[todayKey()]?.xp ?? 0
  const due = dueMistakes(s).length
  // the first unlocked-but-not-completed lesson is "current"
  const current = CURRICULUM.flatMap((u) => u.lessons).find((l) => !s.lessons[l.id]?.completed && isLessonUnlocked(l.id, s))

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      {/* hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-royal-900 via-royal-700 to-fuchsia-royal p-4 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gold-400/30 blur-2xl" />
        <div className="flex items-center gap-4">
          <div className="pt-4">
            <Avatar size={72} glow />
          </div>
          <div className="flex-1">
            <p className="text-sm text-royal-200">{greeting()}</p>
            <h1 className="text-2xl font-black">המלכה אביב 👑</h1>
            <p className="text-sm text-royal-100">
              רמה: {levelInfo(s.level).emoji} {levelInfo(s.level).name}
              {s.streak > 1 && ` · 🔥 ${s.streak} ימים ברצף`}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs font-bold text-royal-100">
            <span>המטרה היומית</span>
            <span dir="ltr">
              {Math.min(today, DAILY_GOAL)}/{DAILY_GOAL} XP
            </span>
          </div>
          <ProgressBar value={today / DAILY_GOAL} className="bg-white/25" />
        </div>
      </motion.div>

      {due > 0 && (
        <button onClick={onMistakes} className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-fuchsia-royal/30 bg-pink-50 p-3 text-right">
          <span className="text-3xl">🔁</span>
          <span className="flex-1">
            <span className="block font-black text-fuchsia-royal">תרגול טעויות מחכה לך</span>
            <span className="block text-sm text-royal-800">{due} שאלות לחזרה היום — הכי יעיל ללמידה!</span>
          </span>
          <span className="text-2xl text-fuchsia-royal">‹</span>
        </button>
      )}

      <KingdomOverview />

      {CURRICULUM.map((unit, ui) => (
        <UnitSection key={unit.id} unit={unit} index={ui} current={current?.id} onLesson={onLesson} />
      ))}

      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <Piti mood="celebrate" size={90} />
        <p className="font-bold text-royal-800">בהצלחה במבחן, המלכה! את מוכנה יותר ממה שאת חושבת 💜</p>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'עדיין ערה? 🌙'
  if (h < 12) return 'בוקר טוב,'
  if (h < 17) return 'צהריים טובים,'
  if (h < 21) return 'ערב טוב,'
  return 'לילה טוב,'
}

function UnitSection({ unit, index, current, onLesson }: { unit: UnitDef; index: number; current?: string; onLesson: (l: LessonDef) => void }) {
  const s = useStore()
  const done = unit.lessons.filter((l) => s.lessons[l.id]?.completed).length
  const unlocked = isLessonUnlocked(unit.lessons[0].id, s)
  const [imgOk, setImgOk] = useState(true)
  return (
    <section className="mt-8 scroll-mt-20" id={`unit-${unit.id}`}>
      <div className={`relative flex items-center gap-3 overflow-hidden rounded-3xl p-4 text-white shadow-md ${unlocked ? '' : 'grayscale-[0.7]'}`} style={{ background: `linear-gradient(135deg, ${unit.color}, #2e1065)` }}>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-wide text-white/75">יחידה {index + 1}</p>
          <h2 className="text-xl leading-tight font-black">{unit.title}</h2>
          <p className="mt-1 text-sm text-white/85">
            {done}/{unit.lessons.length} שלבים {done === unit.lessons.length && '· הושלם! 👑'}
          </p>
        </div>
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-cream/95">
          {imgOk ? (
            <img src={`${import.meta.env.BASE_URL}art/${unit.art}.webp`} alt="" className="h-[72px] w-[72px] object-contain" onError={() => setImgOk(false)} />
          ) : (
            <span className="text-4xl">{unit.emoji}</span>
          )}
        </div>
      </div>
      <div className="relative mt-14 flex flex-col items-center gap-6">
        {unit.lessons.map((l, i) => {
          const offset = Math.sin((i + index) * 1.1) * 70
          return <LessonNode key={l.id} lesson={l} offset={offset} isCurrent={current === l.id} unitColor={unit.color} onLesson={onLesson} />
        })}
      </div>
    </section>
  )
}

function LessonNode({ lesson, offset, isCurrent, unitColor, onLesson }: { lesson: LessonDef; offset: number; isCurrent: boolean; unitColor: string; onLesson: (l: LessonDef) => void }) {
  const s = useStore()
  const prog = s.lessons[lesson.id]
  const unlocked = isLessonUnlocked(lesson.id, s)
  const done = prog?.completed
  const icon = lesson.kind === 'intro' ? '📖' : lesson.kind === 'boss' ? '⚔️' : lesson.kind === 'exam' ? '🏆' : lesson.kind === 'combo' ? '🗼' : done ? '⭐' : '✏️'
  const big = lesson.kind === 'boss' || lesson.kind === 'exam'
  const size = big ? 84 : 70
  const [tip, setTip] = useState(false)
  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && (
        <motion.div className="absolute -top-11 z-10 rounded-xl border-2 border-royal-200 bg-white px-3 py-1 text-sm font-black whitespace-nowrap text-royal-800 shadow" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          {lesson.kind === 'intro' ? 'מתחילות כאן!' : 'הבא בתור!'}
        </motion.div>
      )}
      <motion.button
        whileTap={unlocked ? { scale: 0.92 } : {}}
        onClick={() => (unlocked ? onLesson(lesson) : setTip((t) => !t))}
        className="btn-3d relative grid place-items-center rounded-full text-3xl"
        style={{
          width: size,
          height: size,
          background: !unlocked ? '#d4d4d8' : done ? 'linear-gradient(145deg,#ffd84d,#f5b301)' : unitColor,
          boxShadow: `0 6px 0 0 ${!unlocked ? '#a1a1aa' : done ? '#b45309' : '#2e1065'}`,
        }}
        aria-label={`${lesson.title}${done ? ' — הושלם' : unlocked ? '' : ' — נעול'}`}
      >
        {isCurrent && <motion.span className="absolute inset-[-8px] rounded-full border-4" style={{ borderColor: unitColor }} animate={{ scale: [1, 1.12, 1], opacity: [0.8, 0.3, 0.8] }} transition={{ repeat: Infinity, duration: 1.6 }} />}
        <span className={unlocked ? '' : 'opacity-50 grayscale'}>{unlocked ? icon : '🔒'}</span>
        {done && prog.best >= 1 && <span className="absolute -top-1 -right-1 text-lg">💎</span>}
      </motion.button>
      <span className={`mt-2 max-w-[140px] text-center text-sm leading-tight font-bold ${unlocked ? 'text-royal-900' : 'text-zinc-400'}`}>{lesson.title}</span>
      {tip && !unlocked && <span className="mt-1 text-xs text-zinc-500">סיימי את השלב הקודם כדי לפתוח</span>}
    </div>
  )
}

export function LessonStart({ lesson, onStart, onClose }: { lesson: LessonDef; onStart: () => void; onClose: () => void }) {
  const s = useStore()
  const prog = s.lessons[lesson.id]
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h3 className="text-2xl font-black">{lesson.title}</h3>
      <p className="text-royal-800">
        {lesson.kind === 'boss' || lesson.kind === 'combo' ? '8 שאלות בוס משולבות · XP ×1.5 ⚔️' : '10 שאלות · בין 5 ל-10 דקות'}
        {lesson.fixedLevel ? ` · רמה ${lesson.fixedLevel}` : ` · ${levelInfo(s.level).emoji} ${levelInfo(s.level).name}`}
      </p>
      {prog?.completed && <p className="text-sm font-bold text-emerald-700">השיא שלך: {Math.round(prog.best * 100)}% 🎯</p>}
      <Button className="w-full" variant="gold" onClick={onStart}>
        {prog?.completed ? 'לתרגל שוב' : 'יאללה, מתחילות!'}
      </Button>
      <Button className="w-full" variant="ghost" onClick={onClose}>
        אחר כך
      </Button>
    </Card>
  )
}

/** Pins (x%, y%) of the five clearings on the illustrated map, from the bottom (unit 1) to the top. */
const PINS: Record<string, [number, number]> = {
  u1: [32, 80],
  u2: [66, 61],
  u3: [32, 37],
  u4: [69, 25],
  u5: [38, 13.5],
}

function KingdomOverview() {
  const s = useStore()
  return (
    <div className="relative mt-4 overflow-hidden rounded-3xl shadow-lg" style={{ aspectRatio: '720 / 1279' }}>
      <img src={`${import.meta.env.BASE_URL}art/kingdom-map.webp`} alt="מפת הממלכה" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-950/70 to-transparent px-4 pt-10 pb-3 text-center">
        <p className="text-lg font-black text-white drop-shadow">הממלכה שלך</p>
        <p className="text-xs text-white/85">לחצי על טירה כדי לקפוץ אליה</p>
      </div>
      {CURRICULUM.map((u, i) => {
        const [x, y] = PINS[u.id]
        const unlocked = isLessonUnlocked(u.lessons[0].id, s)
        const done = u.lessons.every((l) => s.lessons[l.id]?.completed)
        const started = u.lessons.some((l) => s.lessons[l.id]?.completed)
        return (
          <motion.button
            key={u.id}
            className="absolute flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => document.getElementById(`unit-${u.id}`)?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={u.title}
          >
            <img src={`${import.meta.env.BASE_URL}art/${u.art}.webp`} alt="" className={`w-full drop-shadow-lg ${unlocked ? '' : 'opacity-60 grayscale'}`} />
            <span className={`-mt-2 rounded-full px-2 py-0.5 text-[11px] font-black whitespace-nowrap shadow ${done ? 'bg-gold-400 text-royal-950' : unlocked ? 'bg-white text-royal-900' : 'bg-zinc-200 text-zinc-500'}`}>
              {done ? '👑 ' : !unlocked ? '🔒 ' : started ? '⚔️ ' : ''}
              {u.title.split(' — ')[0]}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
