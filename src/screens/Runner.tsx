import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { MathText } from '../components/MathText'
import { Piti, SpeechBubble } from '../components/Piti'
import { QuestionView, type AnswerState } from '../components/QuestionView'
import { Button, Hearts, Modal, ProgressBar, levelInfo } from '../components/ui'
import { answerDisplay } from '../lib/answers'
import { META, similarGenerator } from '../lib/curriculum'
import { generate } from '../lib/generators'
import { pick } from '../lib/math'
import type { QuestionSource } from '../lib/session'
import { play } from '../lib/sound'
import { useStore } from '../lib/store'
import type { Level, Question } from '../lib/types'

interface Props {
  title: string
  source: QuestionSource
  lessonId: string | null
  usesHearts: boolean
  fixedLevel?: Level
  onExit: () => void
  onNeedHearts?: () => void
}

interface Result {
  q: Question
  correct: boolean
  level: Level
}

export function Runner({ title, source, lessonId, usesHearts, fixedLevel, onExit, onNeedHearts }: Props) {
  const store = useStore()
  const [level, setLevel] = useState<Level>(fixedLevel ?? store.level)
  const used = useRef(new Set<string>())
  const [total, setTotal] = useState(source.total)
  const [index, setIndex] = useState(0)
  const [q, setQ] = useState<Question>(() => {
    const first = source.next(0, fixedLevel ?? store.level, used.current)
    used.current.add(first.id)
    return first
  })
  const [state, setState] = useState<AnswerState>('idle')
  const [given, setGiven] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [xpEarned, setXpEarned] = useState(0)
  const [run, setRun] = useState(0) // consecutive correct
  const [wrongs, setWrongs] = useState(0)
  const [downgraded, setDowngraded] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [line, setLine] = useState('')
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(false)
  const [quit, setQuit] = useState(false)
  const [outOfHearts, setOutOfHearts] = useState(false)
  const [levelOpen, setLevelOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const showToast = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 2600)
  }

  const onCheck = (correct: boolean, g: string) => {
    setGiven(g)
    setState(correct ? 'correct' : 'wrong')
    const xp = store.recordAnswer(q, correct, q.difficulty ?? level, source.xpMultiplier > 1 || q.boss ? 1.5 : 1)
    setXpEarned((x) => x + xp)
    setResults((r) => [...r, { q, correct, level }])
    play(correct ? 'correct' : 'wrong')
    const newRun = correct ? run + 1 : 0
    setRun(newRun)
    if (correct) {
      const streakLine = newRun === 10 ? META.mascot.streak[2] : newRun === 5 ? META.mascot.streak[1] : newRun === 3 ? META.mascot.streak[0] : null
      setLine(streakLine ?? pick(Math.random, META.mascot.correct))
    } else {
      setLine(pick(Math.random, META.mascot.wrong))
      if (usesHearts) store.spendHearts(1)
    }
    // adaptive difficulty
    if (store.adaptive && !fixedLevel) {
      if (correct && newRun > 0 && newRun % 4 === 0 && level < 3) {
        const nl = (level + 1) as Level
        setLevel(nl)
        store.setLevel(nl)
        play('levelup')
        showToast(`עלית ל${levelInfo(nl).name}! ${levelInfo(nl).emoji}`)
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.3 }, colors: ['#f5b301', '#6d28d9', '#db2777'] })
      }
      if (!correct) {
        const w = wrongs + 1
        setWrongs(w)
        if (w >= 3 && level > 1 && !downgraded) {
          const nl = (level - 1) as Level
          setLevel(nl)
          store.setLevel(nl)
          setDowngraded(true)
          showToast(`נעבור רגע ל${levelInfo(nl).name} ${levelInfo(nl).emoji} — כדי לחזק את הבסיס`)
        }
      }
    }
  }

  const useHint = () => {
    if (hint) return
    setHint(true)
    if (usesHearts) store.spendHearts(0.5)
  }

  const trySimilar = () => {
    const gen = similarGenerator(q)
    if (!gen) return next()
    const sim = generate(gen, q.difficulty ?? level)
    setTotal((t) => t + 1)
    next(sim)
  }

  const finish = () => {
    const correctCount = results.filter((r) => r.correct).length
    const acc = results.length ? correctCount / results.length : 0
    store.finishLesson(lessonId, acc, results.every((r) => r.correct))
    setDone(true)
    play('finish')
    const end = Date.now() + 1200
    ;(function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#f5b301', '#6d28d9', '#db2777'] })
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#f5b301', '#6d28d9', '#db2777'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  const next = (override?: Question) => {
    if (usesHearts && useStore.getState().hearts <= 0) {
      setOutOfHearts(true)
      return
    }
    const ni = index + 1
    const effectiveTotal = override ? total + 1 : total
    if (ni >= effectiveTotal && !override) return finish()
    const nq = override ?? source.next(ni, level, used.current)
    used.current.add(nq.id)
    setQ(nq)
    setIndex(ni)
    setState('idle')
    setHint(false)
    setGiven('')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    store.tickHearts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (done) {
    const correctCount = results.filter((r) => r.correct).length
    const acc = results.length ? Math.round((correctCount / results.length) * 100) : 0
    const perfect = correctCount === results.length && results.length > 0
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <Piti mood="celebrate" size={140} />
        <motion.h1 initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-3xl font-black text-royal-900">
          {perfect ? 'שיעור מושלם! 💎' : acc >= 80 ? 'מלכותי לחלוטין! 👑' : acc >= 50 ? 'עבודה יפה, המלכה!' : 'כל טעות — צעד קדימה 💪'}
        </motion.h1>
        <div className="grid w-full grid-cols-3 gap-3">
          {[
            ['⭐', 'XP', `+${xpEarned}`, 'bg-gold-400/20 border-gold-400'],
            ['🎯', 'דיוק', `${acc}%`, 'bg-emerald-50 border-emerald-400'],
            ['✅', 'נכונות', `${correctCount}/${results.length}`, 'bg-royal-50 border-royal-300'],
          ].map(([e, l, v, c]) => (
            <motion.div key={l} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`rounded-2xl border-[3px] p-3 ${c}`}>
              <div className="text-2xl">{e}</div>
              <div dir="ltr" className="text-2xl font-black">
                {v}
              </div>
              <div className="text-xs font-bold text-royal-800">{l}</div>
            </motion.div>
          ))}
        </div>
        {results.some((r) => !r.correct) && <p className="text-sm text-royal-800">השאלות שטעית בהן נכנסו ל"תרגול טעויות" — נחזור אליהן מחר, בעוד 3 ימים ובעוד שבוע.</p>}
        <Button className="w-full" variant="gold" onClick={onExit}>
          המשך 👑
        </Button>
      </div>
    )
  }

  const progress = index / total + (state !== 'idle' ? 1 / total : 0)

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4" ref={topRef}>
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-cream/95 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur">
        <button onClick={() => setQuit(true)} className="text-2xl text-royal-400" aria-label="יציאה">
          ✕
        </button>
        <ProgressBar value={progress} />
        <button onClick={() => !fixedLevel && setLevelOpen(true)} className="text-2xl" aria-label="שינוי רמה" title={levelInfo(level).name}>
          {levelInfo(level).emoji}
        </button>
        {usesHearts && <Hearts value={store.hearts} compact />}
      </div>
      <p className="mb-2 text-sm font-bold text-royal-600">{title}</p>

      <AnimatePresence mode="wait">
        <motion.div key={q.id + index} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.25 }} className="flex-1 pb-56">
          <QuestionView q={q} state={state} onCheck={onCheck} />
          {state === 'idle' && (
            <div className="mt-3">
              {hint ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                  <Piti mood="encourage" size={44} />
                  <SpeechBubble>
                    💡 <MathText text={q.hint} />
                  </SpeechBubble>
                </motion.div>
              ) : (
                <button onClick={useHint} className="text-sm font-bold text-royal-700 underline decoration-dotted underline-offset-4">
                  💡 רמז {usesHearts && '(חצי לב)'}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {state !== 'idle' && (
          <Feedback q={q} correct={state === 'correct'} given={given} line={line} onNext={() => next()} onSimilar={trySimilar} canSimilar={Boolean(similarGenerator(q))} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm rounded-3xl bg-royal-900 px-5 py-3 text-center text-lg font-black text-gold-300 shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={quit} onClose={() => setQuit(false)} title="לצאת מהשיעור?">
        <div className="flex flex-col items-center gap-4">
          <Piti mood="encourage" size={80} />
          <p className="text-center">ההתקדמות בשיעור הזה לא תישמר. בטוחה?</p>
          <Button className="w-full" onClick={() => setQuit(false)}>
            להמשיך ללמוד 💪
          </Button>
          <Button className="w-full" variant="white" onClick={onExit}>
            לצאת
          </Button>
        </div>
      </Modal>

      <Modal open={outOfHearts} onClose={() => {}} title="נגמרו הלבבות 💔">
        <div className="flex flex-col items-center gap-4 text-center">
          <Piti mood="encourage" size={90} />
          <p>גם מלכות צריכות הפסקה. לבב אחד חוזר כל 4 שעות — או שאפשר למלא את כולם מיד אם צופים בשיעורון או בסרטון קצר.</p>
          <Button className="w-full" variant="gold" onClick={() => onNeedHearts?.()}>
            לשיעורון שממלא לבבות ❤️
          </Button>
          <Button className="w-full" variant="white" onClick={onExit}>
            חזרה למפה
          </Button>
        </div>
      </Modal>

      <Modal open={levelOpen} onClose={() => setLevelOpen(false)} title="שינוי רמה">
        <div className="space-y-2">
          {META.difficultyLevels.map((d) => (
            <Button
              key={d.level}
              variant={d.level === level ? 'primary' : 'white'}
              className="w-full"
              onClick={() => {
                setLevel(d.level)
                store.setLevel(d.level)
                setLevelOpen(false)
              }}
            >
              {d.emoji} {d.name}
            </Button>
          ))}
          <p className="text-center text-sm text-royal-700">השינוי חל מהשאלה הבאה.</p>
        </div>
      </Modal>
    </div>
  )
}

function Feedback({ q, correct, given, line, onNext, onSimilar, canSimilar }: { q: Question; correct: boolean; given: string; line: string; onNext: () => void; onSimilar: () => void; canSimilar: boolean }) {
  const [showSteps, setShowSteps] = useState(!correct)
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={`safe-bottom fixed inset-x-0 bottom-0 z-40 max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t-4 px-4 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] ${
        correct ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'
      }`}
      role="status"
    >
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <Piti mood={correct ? 'celebrate' : 'encourage'} size={60} />
          <div>
            <p className={`text-2xl font-black ${correct ? 'text-emerald-700' : 'text-rose-700'}`}>{correct ? 'נכון!' : 'לא בדיוק…'}</p>
            <p className="font-bold text-royal-900">{line}</p>
          </div>
        </div>
        {!correct && (
          <div className="mt-3 rounded-2xl bg-white p-3">
            {given && q.type !== 'match' && q.type !== 'order' && (
              <p className="text-sm text-rose-700">
                התשובה שלך: <MathText text={given} />
              </p>
            )}
            <p className="text-lg font-black text-emerald-800">
              התשובה הנכונה: <MathText text={q.type === 'match' || q.type === 'order' ? '' : answerDisplay(q)} />
            </p>
            {q.type === 'find_error' && q.correctAnswer !== undefined && (
              <p className="font-bold text-royal-900">
                והתוצאה הנכונה: <MathText text={String(q.correctAnswer)} />
              </p>
            )}
          </div>
        )}
        {q.type === 'true_false' || correct ? (
          <button onClick={() => setShowSteps((s) => !s)} className="mt-2 text-sm font-bold text-royal-800 underline underline-offset-4">
            {showSteps ? 'הסתרת הפתרון' : 'איך פותרים? 👀'}
          </button>
        ) : null}
        {showSteps && (
          <motion.ol initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1.5 rounded-2xl bg-white/80 p-3">
            <p className="mb-1 text-sm font-black text-royal-700">הפתרון צעד-אחר-צעד:</p>
            {q.solutionSteps.map((s, i) => (
              <motion.li key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.25 }} className="flex gap-2 text-base">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal-700 text-xs font-bold text-white">{i + 1}</span>
                <MathText text={s} />
              </motion.li>
            ))}
          </motion.ol>
        )}
        <div className="mt-3 flex flex-col gap-2 pb-2">
          {!correct && canSimilar && (
            <Button variant="primary" onClick={onSimilar}>
              הבנתי, נסי שוב דומה 🔁
            </Button>
          )}
          <Button variant={correct ? 'green' : 'white'} onClick={onNext}>
            המשך
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
