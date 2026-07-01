import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isTMA } from './utils/tma'
import App from './App'

function boot() {
  if (!isTMA() && import.meta.env.VITE_REDIRECT_URL) {
    window.location.href = import.meta.env.VITE_REDIRECT_URL
  } else {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
