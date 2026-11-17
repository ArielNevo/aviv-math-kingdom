import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { MathText } from '../components/MathText'
import { Avatar, Button, Card, Modal, Toggle, levelInfo } from '../components/ui'
import { META, MAIN_TOPICS, TOPIC_NAMES } from '../lib/curriculum'
import { exportProgress, todayKey, useStore, type ProgressState } from '../lib/store'
import type { Level } from '../lib/types'

const BADGE_ICONS: Record<string, string> = {
  first_lesson: '👣',
  pyth_master: '📐',
  ratio_queen: '⚖️',
  prop_bridge: '🌉',
  cartographer: '🗺️',
  perfect: '💎',
  streak7: '🔥',
  boss_slayer: '⚔️',
  empress: '👸',
  mock_exam: '🏆',
}

export function Profile() {
  const s = useStore()
  const [levelTab, setLevelTab] = useState<Level | 0>(0)
  const days = Array.from({ length: 14 }, (_, k) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - k))
    const key = todayKey(d)
    return { key, label: d.getDate(), xp: s.days[key]?.xp ?? 0, wd: d.getDay() }
  })
  const maxXp = Math.max(30, ...days.map((d) => d.xp))
  const totalQ = Object.values(s.days).reduce((a, d) => a + d.total, 0)
  const totalC = Object.values(s.days).reduce((a, d) => a + d.correct, 0)

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-royal-950 text-white">
        <img src={`${import.meta.env.BASE_URL}avatar/aviv-hero.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="relative flex flex-col items-center gap-2 bg-gradient-to-t from-royal-950 via-royal-950/40 to-transparent px-4 pt-14 pb-5 text-center">
          <Avatar size={110} glow />
          <h1 className="mt-2 text-3xl font-black">
            {META.student.title} {META.student.name} 👑
          </h1>
          <p className="text-sm text-royal-100">
            {META.student.fullName} · כיתה {META.student.grade} · {levelInfo(s.level).emoji} {levelInfo(s.level).name}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['🔥', s.streak, 'ימים ברצף'],
          ['⭐', s.xp, 'XP'],
          ['🎯', totalQ ? `${Math.round((totalC / totalQ) * 100)}%` : '—', 'דיוק כללי'],
        ].map(([e, v, l]) => (
          <Card key={String(l)} className="p-3">
            <div className="text-2xl">{e}</div>
            <div dir="ltr" className="text-xl font-black">
              {v}
            </div>
            <div className="text-xs font-bold text-royal-700">{l}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 font-black">XP ב-14 הימים האחרונים</h2>
        <div className="flex h-32 items-end gap-1" dir="ltr">
          {days.map((d, k) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                className={`w-full rounded-t-md ${d.key === todayKey() ? 'bg-gold-400' : 'bg-royal-500'}`}
                initial={{ height: 0 }}
                animate={{ height: `${(d.xp / maxXp) * 100}px` }}
                transition={{ delay: k * 0.03 }}
                title={`${d.xp} XP`}
              />
              <span className={`text-[10px] ${d.wd === 6 ? 'font-black text-fuchsia-royal' : 'text-royal-600'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">דיוק לפי נושא</h2>
          <div className="flex gap-1 text-xs">
            {([0, 1, 2, 3] as const).map((l) => (
              <button key={l} onClick={() => setLevelTab(l)} className={`rounded-full px-2 py-1 font-bold ${levelTab === l ? 'bg-royal-700 text-white' : 'bg-royal-100 text-royal-800'}`}>
                {l === 0 ? 'הכל' : levelInfo(l as Level).emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[...MAIN_TOPICS, 'combo' as const].map((t) => {
            const byLevel = s.stats[t] ?? {}
            const entries = levelTab === 0 ? Object.values(byLevel) : byLevel[levelTab as Level] ? [byLevel[levelTab as Level]] : []
            const tot = entries.reduce((a, b) => a + b.total, 0)
            const cor = entries.reduce((a, b) => a + b.correct, 0)
            const pct = tot ? cor / tot : 0
            return (
              <div key={t}>
                <div className="mb-1 flex justify-between text-sm font-bold">
                  <span>{TOPIC_NAMES[t]}</span>
                  <span dir="ltr" className="text-royal-700">
                    {tot ? `${Math.round(pct * 100)}% · ${cor}/${tot}` : '—'}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-royal-100">
                  <motion.div className={`h-full rounded-full ${pct >= 0.8 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-gold-400' : 'bg-fuchsia-royal'}`} initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <h2 className="mt-6 mb-2 text-lg font-black">התגים שלי ({Object.keys(s.badges).length}/{META.badges.length})</h2>
      <div className="grid grid-cols-2 gap-3">
        {META.badges.map((b, k) => {
          const got = s.badges[b.id]
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: k * 0.04 }}
              className={`relative overflow-hidden rounded-2xl border-2 p-3 text-center ${got ? 'border-gold-400 bg-gradient-to-br from-amber-50 to-pink-50' : 'border-zinc-200 bg-zinc-50'}`}
            >
              {got && <div className="shine pointer-events-none absolute inset-0" />}
              <div className={`text-4xl ${got ? '' : 'opacity-40 grayscale'}`}>{BADGE_ICONS[b.id] ?? '🏅'}</div>
              <div className={`mt-1 text-sm font-black ${got ? 'text-royal-900' : 'text-zinc-500'}`}>{b.name}</div>
              <div className="text-xs text-zinc-500">
                <MathText text={b.condition} />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function Settings() {
  const s = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const row = (title: string, sub: string, el: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 border-b border-royal-100 py-3 last:border-0">
      <div>
        <p className="font-black">{title}</p>
        <p className="text-sm text-royal-700">{sub}</p>
      </div>
      {el}
    </div>
  )
  const doExport = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `aviv-math-progress-${todayKey()}.json`
    a.click()
  }
  const doImport = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text())
      const state = (parsed.state ?? parsed) as Partial<ProgressState>
      if (typeof state.xp !== 'number') throw new Error('bad file')
      s.importState(state)
      setMsg('ההתקדמות יובאה בהצלחה ✓')
    } catch {
      setMsg('הקובץ לא נראה כמו קובץ התקדמות 🤔')
    }
  }
  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <h1 className="mt-4 text-2xl font-black text-royal-900">הגדרות ⚙️</h1>
      <Card className="mt-3">
        <p className="mb-2 font-black">רמת קושי</p>
        <div className="flex gap-2">
          {META.difficultyLevels.map((d) => (
            <button key={d.level} onClick={() => s.setLevel(d.level)} className={`flex-1 rounded-2xl border-[3px] p-2 ${s.level === d.level ? 'border-royal-700 bg-royal-100' : 'border-royal-100 bg-white'}`}>
              <div className="text-2xl">{d.emoji}</div>
              <div className="font-black">{d.name}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-royal-700">{levelInfo(s.level).description}</p>
      </Card>
      <Card className="mt-3">
        {row('מצב אדפטיבי', 'הרמה עולה ויורדת לבד לפי ההצלחה', <Toggle checked={s.adaptive} onChange={(v) => s.set({ adaptive: v })} label="אדפטיבי" />)}
        {row('יחס הפוך', 'תוכן אופציונלי (פועלים/ימים, מהירות/זמן)', <Toggle checked={s.inverse} onChange={(v) => s.set({ inverse: v })} label="יחס הפוך" />)}
        {row('סאונד', 'צלילים לתשובה נכונה, שגויה וסיום', <Toggle checked={s.sound} onChange={(v) => s.set({ sound: v })} label="סאונד" />)}
        {row('לפתוח את כל היחידות', 'בלי לחכות לסיום השלבים הקודמים', <Toggle checked={s.unlockAll} onChange={(v) => s.set({ unlockAll: v })} label="פתיחת הכול" />)}
      </Card>
      <Card className="mt-3 space-y-2">
        <p className="font-black">גיבוי התקדמות</p>
        <p className="text-sm text-royal-700">ההתקדמות נשמרת בטלפון הזה. אפשר לייצא לקובץ ולייבא במכשיר אחר.</p>
        <div className="flex gap-2">
          <Button variant="white" className="flex-1 text-base" onClick={doExport}>
            ⬇️ ייצוא
          </Button>
          <Button variant="white" className="flex-1 text-base" onClick={() => fileRef.current?.click()}>
            ⬆️ ייבוא
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
        {msg && <p className="text-center text-sm font-bold text-royal-800">{msg}</p>}
      </Card>
      <Button variant="red" className="mt-4 w-full" onClick={() => setResetOpen(true)}>
        איפוס התקדמות
      </Button>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="לאפס הכול?">
        <div className="flex flex-col gap-3 text-center">
          <p>כל ה-XP, הרצף, התגים והטעויות יימחקו. אי אפשר לבטל את זה (אלא אם ייצאת גיבוי).</p>
          <Button
            variant="red"
            onClick={() => {
              s.reset()
              setResetOpen(false)
            }}
          >
            כן, לאפס
          </Button>
          <Button variant="white" onClick={() => setResetOpen(false)}>
            ביטול
          </Button>
        </div>
      </Modal>
      <p className="mt-6 text-center text-xs text-royal-500">נבנה באהבה לאביב 💜 · גרסה 1.0</p>
    </div>
  )
}
