import { useEffect, useState } from 'react'
import { Piti } from '../components/Piti'
import { TOPIC_NAMES } from '../lib/curriculum'
import { useStore } from '../lib/store'
import { VIDEOS, videoPoster, videoSrc, type VideoInfo } from '../data/videos'

/** A video is only listed once its file exists (they are rendered separately). */
function useAvailable(id: string) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch(videoSrc(id), { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')))
      .catch(() => alive && setOk(false))
    return () => {
      alive = false
    }
  }, [id])
  return ok
}

export function VideoCard({ v }: { v: VideoInfo }) {
  const ok = useAvailable(v.id)
  const [playing, setPlaying] = useState(false)
  if (ok === false)
    return (
      <div className="rounded-2xl border-2 border-dashed border-royal-200 p-3 text-sm text-royal-600">
        🎬 {v.title} — בקרוב
      </div>
    )
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-royal-100 bg-white shadow-sm">
      {playing ? (
        <video
          src={videoSrc(v.id)}
          poster={videoPoster(v.id)}
          controls
          autoPlay
          playsInline
          className="aspect-[9/16] max-h-[70dvh] w-full bg-black object-contain"
          onEnded={() => useStore.getState().refillHearts()}
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="relative block w-full text-right">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-royal-700 to-fuchsia-royal">
            <img src={videoPoster(v.id)} alt="" className="h-full w-full object-cover object-top" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-3xl text-royal-800 shadow-lg">▶</span>
            </span>
            <span dir="ltr" className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 text-xs font-bold text-white">
              ~{v.seconds}s
            </span>
          </div>
          <div className="p-3">
            <p className="font-black text-royal-900">{v.title}</p>
            <p className="text-sm text-royal-700">{v.subtitle}</p>
          </div>
        </button>
      )}
    </div>
  )
}

export function Videos() {
  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <div className="mt-4 flex items-center gap-3">
        <Piti size={64} />
        <div>
          <h1 className="text-2xl font-black text-royal-900">הקולנוע המלכותי 🎬</h1>
          <p className="text-sm text-royal-800">סרטונים קצרים שמסבירים מושג או דרך פתרון. צפייה עד הסוף ממלאת את הלבבות ❤️</p>
        </div>
      </div>
      {(['pythagoras', 'ratio', 'proportion', 'scale', 'combo'] as const).map((t) => {
        const list = VIDEOS.filter((v) => v.topic === t)
        if (!list.length) return null
        return (
          <section key={t} className="mt-6">
            <h2 className="mb-2 text-lg font-black text-royal-800">{TOPIC_NAMES[t]}</h2>
            <div className="grid gap-3">
              {list.map((v) => (
                <VideoCard key={v.id} v={v} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
