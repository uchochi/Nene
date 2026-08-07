import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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
