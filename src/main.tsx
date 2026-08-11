import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { isTMA } from './utils/tma'
import { migrateLegacyStorageKeys } from './utils/migrateStorage'
import App from './App'
import LandingPage from './components/landing/LandingPage'

migrateLegacyStorageKeys()

/* Make ALL silent errors visible in the Telegram WebView */
window.addEventListener('error', (e) => {
  console.error('[global error]', e.error || e.message)
  alert('Error: ' + (e.error?.message || e.message))
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandled promise]', e.reason)
  alert('Promise Error: ' + (e.reason?.message || String(e.reason)))
})

function boot() {
  if (isTMA()) {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
  } else {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </StrictMode>,
    )
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
