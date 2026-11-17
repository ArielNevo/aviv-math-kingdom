import type { VisualFn } from '../Explainer'
import { pythHypotenuse } from './pythHypotenuse'
import { pythLeg } from './pythLeg'
import { ratioParts } from './ratioParts'
import { proportionCross } from './proportionCross'
import { scaleMap, scaleArea } from './scale'
import { comboMapPyth } from './comboMapPyth'

export const VISUALS: Record<string, VisualFn> = {
  'pyth-hypotenuse': pythHypotenuse,
  'pyth-leg': pythLeg,
  'ratio-parts': ratioParts,
  'proportion-cross': proportionCross,
  'scale-map': scaleMap,
  'scale-area': scaleArea,
  'combo-map-pyth': comboMapPyth,
}
