import type { Topic } from '../lib/types'

/** Short explainer videos rendered by the Remotion project in /video into public/videos. */
export interface VideoInfo {
  id: string
  topic: Topic
  title: string
  subtitle: string
  /** Approximate length in seconds (shown on the card) */
  seconds: number
}

export const VIDEOS: VideoInfo[] = [
  { id: 'pyth-hypotenuse', topic: 'pythagoras', title: 'מה זה יתר? משפט פיתגורס', subtitle: 'המגרש של אביב: 30, 40 ו... 50', seconds: 60 },
  { id: 'pyth-leg', topic: 'pythagoras', title: 'מחפשים ניצב? מחסרים!', subtitle: 'והטעות שכולם עושים', seconds: 50 },
  { id: 'ratio-parts', topic: 'ratio', title: 'חלוקה לפי יחס — שיטת החלקים', subtitle: 'כמה סוכריות לכל אחת?', seconds: 55 },
  { id: 'proportion-cross', topic: 'proportion', title: 'פרופורציה והכפלה צולבת', subtitle: 'מחברות, מחירים ו-x', seconds: 55 },
  { id: 'scale-map', topic: 'scale', title: 'קנה מידה: ממפה למציאות ובחזרה', subtitle: 'טבלת ההמרות שחוסכת טעויות', seconds: 60 },
  { id: 'scale-area', topic: 'scale', title: 'שטח בקנה מידה — מעלים בריבוע!', subtitle: 'למה פי 100 הופך לפי 10,000', seconds: 50 },
  { id: 'combo-map-pyth', topic: 'combo', title: 'שאלת בוס: מפה + פיתגורס', subtitle: '6 ס"מ מזרחה, 8 ס"מ צפונה', seconds: 60 },
]

export const videoSrc = (id: string) => `${import.meta.env.BASE_URL}videos/${id}.mp4`
export const videoPoster = (id: string) => `${import.meta.env.BASE_URL}videos/${id}.jpg`
