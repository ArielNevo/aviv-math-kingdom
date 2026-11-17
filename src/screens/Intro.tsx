import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { RichText } from '../components/MathText'
import { Piti } from '../components/Piti'
import { Button } from '../components/ui'
import { BANK, TOPIC_NAMES } from '../lib/curriculum'
import { play } from '../lib/sound'
import { useStore } from '../lib/store'
import type { MainTopic } from '../lib/types'
import { VIDEOS } from '../data/videos'
import { LessonVisual } from '../visuals/LessonVisual'
import { VideoCard } from './Videos'

export function Intro({ topic, lessonId, onDone }: { topic: MainTopic; lessonId: string | null; onDone: () => void }) {
  const lesson = BANK.lessons[topic]
  const videos = VIDEOS.filter((v) => v.topic === topic)
  const total = lesson.cards.length + (videos.length ? 1 : 0)
  const [i, setI] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const completeIntro = useStore((s) => s.completeIntro)

  const goTo = (n: number) => {
    const el = scroller.current
    if (!el) return
    const child = el.children[n] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    const w = el.clientWidth
    setI(Math.round(Math.abs(el.scrollLeft) / w))
  }
  const finish = () => {
    if (lessonId) completeIntro(lessonId)
    else useStore.getState().refillHearts()
    play('finish')
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, colors: ['#f5b301', '#6d28d9', '#db2777'] })
    onDone()
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
        <button onClick={onDone} className="text-2xl text-royal-400" aria-label="סגירה">
          ✕
        </button>
        <div className="flex flex-1 justify-center gap-1.5">
          {Array.from({ length: total }, (_, n) => (
            <button key={n} onClick={() => goTo(n)} aria-label={`קלף ${n + 1}`} className={`h-2.5 rounded-full transition-all ${n === i ? 'w-7 bg-royal-700' : 'w-2.5 bg-royal-200'}`} />
          ))}
        </div>
        <span className="text-sm font-bold text-royal-600">שיעורון: {TOPIC_NAMES[topic]}</span>
      </div>

      <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto">
        {lesson.cards.map((c, n) => (
          <div key={n} className="w-full shrink-0 snap-center px-4 pb-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.6 }} className="flex h-full flex-col gap-3 rounded-3xl border-2 border-royal-100 bg-white p-5 shadow-sm">
              <span dir="ltr" className="self-start rounded-full bg-royal-100 px-3 py-1 text-xs font-bold text-royal-700">
                {n + 1} / {lesson.cards.length}
              </span>
              <h2 className="text-2xl font-black text-royal-900">{c.title}</h2>
              <div className="rounded-2xl bg-royal-50 p-2">
                <LessonVisual key={i === n ? 'on' : 'off'} id={c.visual} />
              </div>
              <RichText text={c.body} className="space-y-2 text-lg leading-relaxed" />
            </motion.div>
          </div>
        ))}
        {videos.length > 0 && (
          <div className="w-full shrink-0 snap-center px-4 pb-4">
            <div className="flex h-full flex-col gap-3 rounded-3xl border-2 border-royal-100 bg-white p-5">
              <h2 className="text-2xl font-black text-royal-900">🎬 סרטונים קצרים</h2>
              <p className="text-royal-800">רוצה לראות את זה בתנועה? אבא ופיתי מסבירים בערך בדקה:</p>
              {videos.map((v) => (
                <VideoCard key={v.id} v={v} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="safe-bottom flex items-center gap-3 px-4 pt-2">
        {i < total - 1 ? (
          <>
            <Button variant="white" className="w-24" disabled={i === 0} onClick={() => goTo(i - 1)}>
              הקודם
            </Button>
            <Button className="flex-1" onClick={() => goTo(i + 1)}>
              הבא ‹
            </Button>
          </>
        ) : (
          <div className="flex w-full items-center gap-3">
            <Piti mood="celebrate" size={56} />
            <Button className="flex-1" variant="gold" onClick={finish}>
              סיימתי את השיעורון! ❤️ מלא
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
