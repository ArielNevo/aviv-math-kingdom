import { interpolate, spring, Easing } from 'remotion'
import { FPS } from './theme'

/** 0→1 over `dur` frames starting at `start`, eased. */
export const ramp = (f: number, start: number, dur = 15) =>
  interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })

/** Springy pop-in value (0→1, slight overshoot). */
export const pop = (f: number, start: number) => spring({ frame: f - start, fps: FPS, config: { damping: 11, stiffness: 140, mass: 0.6 } })

/** Frame at a fraction of the scene. */
export const at = (d: number, frac: number) => Math.round(d * frac)
