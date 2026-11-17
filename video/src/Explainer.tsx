import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { C, FPS, fontFamily } from './theme'
import { pop, ramp } from './anim'
import { Piti } from './components/Piti'
import timeline from './timeline.json'
import { VISUALS } from './videos'

export const INTRO = 45 // title sting before the first line
export const AUDIO_DELAY = 6 // frames between scene start and its narration
export const TAIL = 10 // frames of breathing room after each line
export const OUTRO = 36

export type SceneT = { key: string; cid: string; audio: string | null; seconds: number; text: string; env: number[] }
export type VideoT = { id: string; title: string; subtitle: string; scenes: SceneT[] }

export const sceneFrames = (s: SceneT) => AUDIO_DELAY + Math.ceil(s.seconds * FPS) + TAIL

export const totalFrames = (v: VideoT) => INTRO + v.scenes.reduce((a, s) => a + sceneFrames(s), 0) + OUTRO

export const getVideo = (id: string) => (timeline as unknown as { videos: VideoT[] }).videos.find((v) => v.id === id)!

/** Split a narration line into short caption chunks, timed by character share. */
const chunks = (text: string) => {
  const parts = text.split(/(?<=[,.?!:])\s+/)
  const out: string[] = []
  for (const p of parts) {
    const last = out[out.length - 1]
    if (last && (last + ' ' + p).length <= 34) out[out.length - 1] = last + ' ' + p
    else out.push(p)
  }
  return out
}

const Captions: React.FC<{ text: string; f: number; frames: number }> = ({ text, f, frames }) => {
  const cs = chunks(text)
  const total = cs.reduce((a, c) => a + c.length, 0)
  let acc = 0
  let idx = cs.length - 1
  const t = (f - AUDIO_DELAY) / Math.max(1, frames)
  for (let i = 0; i < cs.length; i++) {
    acc += cs[i].length / total
    if (t < acc) { idx = i; break }
  }
  const startOf = AUDIO_DELAY + frames * (cs.slice(0, idx).reduce((a, c) => a + c.length, 0) / total)
  const o = ramp(f, startOf, 5)
  return (
    <div
      style={{
        position: 'absolute', left: 28, right: 28, top: 922, height: 150, borderRadius: 30, background: 'rgba(255,255,255,0.94)',
        border: `4px solid ${C.lilac}`, boxShadow: '0 10px 30px rgba(76,29,149,0.14)', display: 'grid', placeItems: 'center', padding: '0 26px',
      }}
    >
      <div dir="rtl" style={{ fontFamily, fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: C.ink, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 10}px)` }}>
        {cs[idx]}
      </div>
    </div>
  )
}

const Background: React.FC<{ f: number }> = ({ f }) => {
  const sparkles = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 137) % 700 + 10, y: (i * 251) % 1200 + 30, s: 10 + (i % 4) * 5, ph: i * 0.7,
  }))
  return (
    <AbsoluteFill style={{ background: C.cream, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', left: -260, top: -220, background: 'radial-gradient(circle, rgba(109,40,217,0.18), rgba(109,40,217,0) 70%)', transform: `translate(${Math.sin(f / 60) * 20}px, ${Math.cos(f / 70) * 20}px)` }} />
      <div style={{ position: 'absolute', width: 640, height: 640, borderRadius: '50%', right: -260, bottom: 120, background: 'radial-gradient(circle, rgba(219,39,119,0.14), rgba(219,39,119,0) 70%)', transform: `translate(${Math.cos(f / 50) * 18}px, ${Math.sin(f / 65) * 18}px)` }} />
      {sparkles.map((s, i) => (
        <svg key={i} width={s.s} height={s.s} viewBox="0 0 10 10" style={{ position: 'absolute', left: s.x, top: s.y, opacity: 0.25 + 0.25 * Math.sin(f / 18 + s.ph) }}>
          <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={i % 3 ? C.gold : C.fuchsia} />
        </svg>
      ))}
    </AbsoluteFill>
  )
}

const Header: React.FC<{ v: VideoT; f: number }> = ({ v, f }) => {
  const o = ramp(f, INTRO - 6, 12)
  return (
    <div style={{ position: 'absolute', top: 44, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: o, fontFamily }}>
      <div dir="rtl" style={{ background: C.purple, color: '#fff', borderRadius: 999, padding: '8px 22px', fontSize: 24, fontWeight: 700 }}>
        👑 ממלכת המתמטיקה של אביב
      </div>
      <div dir="rtl" style={{ fontSize: 50, fontWeight: 800, color: C.purple, lineHeight: 1.05, textAlign: 'center' }}>{v.title}</div>
      <div dir="rtl" style={{ fontSize: 32, fontWeight: 700, color: C.fuchsia, lineHeight: 1, textAlign: 'center' }}>{v.subtitle}</div>
    </div>
  )
}

const Sting: React.FC<{ v: VideoT; f: number }> = ({ v, f }) => {
  const out = interpolate(f, [INTRO - 10, INTRO], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const p = pop(f, 2)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${C.violet}, ${C.purple})`, opacity: out, alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily }}>
      <div style={{ fontSize: 150, transform: `scale(${p}) rotate(${(1 - p) * -30}deg)` }}>👑</div>
      <div dir="rtl" style={{ color: '#fff', fontSize: 66, fontWeight: 800, textAlign: 'center', transform: `translateY(${(1 - pop(f, 8)) * 60}px)`, opacity: ramp(f, 8, 8), padding: '0 30px' }}>
        {v.title}
      </div>
      <div dir="rtl" style={{ color: C.gold, fontSize: 40, fontWeight: 700, opacity: ramp(f, 14, 8) }}>{v.subtitle}</div>
    </AbsoluteFill>
  )
}

