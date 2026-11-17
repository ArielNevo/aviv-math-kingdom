// Tiny synthesized sound effects (no audio files needed).
import { useStore } from './store'

let ctx: AudioContext | null = null
const ac = () => (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)())

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, a.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + start)
  o.stop(a.currentTime + start + dur + 0.05)
}

export function play(kind: 'correct' | 'wrong' | 'finish' | 'tap' | 'levelup') {
  if (!useStore.getState().sound) return
  try {
    if (kind === 'correct') {
      tone(784, 0, 0.12, 'triangle')
      tone(1175, 0.09, 0.22, 'triangle')
    } else if (kind === 'wrong') {
      tone(220, 0, 0.18, 'sawtooth', 0.07)
      tone(185, 0.12, 0.25, 'sawtooth', 0.07)
    } else if (kind === 'tap') {
      tone(660, 0, 0.05, 'sine', 0.06)
    } else if (kind === 'levelup') {
      ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.25, 'triangle', 0.14))
    } else {
      ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, 'triangle'))
      tone(1568, 0.5, 0.6, 'sine', 0.1)
    }
  } catch {
    /* audio not available */
  }
}
