import { useRef } from 'react'
import { NodePalette } from '../nodes/NodePalette'
import { useWorkflowStore, type NodeType, type SavedWorkflow } from '../../store/workflowStore'
import {
  History, X, Plus, Download, Upload,
  FileText, Copy, Trash2, Edit3, Settings,
} from 'lucide-react'
import { CreditBalance } from '../credits/CreditBalance'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onBuyCredits: (reason?: string) => void
  onOpenSettings: () => void
}

function WorkflowRow({ wf }: { wf: SavedWorkflow }) {
  const activeWorkflowId = useWorkflowStore(s => s.activeWorkflowId)
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow)
  const deleteWorkflow = useWorkflowStore(s => s.deleteWorkflow)
  const renameWorkflow = useWorkflowStore(s => s.renameWorkflow)
  const duplicateWorkflow = useWorkflowStore(s => s.duplicateWorkflow)
  const exportWorkflow = useWorkflowStore(s => s.exportWorkflow)

  const isActive = wf.id === activeWorkflowId
  const nodeCount = wf.nodes.length

  return (
    <div
      className={`group rounded-lg px-3 py-2 text-xs transition-colors ${
        isActive
          ? 'bg-n8n-red/10 border border-n8n-red/30'
          : 'bg-n8n-dark-4 hover:bg-n8n-dark-5 border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => loadWorkflow(wf.id)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="font-medium text-white truncate flex items-center gap-1.5">
            <FileText size={12} className="text-n8n-gray-light flex-shrink-0" />
            <span className="truncate">{wf.name}</span>
            {isActive && <span className="text-[10px] text-n8n-orange flex-shrink-0">(active)</span>}
          </div>
          <div className="text-n8n-gray mt-0.5">
            {nodeCount} nodes · {new Date(wf.updatedAt).toLocaleDateString()}
          </div>
        </button>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <RenameButton wf={wf} renameWorkflow={renameWorkflow} />
          <button
            onClick={() => duplicateWorkflow(wf.id)}
            className="p-1 rounded hover:bg-n8n-dark-3 text-n8n-gray-light hover:text-white transition-colors"
            title="Duplicate"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => exportWorkflow(wf.id)}
            className="p-1 rounded hover:bg-n8n-dark-3 text-n8n-gray-light hover:text-white transition-colors"
            title="Export"
          >
            <Download size={12} />
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${wf.name}"?`)) deleteWorkflow(wf.id) }}
            className="p-1 rounded hover:bg-n8n-dark-3 text-n8n-gray-light hover:text-n8n-red transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function RenameButton({ wf, renameWorkflow }: { wf: SavedWorkflow; renameWorkflow: (id: string, name: string) => void }) {
  return (
    <button
      onClick={() => {
        const name = prompt('Rename workflow:', wf.name)
        if (name?.trim()) renameWorkflow(wf.id, name.trim())
      }}
      className="p-1 rounded hover:bg-n8n-dark-3 text-n8n-gray-light hover:text-white transition-colors"
      title="Rename"
    >
      <Edit3 size={12} />
    </button>
  )
}

export function Sidebar({ isOpen, onClose, onBuyCredits, onOpenSettings }: SidebarProps) {
  const addNode = useWorkflowStore(s => s.addNode)
  const history = useWorkflowStore(s => s.history)
  const clearHistory = useWorkflowStore(s => s.clearHistory)
  const savedWorkflows = useWorkflowStore(s => s.savedWorkflows)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)
  const importWorkflow = useWorkflowStore(s => s.importWorkflow)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleAddNode = (type: NodeType) => {
    const center = { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 }
    addNode(type, center)
  }

  const handleImport = () => {
    importInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const ok = await importWorkflow(text)
      if (ok) {
        alert('Workflow imported successfully')
      } else {
        alert('Invalid workflow file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (!isOpen) return null

  return (
    <>
      {/* mobile overlay — tap to close sidebar */}
      <div className="fixed inset-0 bg-black/40 z-10 lg:hidden" onClick={onClose} />
      <div className="w-64 bg-n8n-dark-2 border-r border-n8n-dark-4 flex flex-col h-full overflow-hidden flex-shrink-0 relative z-20">
      {/* hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-n8n-dark-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ooguy" className="w-6 h-6" />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Node palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Workflow manager */}
        <div className="border-t border-n8n-dark-4">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-n8n-gray-light" />
              <span className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider">
                Workflows
              </span>
              <span className="text-[10px] text-n8n-gray bg-n8n-dark-4 px-1.5 py-0.5 rounded">
                {savedWorkflows.length}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={newWorkflow}
                className="p-1 rounded hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
                title="New workflow"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleImport}
                className="p-1 rounded hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
                title="Import workflow"
              >
                <Upload size={14} />
              </button>
            </div>
          </div>
          <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
            {savedWorkflows.length === 0 ? (
              <p className="text-xs text-n8n-gray text-center py-3">
                No saved workflows yet.<br />
                Click <Plus size={10} className="inline" /> to create one.
              </p>
            ) : (
              savedWorkflows.map(wf => <WorkflowRow key={wf.id} wf={wf} />)
            )}
          </div>
        </div>

        {/* Export History */}
        {history.length > 0 && (
          <div className="border-t border-n8n-dark-4">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <History size={14} className="text-n8n-gray-light" />
                <span className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider">
                  Exports
                </span>
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-n8n-gray hover:text-n8n-red transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="px-3 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
              {history.map(item => (
                <div
                  key={item.id}
                  className="text-xs bg-n8n-dark-4 rounded-lg px-3 py-2 text-n8n-gray-light truncate"
                  title={item.workflowName}
                >
                  <div className="truncate font-medium">{item.workflowName}</div>
                  <div className="text-n8n-gray">
                    {item.rowCount} rows · {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: credits + settings */}
      <div className="border-t border-n8n-dark-4 px-3 py-2.5 flex items-center justify-between">
        <CreditBalance onBuyCredits={() => onBuyCredits()} />
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
    </>
  )
}
