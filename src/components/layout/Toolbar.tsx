import { useRef } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import { Play, Save, Trash2, Menu, FileDown, Upload } from 'lucide-react'
import { downloadJSONL } from '../../utils/jsonl'
import { isTMA, hapticFeedback } from '../../utils/tma'

interface ToolbarProps {
  onToggleSidebar: () => void
}

export function Toolbar({ onToggleSidebar }: ToolbarProps) {
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

  const handleRun = async () => {
    await runWorkflow()
    if (isTMA()) hapticFeedback('success')
  }

  const handleExport = () => {
    if (!datasetResult) return
    const filename = `${workflowName.replace(/\s+/g, '_').toLowerCase()}_dataset.jsonl`
    downloadJSONL(datasetResult, filename)
    const rowCount = datasetResult.split('\n').filter(l => l.trim()).length
    addToHistory({
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

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (importWorkflow(text)) {
        if (isTMA()) hapticFeedback('success')
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
        className="bg-transparent text-sm font-medium text-white border-none outline-none focus:bg-n8n-dark-4 px-2 py-1 rounded-lg w-44 transition-colors"
        value={workflowName}
        onChange={e => setWorkflowName(e.target.value)}
      />

      {!activeWorkflowId && nodes.length > 0 && (
        <span className="text-[10px] text-n8n-orange bg-n8n-orange/10 px-1.5 py-0.5 rounded whitespace-nowrap">
          unsaved
        </span>
      )}

      <div className="flex-1" />

      {/* Import workflow */}
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
  )
}
