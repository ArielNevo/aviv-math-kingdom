import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionGlobalConfig } from 'framer-motion'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// ?noanim skips animations (handy for screenshots / testing)
if (new URLSearchParams(location.search).has('noanim')) MotionGlobalConfig.skipAnimations = true

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
