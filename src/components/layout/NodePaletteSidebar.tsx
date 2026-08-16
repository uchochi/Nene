import { X } from 'lucide-react'
import { NodePalette } from '../nodes/NodePalette'
import { useWorkflowStore, type NodeType } from '../../store/workflowStore'

interface NodePaletteSidebarProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Project-scoped sidebar: shows ONLY the node palette (the nodes needed to
 * create and manage a workflow). Replaces the global sidebar inside the editor.
 */
export function NodePaletteSidebar({ isOpen, onClose }: NodePaletteSidebarProps) {
  const addNode = useWorkflowStore(s => s.addNode)

  const handleAddNode = (type: NodeType) => {
    const center = { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 }
    addNode(type, center)
  }

  return (
    <>
      {/* mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-10 lg:hidden" onClick={onClose} />
      )}

      <aside
        data-tour="node-palette"
        className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-n8n-dark-2 border-r border-n8n-dark-4
          flex flex-col h-full overflow-hidden flex-shrink-0 transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* header */}
        <div className="px-4 py-3 border-b border-n8n-dark-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ooguy" className="h-6 w-auto flex-shrink-0" />
            <span className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider">
              Nodes
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* node palette */}
        <div className="flex-1 overflow-y-auto">
          <NodePalette onAddNode={handleAddNode} />
        </div>
      </aside>
    </>
  )
}
