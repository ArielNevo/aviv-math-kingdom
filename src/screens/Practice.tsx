import { motion } from 'framer-motion'
import { Piti } from '../components/Piti'
import { Button, Card, levelInfo } from '../components/ui'
import { META, TOPIC_NAMES } from '../lib/curriculum'
import { dueMistakes, useStore } from '../lib/store'
import type { Level, MainTopic } from '../lib/types'

const TOPIC_EMOJI: Record<MainTopic | 'combo', string> = { pythagoras: '📐', ratio: '⚖️', proportion: '🌉', scale: '🗺️', combo: '🏰' }

export function Practice({
  onPractice,
  onMistakes,
  onExam,
  onIntro,
}: {
  onPractice: (t: MainTopic | 'combo') => void
  onMistakes: () => void
  onExam: () => void
  onIntro: (t: MainTopic) => void
}) {
  const s = useStore()
  const due = dueMistakes(s)
  const all = Object.values(s.mistakes)
  const lastExam = s.exams[s.exams.length - 1]
  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <div className="mt-4 flex items-center gap-3">
        <Piti mood="encourage" size={64} />
        <div>
          <h1 className="text-2xl font-black text-royal-900">חדר האימונים 🏋️‍♀️</h1>
          <p className="text-sm text-royal-800">שאלות בלי סוף, בלי לבבות. בחרי נושא ורמה.</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {META.difficultyLevels.map((d) => (
          <button
            key={d.level}
            onClick={() => s.setLevel(d.level as Level)}
            className={`flex-1 rounded-2xl border-[3px] py-2 font-black ${s.level === d.level ? 'border-royal-700 bg-royal-100' : 'border-royal-100 bg-white'}`}
          >
            {d.emoji} {d.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {(['pythagoras', 'ratio', 'proportion', 'scale', 'combo'] as const).map((t, i) => {
          const st = Object.values(s.stats[t] ?? {})
          const tot = st.reduce((a, b) => a + b.total, 0)
          const cor = st.reduce((a, b) => a + b.correct, 0)
          return (
            <motion.button
              key={t}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPractice(t)}
              className={`btn-3d rounded-3xl border-2 border-royal-100 bg-white p-4 text-right ${t === 'combo' ? 'col-span-2 bg-gradient-to-l from-royal-50 to-pink-50' : ''}`}
            >
              <span className="text-3xl">{TOPIC_EMOJI[t]}</span>
              <span className="mt-1 block text-lg font-black">{t === 'combo' ? 'שאלות משולבות (בוס)' : TOPIC_NAMES[t]}</span>
              <span className="block text-xs text-royal-700">{tot ? `${Math.round((cor / tot) * 100)}% דיוק · ${tot} שאלות` : 'עוד לא תרגלת'}</span>
            </motion.button>
          )
        })}
      </div>

      <Card className="mt-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔁</span>
          <div className="flex-1">
            <h2 className="text-lg font-black">תרגול טעויות</h2>
            <p className="text-sm text-royal-800">
              {all.length === 0
                ? 'אין טעויות במאגר. מלכותי! 👑'
                : `${due.length} לחזרה עכשיו · ${all.length} במאגר. חוזרים אחרי יום, 3 ימים ושבוע.`}
            </p>
          </div>
        </div>
        <Button className="mt-3 w-full" variant="pink" disabled={all.length === 0} onClick={onMistakes}>
          {due.length ? `לתרגל ${due.length} טעויות` : 'לתרגל את כל המאגר'}
        </Button>
      </Card>

      <Card className="mt-4 bg-gradient-to-br from-white to-amber-50">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}art/tower-final.webp`} alt="" className="h-20 w-auto" />
          <div className="flex-1">
            <h2 className="text-lg font-black">מבחן מדומה 🏆</h2>
            <p className="text-sm text-royal-800">12 שאלות מכל הנושאים (4 משולבות) · 30 דקות · רמת {levelInfo(s.level).name}</p>
            {lastExam && (
              <p className="mt-1 text-sm font-bold text-emerald-700">
                הציון האחרון: <span dir="ltr">{lastExam.score}</span>
              </p>
            )}
          </div>
        </div>
        <Button className="mt-3 w-full" variant="gold" onClick={onExam}>
          להתחיל מבחן
        </Button>
      </Card>

      <h2 className="mt-6 mb-2 text-lg font-black text-royal-800">📖 שיעורונים לחזרה</h2>
      <div className="grid grid-cols-2 gap-2">
        {(['pythagoras', 'ratio', 'proportion', 'scale'] as const).map((t) => (
          <Button key={t} variant="white" onClick={() => onIntro(t)}>
            {TOPIC_EMOJI[t]} {TOPIC_NAMES[t]}
          </Button>
        ))}
      </div>
    </div>
  )
}
