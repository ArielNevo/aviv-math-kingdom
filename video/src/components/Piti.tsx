import React from 'react'
import { C } from '../theme'

/**
 * פיתי — an original little owl with a gold crown (drawn from scratch for this project).
 * `talk` 0..1 opens the beak, `blink` 0..1 closes the eyes, `wing` rotates the wings (degrees).
 */
export const Piti: React.FC<{ size?: number; talk?: number; blink?: number; wing?: number; look?: number }> = ({
  size = 160, talk = 0, blink = 0, wing = 0, look = 0,
}) => {
  const eyeScale = 1 - 0.92 * blink
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220">
      {/* shadow */}
      <ellipse cx="100" cy="212" rx="58" ry="7" fill="#000" opacity="0.12" />
      {/* wings */}
      <g transform={`rotate(${-wing} 42 140)`}>
        <ellipse cx="38" cy="150" rx="20" ry="42" fill={C.purple} />
      </g>
      <g transform={`rotate(${wing} 158 140)`}>
        <ellipse cx="162" cy="150" rx="20" ry="42" fill={C.purple} />
      </g>
      {/* ear tufts */}
      <path d="M48 70 L40 30 L78 58 Z" fill={C.purple} />
      <path d="M152 70 L160 30 L122 58 Z" fill={C.purple} />
      {/* body */}
      <ellipse cx="100" cy="132" rx="68" ry="78" fill={C.violet} />
      {/* belly */}
      <ellipse cx="100" cy="160" rx="44" ry="46" fill="#fff3d6" />
      {[0, 1, 2].map((r) =>
        [-1, 0, 1].map((c) => (
          <path key={`${r}${c}`} d={`M${100 + c * 18 - 7} ${146 + r * 16} q7 7 14 0`} stroke="#e9c98a" strokeWidth="3" fill="none" strokeLinecap="round" />
        )),
      )}
      {/* cheeks */}
      <circle cx="58" cy="128" r="9" fill={C.fuchsia} opacity="0.35" />
      <circle cx="142" cy="128" r="9" fill={C.fuchsia} opacity="0.35" />
      {/* eyes */}
      {[72, 128].map((x) => (
        <g key={x}>
          <circle cx={x} cy="100" r="27" fill="#fff" stroke={C.gold} strokeWidth="5" />
          <g transform={`translate(${x} 100) scale(1 ${eyeScale}) translate(${-x} -100)`}>
            <circle cx={x + look * 6 + (x < 100 ? 4 : -4)} cy="102" r="12" fill={C.ink} />
            <circle cx={x + look * 6 + (x < 100 ? 8 : 0)} cy="97" r="4" fill="#fff" />
          </g>
        </g>
      ))}
      {/* beak */}
      <path d="M88 122 L112 122 L100 136 Z" fill="#f59e0b" />
      <g transform={`translate(0 ${talk * 7})`}>
        <path d="M91 130 L109 130 L100 140 Z" fill="#d97706" />
      </g>
      {/* feet */}
      <path d="M78 204 l-6 8 M78 204 l0 9 M78 204 l6 8" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      <path d="M122 204 l-6 8 M122 204 l0 9 M122 204 l6 8" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      {/* crown */}
      <g transform="translate(0 -4)">
        <path d="M66 52 L70 18 L86 36 L100 10 L114 36 L130 18 L134 52 Z" fill={C.gold} stroke="#d99a00" strokeWidth="3" strokeLinejoin="round" />
        <rect x="66" y="46" width="68" height="10" rx="3" fill="#ffcf33" stroke="#d99a00" strokeWidth="2" />
        <circle cx="100" cy="30" r="5" fill={C.fuchsia} />
        <circle cx="80" cy="40" r="4" fill="#38bdf8" />
        <circle cx="120" cy="40" r="4" fill="#38bdf8" />
      </g>
    </svg>
  )
}
