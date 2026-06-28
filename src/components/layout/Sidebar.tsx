import { NodePalette } from '../nodes/NodePalette'
import { useWorkflowStore, type NodeType } from '../../store/workflowStore'
import { FlaskConical, History, Settings, X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const addNode = useWorkflowStore(s => s.addNode)
  const apiKey = useWorkflowStore(s => s.apiKey)
  const setApiKey = useWorkflowStore(s => s.setApiKey)
  const aiModel = useWorkflowStore(s => s.aiModel)
  const setAiModel = useWorkflowStore(s => s.setAiModel)
  const history = useWorkflowStore(s => s.history)
  const clearHistory = useWorkflowStore(s => s.clearHistory)

  const handleAddNode = (type: NodeType) => {
    const center = { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 }
    addNode(type, center)
  }

  if (!isOpen) return null

  return (
    <div className="w-64 bg-n8n-dark-2 border-r border-n8n-dark-4 flex flex-col h-full overflow-hidden flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-n8n-dark-4">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-n8n-red" />
          <span className="font-bold text-sm">n8n Dataset</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NodePalette onAddNode={handleAddNode} />

        <div className="border-t border-n8n-dark-4 mt-2">
          <div className="flex items-center gap-2 px-4 py-2">
            <Settings size={14} className="text-n8n-gray-light" />
            <span className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider">
              Settings
            </span>
          </div>
          <div className="px-3 pb-3 space-y-3">
            <div>
              <label className="label text-[10px]">AI API Key</label>
              <input
                className="input-field text-xs"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="label text-[10px]">AI Model</label>
              <select
                className="select-field text-xs"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="border-t border-n8n-dark-4">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <History size={14} className="text-n8n-gray-light" />
                <span className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider">
                  History
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
    </div>
  )
}
