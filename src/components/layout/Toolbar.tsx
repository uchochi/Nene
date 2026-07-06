import { useRef, useState, useEffect } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import { useCreditStore } from '../../store/creditStore'
import { Play, Save, Trash2, Menu, FileDown, Upload } from 'lucide-react'
import { downloadJSONL } from '../../utils/jsonl'
import { isTMA, hapticFeedback } from '../../utils/tma'
import { COST_PER_RUN, COST_PER_EXPORT } from '../../utils/credits'

interface ToolbarProps {
  onToggleSidebar: () => void
  onBuyCredits: (reason?: string) => void
}

export function Toolbar({ onToggleSidebar, onBuyCredits }: ToolbarProps) {
  const workflowName = useWorkflowStore(s => s.workflowName)
  const setWorkflowName = useWorkflowStore(s => s.setWorkflowName)
  const runWorkflow = useWorkflowStore(s => s.runWorkflow)
  const isRunning = useWorkflowStore(s => s.isRunning)
  const saveWorkflow = useWorkflowStore(s => s.saveWorkflow)
  const clearWorkflow = useWorkflowStore(s => s.clearWorkflow)
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const addToHistory = useWorkflowStore(s => s.addToHistory)
  const nodes = useWorkflowStore(s => s.nodes)
  const isDirty = useWorkflowStore(s => s.isDirty)
  const activeWorkflowId = useWorkflowStore(s => s.activeWorkflowId)
  const importWorkflow = useWorkflowStore(s => s.importWorkflow)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [showMobileActions, setShowMobileActions] = useState(false)
  const mobileActionsRef = useRef<HTMLDivElement>(null)

  /* close mobile dropdown on outside click */
  useEffect(() => {
    if (!showMobileActions) return
    const handler = (e: MouseEvent) => {
      if (mobileActionsRef.current && !mobileActionsRef.current.contains(e.target as Node)) {
        setShowMobileActions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMobileActions])

  const canAfford = useCreditStore(s => s.canAfford)
  const deductCredits = useCreditStore(s => s.deductCredits)
  const balance = useCreditStore(s => s.balance)

  const handleRun = async () => {
    if (!canAfford(COST_PER_RUN)) {
      onBuyCredits(`You need at least ${COST_PER_RUN} credit to run a workflow. You have ${balance}.`)
      return
    }

    await runWorkflow()
    await deductCredits(COST_PER_RUN)
    if (isTMA()) hapticFeedback('success')
  }

  const handleExport = async () => {
    if (!datasetResult) return

    if (!canAfford(COST_PER_EXPORT)) {
      onBuyCredits(`You need at least ${COST_PER_EXPORT} credit to export. You have ${balance}.`)
      return
    }

    const filename = `${workflowName.replace(/\s+/g, '_').toLowerCase()}_dataset.jsonl`
    try {
      downloadJSONL(datasetResult, filename)
    } catch {
      /* download failed — fall back to clipboard */
      try {
        await navigator.clipboard.writeText(datasetResult)
      } catch {
        return /* both failed, give up */
      }
    }

    await deductCredits(COST_PER_EXPORT)
    const rowCount = datasetResult.split('\n').filter(l => l.trim()).length
    await addToHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      workflowName,
      rowCount,
      outputPreview: datasetResult.slice(0, 200),
    })
    if (isTMA()) hapticFeedback('success')
  }

  const handleImport = () => {
    importInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const ok = await importWorkflow(text)
      if (ok && isTMA()) {
        hapticFeedback('success')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
      <div className="h-12 bg-n8n-dark-2 border-b border-n8n-dark-4 flex items-center px-3 gap-2 flex-shrink-0">
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelected}
        />

        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="w-px h-6 bg-n8n-dark-4" />

        {/* dirty indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDirty ? 'bg-n8n-orange' : 'bg-green-500'}`}
          title={isDirty ? 'Unsaved changes' : 'Saved'} />

        <input
          className="bg-transparent text-sm font-medium text-white border-none outline-none focus:bg-n8n-dark-4 px-2 py-1 rounded-lg min-w-0 flex-1 md:w-44 md:flex-none transition-colors"
          value={workflowName}
          onChange={e => setWorkflowName(e.target.value)}
        />

        {!activeWorkflowId && nodes.length > 0 && (
          <span className="text-[10px] text-n8n-orange bg-n8n-orange/10 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
            unsaved
          </span>
        )}

        <div className="flex-1" />

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleImport}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Import workflow"
          >
            <Upload size={14} />
            Import
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || nodes.length === 0}
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            <Play size={14} />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={saveWorkflow}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Save workflow"
          >
            <Save size={14} />
            Save
          </button>

          <button
            onClick={handleExport}
            disabled={!datasetResult}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Export dataset"
          >
            <FileDown size={14} />
            Export
          </button>

          <button
            onClick={clearWorkflow}
            className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-n8n-red transition-colors"
            title="Clear canvas"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Mobile Actions dropdown */}
        <div className="md:hidden relative" ref={mobileActionsRef}>
          <button
            onClick={() => setShowMobileActions(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-xs font-medium text-white transition-colors"
          >
            Actions
            <svg className={`w-3 h-3 transition-transform ${showMobileActions ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showMobileActions && (
            <div className="absolute top-full right-0 mt-1.5 bg-n8n-dark-2 border border-n8n-dark-4 rounded-lg p-2 flex flex-col gap-1.5 min-w-[150px] z-50 shadow-xl">
              <button onClick={() => { handleImport(); setShowMobileActions(false) }} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-n8n-dark-4 hover:bg-n8n-dark-5 text-xs font-medium text-n8n-gray-light hover:text-white transition-colors">
                <Upload size={14} />
                Import
              </button>

              <button onClick={async () => { await handleRun(); setShowMobileActions(false) }} disabled={isRunning || nodes.length === 0} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-n8n-red hover:bg-n8n-red/80 text-xs font-medium text-white transition-colors disabled:opacity-50">
                <Play size={14} />
                {isRunning ? 'Running...' : 'Run'}
              </button>

              <button onClick={async () => { await saveWorkflow(); setShowMobileActions(false) }} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-n8n-dark-4 hover:bg-n8n-dark-5 text-xs font-medium text-n8n-gray-light hover:text-white transition-colors">
                <Save size={14} />
                Save
              </button>

              <button onClick={() => { handleExport(); setShowMobileActions(false) }} disabled={!datasetResult} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-n8n-dark-4 hover:bg-n8n-dark-5 text-xs font-medium text-n8n-gray-light hover:text-white transition-colors disabled:opacity-40">
                <FileDown size={14} />
                Export
              </button>

              <button onClick={() => { clearWorkflow(); setShowMobileActions(false) }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-n8n-dark-4 text-xs font-medium text-n8n-gray-light hover:text-n8n-red transition-colors">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
