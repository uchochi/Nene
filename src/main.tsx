import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isTMA } from './utils/tma'
import { migrateLegacyStorageKeys } from './utils/migrateStorage'
import App from './App'
import LandingPage from './components/landing/LandingPage'

migrateLegacyStorageKeys()

function boot() {
  if (isTMA()) {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } else {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <LandingPage />
      </StrictMode>,
    )
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
