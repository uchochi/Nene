import { useWorkflowStore } from '../../store/workflowStore'
import { Play, Save, Trash2, Menu, FileDown } from 'lucide-react'
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

  return (
    <div className="h-12 bg-n8n-dark-2 border-b border-n8n-dark-4 flex items-center px-3 gap-3 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
        title="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      <div className="w-px h-6 bg-n8n-dark-4" />

      <input
        className="bg-transparent text-sm font-medium text-white border-none outline-none focus:bg-n8n-dark-4 px-2 py-1 rounded-lg w-48 transition-colors"
        value={workflowName}
        onChange={e => setWorkflowName(e.target.value)}
      />

      <div className="flex-1" />

      <button
        onClick={handleRun}
        disabled={isRunning || nodes.length === 0}
        className="btn-primary flex items-center gap-2 text-xs"
      >
        <Play size={14} />
        {isRunning ? 'Running...' : 'Run Workflow'}
      </button>

      <button
        onClick={saveWorkflow}
        className="btn-secondary flex items-center gap-2 text-xs"
        title="Save workflow"
      >
        <Save size={14} />
        Save
      </button>

      <button
        onClick={handleExport}
        disabled={!datasetResult}
        className="btn-secondary flex items-center gap-2 text-xs"
        title="Export dataset"
      >
        <FileDown size={14} />
        Export
      </button>

      <button
        onClick={clearWorkflow}
        className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-n8n-red transition-colors"
        title="Clear workflow"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
