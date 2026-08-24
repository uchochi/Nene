import { useEffect, useState, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import { NodePaletteSidebar } from '../components/layout/NodePaletteSidebar'
import { Toolbar } from '../components/layout/Toolbar'
import { Canvas } from '../components/layout/Canvas'
import { ConfigPanel } from '../components/nodes/ConfigPanel'
import { DatasetPreview } from '../components/dataset/DatasetPreview'
import { ExportModal } from '../components/export/ExportModal'
import { CreditTopUp } from '../components/credits/CreditTopUp'
import { TokenBillingAnnouncement } from '../components/credits/TokenBillingAnnouncement'
import { EditorTour } from '../tour/EditorTour'
import { useWorkflowStore } from '../store/workflowStore'

export function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>()

  const savedWorkflows = useWorkflowStore(s => s.savedWorkflows)
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow)
  const activeWorkflowId = useWorkflowStore(s => s.activeWorkflowId)
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId)
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpReason, setTopUpReason] = useState('')
  const [showExport, setShowExport] = useState(false)

  const onBuyCredits = useCallback((reason = '') => {
    setTopUpReason(reason)
    setShowTopUp(true)
  }, [])

  /* tour helper — opens/closes the node palette (mobile starts collapsed) */
  const setPaletteOpen = useCallback((open: boolean) => setSidebarOpen(open), [])

  /* ── resolve the route param to a workflow ── */
  const isNew = !id || id === 'new'
  const exists = isNew || savedWorkflows.some(w => w.id === id)

  /* load the workflow into the editor if a different one is requested */
  useEffect(() => {
    if (!id || isNew) return
    if (id !== activeWorkflowId) {
      loadWorkflow(id)
    }
  }, [id, isNew, activeWorkflowId, loadWorkflow])

  /* when creating a new project, reset the canvas to blank */
  useEffect(() => {
    if (isNew) {
      try { newWorkflow() } catch (e) { console.error('newWorkflow error:', e) }
    }
  }, [isNew, newWorkflow])

  /* invalid project id → bounce back to the projects list */
  if (!exists) {
    return <Navigate to="/app/projects" replace />
  }

  return (
    <ReactFlowProvider>
      <CreditTopUp open={showTopUp} onClose={() => setShowTopUp(false)} reason={topUpReason} />
      <TokenBillingAnnouncement />
      <EditorTour setPaletteOpen={setPaletteOpen} />
      {showExport && <ExportModal open={showExport} onClose={() => setShowExport(false)} />}

      <div className="h-screen w-screen flex flex-col overflow-hidden bg-n8n-dark">
        <Toolbar
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          onBuyCredits={onBuyCredits}
          onOpenExport={() => setShowExport(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <NodePaletteSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
            <Canvas />
            {datasetResult && <DatasetPreview />}
          </div>
          {selectedNodeId && <ConfigPanel />}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
