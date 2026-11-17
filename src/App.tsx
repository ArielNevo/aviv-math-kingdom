import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Piti } from './components/Piti'
import { Button, LevelPicker, Modal, TopBar } from './components/ui'
import { META, TOPIC_NAMES, unitById, type LessonDef } from './lib/curriculum'
import { lessonSource, mistakesSource, practiceSource, type QuestionSource } from './lib/session'
import { play } from './lib/sound'
import { dueMistakes, useStore } from './lib/store'
import type { MainTopic } from './lib/types'
import { Exam } from './screens/Exam'
import { Home, LessonStart } from './screens/Home'
import { Intro } from './screens/Intro'
import { Practice } from './screens/Practice'
import { Profile, Settings } from './screens/Profile'
import { Runner } from './screens/Runner'
import { Videos } from './screens/Videos'

type Tab = 'home' | 'practice' | 'videos' | 'profile' | 'settings'
type Screen =
  | { name: 'tabs' }
  | { name: 'intro'; topic: MainTopic; lessonId: string | null }
  | { name: 'run'; title: string; source: QuestionSource; lessonId: string | null; usesHearts: boolean; fixedLevel?: 1 | 2 | 3; topic?: MainTopic }
  | { name: 'exam' }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'הממלכה', icon: '🏰' },
  { id: 'practice', label: 'אימון', icon: '🏋️‍♀️' },
  { id: 'videos', label: 'סרטונים', icon: '🎬' },
  { id: 'profile', label: 'פרופיל', icon: '👑' },
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
]

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [screen, setScreen] = useState<Screen>({ name: 'tabs' })
  const [levelOpen, setLevelOpen] = useState(false)
  const [pending, setPending] = useState<LessonDef | null>(null)
  const [welcome, setWelcome] = useState(() => !s.lastDay)

  useEffect(() => {
    s.tickHearts()
    const t = setInterval(() => useStore.getState().tickHearts(), 60_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const opts = { level: s.level, inverseEnabled: s.inverse }
  const backToTabs = () => {
    setScreen({ name: 'tabs' })
    window.scrollTo({ top: 0 })
  }

  const openLesson = (l: LessonDef) => {
    const unit = unitById[l.unitId]
    if (l.kind === 'intro') return setScreen({ name: 'intro', topic: unit.topic as MainTopic, lessonId: l.id })
    if (l.kind === 'exam') return setScreen({ name: 'exam' })
    setPending(l)
  }
  const startLesson = (l: LessonDef) => {
    setPending(null)
    if (s.hearts <= 0) return setScreen({ name: 'intro', topic: (unitById[l.unitId].topic === 'combo' ? 'pythagoras' : unitById[l.unitId].topic) as MainTopic, lessonId: null })
    const unit = unitById[l.unitId]
    setScreen({
      name: 'run',
      title: `${unit.title} · ${l.title}`,
      source: lessonSource(l.id, opts),
      lessonId: l.id,
      usesHearts: true,
      fixedLevel: l.fixedLevel,
      topic: unit.topic === 'combo' ? undefined : (unit.topic as MainTopic),
    })
  }
  const startPractice = (t: MainTopic | 'combo') =>
    setScreen({ name: 'run', title: `אימון חופשי · ${TOPIC_NAMES[t]}`, source: practiceSource(t, opts), lessonId: null, usesHearts: false })
  const startMistakes = () => {
    const due = dueMistakes(s)
    const items = (due.length ? due : Object.values(s.mistakes)).slice(0, 10)
    if (!items.length) return
    setScreen({ name: 'run', title: 'תרגול טעויות 🔁', source: mistakesSource(items), lessonId: null, usesHearts: false })
  }

  let content: React.ReactNode
  if (screen.name === 'intro') content = <Intro topic={screen.topic} lessonId={screen.lessonId} onDone={backToTabs} />
  else if (screen.name === 'exam') content = <Exam onExit={backToTabs} onPractice={startPractice} />
  else if (screen.name === 'run')
    content = (
      <Runner
        key={screen.title + screen.lessonId}
        title={screen.title}
        source={screen.source}
        lessonId={screen.lessonId}
        usesHearts={screen.usesHearts}
        fixedLevel={screen.fixedLevel}
        onExit={backToTabs}
        onNeedHearts={() => setScreen({ name: 'intro', topic: screen.topic ?? 'pythagoras', lessonId: null })}
      />
    )
  else
    content = (
      <>
        <TopBar onLevel={() => setLevelOpen(true)} onProfile={() => setTab('profile')} />
        <main>
          {tab === 'home' && <Home onLesson={openLesson} onMistakes={startMistakes} />}
          {tab === 'practice' && <Practice onPractice={startPractice} onMistakes={startMistakes} onExam={() => setScreen({ name: 'exam' })} onIntro={(t) => setScreen({ name: 'intro', topic: t, lessonId: null })} />}
          {tab === 'videos' && <Videos />}
          {tab === 'profile' && <Profile />}
          {tab === 'settings' && <Settings />}
        </main>
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-royal-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md justify-around pt-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  window.scrollTo({ top: 0 })
                }}
                className={`flex min-w-14 flex-col items-center rounded-xl px-2 py-1 text-xs font-bold ${tab === t.id ? 'bg-royal-100 text-royal-900' : 'text-royal-500'}`}
                aria-current={tab === t.id ? 'page' : undefined}
              >
                <span className={`text-2xl ${tab === t.id ? '' : 'opacity-70 grayscale-[0.4]'}`}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
        <LevelPicker open={levelOpen} onClose={() => setLevelOpen(false)} />
        <Modal open={pending !== null} onClose={() => setPending(null)}>
          {pending && <LessonStart lesson={pending} onStart={() => startLesson(pending)} onClose={() => setPending(null)} />}
        </Modal>
        <Modal open={welcome} onClose={() => setWelcome(false)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Piti mood="celebrate" size={120} />
            <h2 className="text-2xl font-black">ברוכה הבאה לממלכה, המלכה אביב! 👑</h2>
            <p className="text-royal-800">
              אני {META.mascot.name}, הינשופה המלכותית. נעבור יחד על פיתגורס, יחס, פרופורציה וקנה מידה — שיעור קצר כל יום, ונגיע למבחן מוכנות לגמרי.
            </p>
            <p className="text-sm text-royal-700">קודם בחרי רמה (אפשר לשנות בכל רגע מהכתר למעלה):</p>
            <Button
              className="w-full"
              variant="gold"
              onClick={() => {
                setWelcome(false)
                setLevelOpen(true)
              }}
            >
              בואי נתחיל!
            </Button>
          </div>
        </Modal>
      </>
    )

  return (
    <>
      {content}
      <BadgeToast />
    </>
  )
}

function BadgeToast() {
  const newBadges = useStore((s) => s.newBadges)
  const clear = useStore((s) => s.clearNewBadges)
  const badge = useMemo(() => META.badges.find((b) => b.id === newBadges[0]), [newBadges])
  useEffect(() => {
    if (!badge) return
    play('levelup')
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, colors: ['#f5b301', '#ffd84d', '#db2777', '#6d28d9'] })
  }, [badge])
  return (
    <AnimatePresence>
      {badge && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-royal-950/60 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={clear}>
          <motion.div initial={{ scale: 0.5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }} className="relative w-full max-w-xs overflow-hidden rounded-3xl bg-cream p-6 text-center shadow-2xl">
            <div className="shine pointer-events-none absolute inset-0" />
            <img src={`${import.meta.env.BASE_URL}art/celebrate.webp`} alt="" className="mx-auto h-32" />
            <p className="text-sm font-bold text-fuchsia-royal">תג חדש!</p>
            <h2 className="text-2xl font-black text-royal-900">{badge.name}</h2>
            <p className="text-royal-700">{badge.condition}</p>
            <Button className="mt-4 w-full" variant="gold" onClick={clear}>
              מלכותי! 👑
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
