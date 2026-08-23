import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OnboardingScreen } from './components/onboarding/OnboardingScreen'
import { AuthScreen } from './components/auth/AuthScreen'
import { VerifyEmailBanner } from './components/auth/VerifyEmailBanner'
import { GlobalLayout } from './components/layout/GlobalLayout'
import { OverviewPage } from './pages/OverviewPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { HistoryPage } from './pages/HistoryPage'
import { CreditsPage } from './pages/CreditsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProjectEditorPage } from './pages/ProjectEditorPage'
import { useWorkflowStore } from './store/workflowStore'
import { useCreditStore } from './store/creditStore'
import { useAuthStore } from './store/authStore'
import { initTMA } from './utils/tma'

export default function App() {
  const showOnboarding = useWorkflowStore(s => s.showOnboarding)
  const wfInitialized = useWorkflowStore(s => s.initialized)
  const wfInitialize = useWorkflowStore(s => s.initialize)

  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  const initialized = useAuthStore(s => s.initialized)
  const initialize = useAuthStore(s => s.initialize)
  const configError = useAuthStore(s => s.configError)

  const creditInitialized = useCreditStore(s => s.initialized)
  const creditInitialize = useCreditStore(s => s.initialize)

  useEffect(() => {
    initTMA()
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user && !wfInitialized) {
      wfInitialize(user.id)
    }
  }, [user, wfInitialized, wfInitialize])

  useEffect(() => {
    if (user && !creditInitialized) {
      creditInitialize(user.id)
    }
  }, [user, creditInitialized, creditInitialize])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-n8n-dark-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-n8n-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-n8n-dark-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 bg-n8n-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-n8n-red text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Configuration Error</h2>
          <p className="text-sm text-n8n-gray mb-4">{configError}</p>
          <p className="text-xs text-n8n-gray">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  if (showOnboarding) {
    return <OnboardingScreen />
  }

  return (
    <ErrorBoundary>
    <VerifyEmailBanner />
    <Routes>
      {/* account-level pages share the global Vercel-style sidebar */}
      <Route element={<GlobalLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* project editor — node palette + canvas + toolbar only */}
      <Route path="/projects/:id" element={<ProjectEditorPage />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}
