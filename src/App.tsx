import { useEffect, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { Canvas } from './components/layout/Canvas'
import { ConfigPanel } from './components/nodes/ConfigPanel'
import { OnboardingScreen } from './components/onboarding/OnboardingScreen'
import { DatasetPreview } from './components/dataset/DatasetPreview'
import { useWorkflowStore } from './store/workflowStore'
import { initTMA } from './utils/tma'

export default function App() {
  const showOnboarding = useWorkflowStore(s => s.showOnboarding)
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId)
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    initTMA()
  }, [])

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
