import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isTMA } from './utils/tma'
import App from './App'

const redirectUrl = import.meta.env.VITE_REDIRECT_URL
if (!isTMA() && redirectUrl) {
  window.location.href = redirectUrl
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
