import katex from 'katex'
import { Fragment, useMemo } from 'react'

/**
 * Renders Hebrew text where math runs (numbers, ratios, formulas, coordinates) are isolated
 * as LTR so "1:50,000" and "a² + b² = c²" display correctly inside an RTL sentence.
 */
const MATH_RUN =
  /([A-Za-z]?\(?[0-9A-Za-z√∆Δ][0-9A-Za-z√²³∆Δ.,:/×÷·=+\-−≈≠<>()|'*^%→ ]*[0-9A-Za-z²³)√|%]|[0-9A-Za-z][²³%]?)/g

export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { t: string; math: boolean }[] = []
    let last = 0
    const isMath = (s: string) => /[0-9√²=:+−\-×÷/]/.test(s) || /^[A-Za-z]/.test(s)
    for (const m of text.matchAll(MATH_RUN)) {
      if (m.index! > last) out.push({ t: text.slice(last, m.index), math: false })
      // "40: c² = …" — a colon followed by a space is punctuation, not a ratio
      for (const piece of m[0].split(/(:\s+)/)) {
        if (!piece) continue
        if (/^:\s+$/.test(piece)) out.push({ t: piece, math: false })
        else out.push({ t: piece, math: isMath(piece) })
      }
      last = m.index! + m[0].length
    }
    if (last < text.length) out.push({ t: text.slice(last), math: false })
    return out
  }, [text])
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.math ? (
          <bdi key={i} dir="ltr" className="math-run">
            {p.t}
          </bdi>
        ) : (
          <Fragment key={i}>{p.t}</Fragment>
        ),
      )}
    </span>
  )
}

export function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => katex.renderToString(tex, { displayMode: display, throwOnError: false }), [tex, display])
  return <span dir="ltr" className={className} style={{ unicodeBidi: 'isolate' }} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Multi-line text with line breaks and bullet points. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text.split('\n').map((line, i) => (
        <p key={i} className={line.startsWith('•') ? 'pr-1' : ''}>
          <MathText text={line} />
        </p>
      ))}
    </div>
  )
}
