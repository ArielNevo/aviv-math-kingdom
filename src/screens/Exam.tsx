import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { MathText } from '../components/MathText'
import { Piti } from '../components/Piti'
import { QuestionView } from '../components/QuestionView'
import { Button, Card, Modal, ProgressBar } from '../components/ui'
import { answerDisplay } from '../lib/answers'
import { TOPIC_NAMES } from '../lib/curriculum'
import { buildExam } from '../lib/session'
import { play } from '../lib/sound'
import { useStore } from '../lib/store'
import type { MainTopic, Question } from '../lib/types'

const DURATION = 30 * 60

const bucket = (q: Question) => (q.boss || q.topics.filter((t) => t !== 'combo').length > 1 ? 'combo' : q.topics[0])

export function Exam({ onExit, onPractice }: { onExit: () => void; onPractice: (t: MainTopic | 'combo') => void }) {
  const store = useStore()
  const questions = useMemo(() => buildExam({ level: store.level, inverseEnabled: false }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { correct: boolean; given: string }>>({})
  const [left, setLeft] = useState(DURATION)
  const [finished, setFinished] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (finished) return
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (clearInterval(t), 0) : l - 1)), 1000)
    return () => clearInterval(t)
  }, [finished])
  useEffect(() => {
    if (left === 0 && !finished) submit()
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    setConfirm(false)
    setFinished(true)
    const correct = questions.filter((_, k) => answers[k]?.correct).length
    const score = Math.round((correct / questions.length) * 100)
    const byTopic: Record<string, { correct: number; total: number }> = {}
    questions.forEach((q, k) => {
      const b = bucket(q)
      byTopic[b] ??= { correct: 0, total: 0 }
      byTopic[b].total++
      if (answers[k]?.correct) byTopic[b].correct++
      if (!answers[k]) store.recordAnswer(q, false, q.difficulty, 1)
    })
    store.finishExam({ date: Date.now(), score, level: store.level, byTopic })
    play('finish')
    if (score >= 70) confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#f5b301', '#6d28d9', '#db2777'] })
  }

  const onCheck = (correct: boolean, given: string) => {
    setAnswers((a) => ({ ...a, [i]: { correct, given } }))
    store.recordAnswer(questions[i], correct, questions[i].difficulty, questions[i].boss ? 1.5 : 1)
    play('tap')
  }

  if (finished) return <ExamResults questions={questions} answers={answers} onExit={onExit} onPractice={onPractice} />

  const q = questions[i]
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const answered = Object.keys(answers).length
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4">
      <div className="sticky top-0 z-20 -mx-4 bg-cream/95 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => setConfirm(true)} className="rounded-xl bg-royal-700 px-3 py-1.5 text-sm font-black text-white">
            הגשה
          </button>
          <ProgressBar value={answered / questions.length} />
          <span dir="ltr" className={`rounded-xl px-2 py-1 font-mono text-lg font-black ${left < 300 ? 'bg-rose-100 text-rose-700' : 'bg-royal-100 text-royal-900'}`}>
            {mm}:{ss}
          </span>
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {questions.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`h-8 w-8 shrink-0 rounded-lg text-sm font-black ${k === i ? 'bg-royal-700 text-white' : answers[k] ? 'bg-royal-200 text-royal-900' : 'bg-white text-royal-400 ring-1 ring-royal-100'}`}
            >
              {k + 1}
            </button>
          ))}
        </div>
      </div>
      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 pb-10">
        <p className="mb-2 text-sm font-bold text-royal-600">
          שאלה {i + 1} מתוך {questions.length}
        </p>
        <QuestionView key={q.id + i} q={q} neutral state={answers[i] ? 'correct' : 'idle'} onCheck={onCheck} checkLabel="שמירת תשובה" />
        {answers[i] && (
          <p className="mt-3 rounded-2xl bg-royal-100 p-3 text-center font-bold text-royal-900">
            התשובה נשמרה: <MathText text={answers[i].given} /> ✓
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="white" className="flex-1" disabled={i === 0} onClick={() => setI(i - 1)}>
            הקודמת
          </Button>
          {i < questions.length - 1 ? (
            <Button className="flex-1" onClick={() => setI(i + 1)}>
              הבאה ‹
            </Button>
          ) : (
            <Button className="flex-1" variant="gold" onClick={() => setConfirm(true)}>
              סיום והגשה
            </Button>
          )}
        </div>
      </motion.div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="להגיש את המבחן?">
        <div className="flex flex-col gap-3 text-center">
          <p>
            ענית על {answered} מתוך {questions.length} שאלות.
          </p>
          <Button variant="gold" onClick={submit}>
            הגשה 🏁
          </Button>
          <Button variant="white" onClick={() => setConfirm(false)}>
            עוד רגע
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ExamResults({
  questions,
  answers,
  onExit,
  onPractice,
}: {
  questions: Question[]
  answers: Record<number, { correct: boolean; given: string }>
  onExit: () => void
  onPractice: (t: MainTopic | 'combo') => void
}) {
  const correct = questions.filter((_, k) => answers[k]?.correct).length
  const score = Math.round((correct / questions.length) * 100)
  const byTopic: Record<string, { c: number; t: number }> = {}
  questions.forEach((q, k) => {
    const b = bucket(q)
    byTopic[b] ??= { c: 0, t: 0 }
    byTopic[b].t++
    if (answers[k]?.correct) byTopic[b].c++
  })
  const weak = Object.entries(byTopic)
    .filter(([, v]) => v.c / v.t < 0.75)
    .sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t)
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Piti mood={score >= 70 ? 'celebrate' : 'encourage'} size={110} />
        <p className="text-sm font-bold text-royal-700">הציון שלך</p>
        <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} dir="ltr" className={`text-7xl font-black ${score >= 85 ? 'text-gold-600' : score >= 60 ? 'text-royal-700' : 'text-rose-600'}`}>
          {score}
        </motion.p>
        <p className="text-lg font-black">{score >= 85 ? 'מוכנה למבחן! 👑💎' : score >= 70 ? 'כמעט שם — עוד קצת ליטוש!' : score >= 50 ? 'בדרך הנכונה. בואי נחזק כמה נושאים.' : 'זה בדיוק בשביל זה יש מבחן מדומה 💜'}</p>
      </div>
      <Card className="mt-5 space-y-3">
        <h2 className="font-black">פירוט לפי נושא</h2>
        {Object.entries(byTopic).map(([t, v]) => (
          <div key={t}>
            <div className="mb-1 flex justify-between text-sm font-bold">
              <span>{TOPIC_NAMES[t as MainTopic]}</span>
              <span dir="ltr">
                {v.c}/{v.t}
              </span>
            </div>
            <ProgressBar value={v.c / v.t} color={v.c / v.t >= 0.75 ? 'bg-emerald-500' : v.c / v.t >= 0.5 ? 'bg-gold-400' : 'bg-rose-500'} />
          </div>
        ))}
      </Card>
      {weak.length > 0 && (
        <Card className="mt-4 border-fuchsia-royal/30 bg-pink-50">
          <h2 className="font-black text-fuchsia-royal">מה לחזק? 🎯</h2>
          <p className="mb-2 text-sm text-royal-800">פיתי ממליצה להתחיל מכאן:</p>
          <div className="flex flex-wrap gap-2">
            {weak.map(([t]) => (
              <Button key={t} variant="pink" className="text-base" onClick={() => onPractice(t as MainTopic | 'combo')}>
                לתרגל {TOPIC_NAMES[t as MainTopic]}
              </Button>
            ))}
          </div>
        </Card>
      )}
      <h2 className="mt-6 mb-2 font-black">כל השאלות</h2>
      <div className="space-y-2">
        {questions.map((q, k) => (
          <div key={k} className={`rounded-2xl border-2 bg-white ${answers[k]?.correct ? 'border-emerald-300' : 'border-rose-300'}`}>
            <button onClick={() => setOpen(open === k ? null : k)} className="flex w-full items-start gap-2 p-3 text-right">
              <span>{answers[k]?.correct ? '✅' : answers[k] ? '❌' : '⏭️'}</span>
              <span className="flex-1 text-sm">
                <MathText text={q.text} />
              </span>
            </button>
            {open === k && (
              <div className="border-t border-royal-100 p-3 text-sm">
                {answers[k] && (
                  <p>
                    ענית: <MathText text={answers[k].given} />
                  </p>
                )}
                <p className="font-black text-emerald-800">
                  תשובה נכונה: <MathText text={answerDisplay(q)} />
                </p>
                <ol className="mt-2 list-decimal space-y-1 pr-5">
                  {q.solutionSteps.map((s, n) => (
                    <li key={n}>
                      <MathText text={s} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button className="mt-6 w-full" variant="gold" onClick={onExit}>
        חזרה לממלכה
      </Button>
    </div>
  )
}
