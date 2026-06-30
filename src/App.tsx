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

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />
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