export const Explainer: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame()
  const v = getVideo(id)
  const Visual = VISUALS[id]
  const total = totalFrames(v)

  // locate the active scene to drive Piti's beak
  let start = INTRO
  let talk = 0
  for (const s of v.scenes) {
    const n = sceneFrames(s)
    if (f >= start && f < start + n) {
      const k = f - start - AUDIO_DELAY
      if (k >= 0 && k < s.env.length) talk = s.env[k]
    }
    start += n
  }
  const blink = (f % 97) < 4 ? 1 : 0
  const bob = Math.sin(f / 9) * 4

  let cursor = INTRO
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background f={f} />
      <Header v={v} f={f} />
      {v.scenes.map((s, i) => {
        const n = sceneFrames(s) + (i === v.scenes.length - 1 ? OUTRO : 0)
        const from = cursor
        cursor += sceneFrames(s)
        return (
          <Sequence key={s.key} from={from} durationInFrames={n} layout="none">
            <SceneBody v={v} s={s} n={n} Visual={Visual} />
            {s.audio && (
              <Sequence from={AUDIO_DELAY} layout="none">
                <Audio src={staticFile(s.audio)} />
              </Sequence>
            )}
          </Sequence>
        )
      })}
      {/* Piti + credit */}
      <div style={{ position: 'absolute', left: 22, top: 1088, transform: `translateY(${bob}px)`, opacity: ramp(f, INTRO - 4, 10) }}>
        <Piti size={150} talk={talk} blink={blink} wing={talk * 14} look={Math.sin(f / 40)} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', right: 34, top: 1130, fontFamily, opacity: ramp(f, INTRO, 10), textAlign: 'right' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.purple }}>פיתי ואבא מסבירים</div>
        <div style={{ fontSize: 21, fontWeight: 500, color: '#6b5a8e', marginTop: 4 }}>הקול של אבא נוצר בשיבוט קול בבינה מלאכותית</div>
      </div>
      {/* progress */}
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 10, width: `${(f / total) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.fuchsia})` }} />
      {f < INTRO && <Sting v={v} f={f} />}
    </AbsoluteFill>
  )
}

const SceneBody: React.FC<{ v: VideoT; s: SceneT; n: number; Visual: VisualFn }> = ({ s, n, Visual }) => {
  const f = useCurrentFrame()
  const narr = Math.ceil(s.seconds * FPS)
  const fadeIn = ramp(f, 0, 8)
  const fadeOut = interpolate(f, [n - 8, n], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <>
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>{Visual(s.key, f, n, narr)}</AbsoluteFill>
      <Captions text={s.text} f={f} frames={narr} />
    </>
  )
}

/** (sceneKey, frame-in-scene, scene length, narration length) → visual */
export type VisualFn = (key: string, f: number, d: number, narr: number) => React.ReactNode
