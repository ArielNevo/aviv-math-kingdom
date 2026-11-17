import { motion, Reorder } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answers'
import { TOPIC_NAMES } from '../lib/curriculum'
import { shuffle } from '../lib/math'
import { play } from '../lib/sound'
import type { Question } from '../lib/types'
import { QuestionFigure } from '../visuals/QuestionFigure'
import { MathText, Tex } from './MathText'
import { Button } from './ui'

export type AnswerState = 'idle' | 'correct' | 'wrong'

interface Props {
  q: Question
  state: AnswerState
  onCheck: (correct: boolean, given: string) => void
  /** exam mode: no correctness colouring */
  neutral?: boolean
  checkLabel?: string
}

const TYPE_LABEL: Partial<Record<Question['type'], string>> = {
  true_false: 'נכון או לא נכון?',
  find_error: 'מצאי את הטעות 🔍',
  match: 'התאמה 🧩',
  order: 'סדר הפתרון 🪜',
  fill_step: 'השלימי את הצעד ✍️',
}

export function QuestionView({ q, state, onCheck, neutral, checkLabel = 'בדיקה' }: Props) {
  const locked = state !== 'idle'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        {q.topics
          .filter((t) => t !== 'combo')
          .map((t) => (
            <span key={t} className="rounded-full bg-royal-100 px-2 py-0.5 text-royal-800">
              {TOPIC_NAMES[t]}
            </span>
          ))}
        {q.boss && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-royal-950">⚔️ בוס</span>}
        {q.inverse && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-900">יחס הפוך</span>}
        {TYPE_LABEL[q.type] && <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-fuchsia-900">{TYPE_LABEL[q.type]}</span>}
      </div>
      <h2 className="text-xl leading-relaxed font-bold text-royal-950">
        <MathText text={q.text} />
      </h2>
      {q.tex && (
        <div className="py-1 text-center text-2xl">
          <Tex tex={q.tex} display />
        </div>
      )}
      {q.figure && <QuestionFigure figure={q.figure} />}
      <Body key={q.id} q={q} locked={locked} state={state} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
    </div>
  )
}

function Body({ q, locked, state, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; state: AnswerState; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  switch (q.type) {
    case 'numeric':
    case 'text':
      return <TypedAnswer q={q} locked={locked} state={state} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
    case 'mcq':
    case 'find_error':
    case 'fill_step':
      return <Choices q={q} locked={locked} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
    case 'true_false':
      return <TrueFalse q={q} locked={locked} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
    case 'match':
      return <Match q={q} locked={locked} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
    case 'order':
      return <Order q={q} locked={locked} neutral={neutral} onCheck={onCheck} checkLabel={checkLabel} />
  }
}

function CheckBar({ disabled, onClick, label, locked }: { disabled: boolean; onClick: () => void; label: string; locked: boolean }) {
  if (locked) return null
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 bg-gradient-to-t from-cream via-cream to-transparent px-4 pt-4 pb-3">
      <Button className="w-full" variant="green" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </div>
  )
}

function TypedAnswer({ q, locked, state, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; state: AnswerState; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  const [v, setV] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 250)
    return () => clearTimeout(t)
  }, [])
  const isText = q.type === 'text'
  const submit = () => v.trim() && onCheck(checkAnswer(q, v), v)
  const insert = (s: string) => {
    setV((x) => x + s)
    ref.current?.focus()
  }
  const border = neutral || state === 'idle' ? 'border-royal-200 focus:border-royal-600' : state === 'correct' ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50'
  return (
    <>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          dir="ltr"
          inputMode={isText ? 'text' : 'decimal'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={isText ? 'למשל 2:3' : 'התשובה שלך'}
          value={v}
          disabled={locked}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className={`min-w-0 flex-1 rounded-2xl border-[3px] bg-white px-4 py-3 text-center text-2xl font-extrabold outline-none ${border}`}
          aria-label="תשובה"
        />
        {q.unit && <span className="shrink-0 text-lg font-bold text-royal-800">{q.unit}</span>}
      </div>
      {!locked && (
        <div className="flex justify-center gap-2" dir="ltr">
          {(isText ? [':', '1:'] : ['√', '.', '−']).map((s) => (
            <button key={s} onClick={() => insert(s === '−' ? '-' : s)} className="min-w-12 rounded-xl border-2 border-royal-200 bg-white px-3 py-1.5 text-xl font-bold text-royal-800">
              {s}
            </button>
          ))}
          {!isText && (
            <span dir="rtl" className="self-center text-xs text-royal-700">
              <MathText text="אפשר גם 5√2" />
            </span>
          )}
        </div>
      )}
      <CheckBar disabled={!v.trim()} onClick={submit} label={checkLabel} locked={locked} />
    </>
  )
}

function optionClass(selected: boolean, locked: boolean, isAnswer: boolean, neutral?: boolean) {
  if (locked && !neutral) {
    if (isAnswer) return 'border-emerald-500 bg-emerald-50 text-emerald-900'
    if (selected) return 'border-rose-400 bg-rose-50 text-rose-900'
    return 'border-royal-100 bg-white opacity-60'
  }
  return selected ? 'border-royal-600 bg-royal-100' : 'border-royal-100 bg-white'
}

function Choices({ q, locked, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  const options = useMemo(() => (q.type === 'fill_step' ? q.options! : shuffle(Math.random, q.options ?? [])), [q])
  const [sel, setSel] = useState<string | null>(null)
  return (
    <>
      {q.type === 'fill_step' && (
        <ol className="space-y-1 rounded-2xl bg-royal-50 p-3 text-base">
          {q.solutionSteps.map((s, i) => (
            <li key={i} className={`rounded-lg px-2 py-1 ${i === q.hiddenIndex ? 'border-2 border-dashed border-fuchsia-royal bg-white text-center font-black text-fuchsia-royal' : ''}`}>
              {i === q.hiddenIndex ? (locked && sel ? <MathText text={String(q.answer)} /> : '?') : <MathText text={s} />}
            </li>
          ))}
        </ol>
      )}
      <div className="grid gap-2">
        {options.map((o) => (
          <motion.button
            whileTap={{ scale: 0.97 }}
            key={o}
            disabled={locked}
            onClick={() => {
              play('tap')
              setSel(o)
            }}
            className={`btn-3d rounded-2xl border-[3px] px-4 py-3 text-right text-lg font-bold ${optionClass(sel === o, locked, o === q.answer, neutral)}`}
          >
            <MathText text={o} />
          </motion.button>
        ))}
      </div>
      <CheckBar disabled={!sel} onClick={() => sel && onCheck(sel === q.answer, sel)} label={checkLabel} locked={locked} />
    </>
  )
}

function TrueFalse({ q, locked, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  const [sel, setSel] = useState<boolean | null>(null)
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((b) => (
          <motion.button
            whileTap={{ scale: 0.96 }}
            key={String(b)}
            disabled={locked}
            onClick={() => {
              play('tap')
              setSel(b)
            }}
            className={`btn-3d rounded-2xl border-[3px] py-5 text-2xl font-black ${optionClass(sel === b, locked, q.answer === b, neutral)}`}
          >
            {b ? '✓ נכון' : '✗ לא נכון'}
          </motion.button>
        ))}
      </div>
      <CheckBar disabled={sel === null} onClick={() => sel !== null && onCheck(checkAnswer(q, sel), sel ? 'נכון' : 'לא נכון')} label={checkLabel} locked={locked} />
    </>
  )
}

const PAIR_COLORS = ['bg-royal-200 border-royal-600', 'bg-pink-100 border-fuchsia-royal', 'bg-amber-100 border-gold-400', 'bg-cyan-100 border-cyan-600']

function Match({ q, locked, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  const pairs = q.pairs!
  const rights = useMemo(() => shuffle(Math.random, pairs.map((p) => p[1])), [pairs])
  const [leftSel, setLeftSel] = useState<number | null>(null)
  const [links, setLinks] = useState<Record<number, string>>({}) // left index → right value
  const usedRights = new Set(Object.values(links))
  const colorOf = (li: number) => PAIR_COLORS[Object.keys(links).map(Number).sort().indexOf(li) % PAIR_COLORS.length]
  const rightColor = (r: string) => {
    const li = Object.entries(links).find(([, v]) => v === r)?.[0]
    return li === undefined ? '' : colorOf(Number(li))
  }
  const tapRight = (r: string) => {
    if (locked || leftSel === null) return
    play('tap')
    const next = { ...links }
    for (const [k, v] of Object.entries(next)) if (v === r) delete next[Number(k)]
    next[leftSel] = r
    setLinks(next)
    setLeftSel(null)
  }
  const correctFor = (li: number) => links[li] === pairs[li][1]
  return (
    <>
      <p className="text-sm text-royal-700">לחצי על פריט מימין ואז על ההתאמה שלו משמאל.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map(([l], i) => (
            <button
              key={l}
              disabled={locked}
              onClick={() => {
                play('tap')
                setLeftSel(i)
              }}
              className={`w-full rounded-2xl border-[3px] px-2 py-3 text-lg font-bold ${
                links[i] !== undefined ? colorOf(i) : leftSel === i ? 'border-royal-600 bg-royal-50' : 'border-royal-100 bg-white'
              } ${locked && !neutral ? (correctFor(i) ? 'ring-4 ring-emerald-400' : 'ring-4 ring-rose-400') : ''}`}
            >
              <MathText text={l} />
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rights.map((r) => (
            <button key={r} disabled={locked} onClick={() => tapRight(r)} className={`w-full rounded-2xl border-[3px] px-2 py-3 text-lg font-bold ${usedRights.has(r) ? rightColor(r) : 'border-royal-100 bg-white'}`}>
              <MathText text={r} />
            </button>
          ))}
        </div>
      </div>
      <CheckBar
        disabled={Object.keys(links).length < pairs.length}
        onClick={() => onCheck(pairs.every((_, i) => correctFor(i)), pairs.map((p, i) => `${p[0]}→${links[i]}`).join(', '))}
        label={checkLabel}
        locked={locked}
      />
    </>
  )
}

function Order({ q, locked, neutral, onCheck, checkLabel }: { q: Question; locked: boolean; neutral?: boolean; onCheck: Props['onCheck']; checkLabel: string }) {
  const correct = q.steps!
  const [items, setItems] = useState(() => {
    let s = shuffle(Math.random, correct)
    for (let i = 0; i < 5 && s.join() === correct.join(); i++) s = shuffle(Math.random, correct)
    return s
  })
  return (
    <>
      <p className="text-sm text-royal-700">גררי את השלבים (מהידית ⠿) לסדר הנכון — מלמעלה למטה.</p>
      <Reorder.Group axis="y" values={items} onReorder={locked ? () => {} : setItems} className="space-y-2">
        {items.map((s, i) => (
          <Reorder.Item
            key={s}
            value={s}
            dragListener={!locked}
            className={`flex touch-none items-center gap-2 rounded-2xl border-[3px] bg-white px-3 py-3 text-base font-bold select-none ${
              locked && !neutral ? (s === correct[i] ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50') : 'border-royal-100'
            }`}
            whileDrag={{ scale: 1.03, boxShadow: '0 10px 25px rgba(76,29,149,0.25)' }}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-royal-700 text-sm text-white">{i + 1}</span>
            <span className="flex-1">
              <MathText text={s} />
            </span>
            <span className="cursor-grab text-xl text-royal-300">⠿</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <CheckBar disabled={false} onClick={() => onCheck(items.join('|') === correct.join('|'), items.join(' → '))} label={checkLabel} locked={locked} />
    </>
  )
}
