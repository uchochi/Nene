import { useEffect, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { Canvas } from './components/layout/Canvas'
import { ConfigPanel } from './components/nodes/ConfigPanel'
import { OnboardingScreen } from './components/onboarding/OnboardingScreen'
import { DatasetPreview } from './components/dataset/DatasetPreview'
import { AuthScreen } from './components/auth/AuthScreen'
import { useWorkflowStore } from './store/workflowStore'
import { useAuthStore } from './store/authStore'
import { initTMA } from './utils/tma'

export default function App() {
  const showOnboarding = useWorkflowStore(s => s.showOnboarding)
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId)
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const wfInitialized = useWorkflowStore(s => s.initialized)
  const wfInitialize = useWorkflowStore(s => s.initialize)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  const initialized = useAuthStore(s => s.initialized)
  const initialize = useAuthStore(s => s.initialize)
  const configError = useAuthStore(s => s.configError)

  useEffect(() => {
    initTMA()
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user && !wfInitialized) {
      wfInitialize(user.id)
    }
  }, [user, wfInitialized, wfInitialize])

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
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-n8n-dark">
        <Toolbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Canvas />
            {datasetResult && <DatasetPreview />}
          </div>
          {selectedNodeId && <ConfigPanel />}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
