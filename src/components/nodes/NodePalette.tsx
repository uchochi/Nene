import { useCallback, type DragEvent } from 'react'
import type { NodeType } from '../../store/workflowStore'

interface PaletteItem {
  type: NodeType
  label: string
  icon: string
  color: string
  description: string
}

const paletteItems: PaletteItem[] = [
  { type: 'input', label: 'Input', icon: '📥', color: '#4CAF50', description: 'Raw text, JSON, or CSV' },
  { type: 'format', label: 'Format', icon: '🔧', color: '#2196F3', description: 'JSONL / JSON structure' },
  { type: 'tag', label: 'Tag & Categorize', icon: '🏷️', color: '#FF9800', description: 'Add tags & categories' },
  { type: 'group', label: 'Group', icon: '📂', color: '#9C27B0', description: 'Group by field' },
  { type: 'translate', label: 'Translate', icon: '🌐', color: '#00BCD4', description: 'Multi-language support' },
  { type: 'ai', label: 'AI Transform', icon: '🤖', color: '#E91E63', description: 'LLM-powered analysis' },
  { type: 'output', label: 'Output', icon: '📤', color: '#F44336', description: 'JSONL / JSON / CSV export' },
]

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const onDragStart = useCallback((event: DragEvent, type: NodeType) => {
    event.dataTransfer.setData('application/reactflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  return (
    <div className="p-3 space-y-1.5">
      <div className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider px-2 mb-3">
        Nodes
      </div>
      {paletteItems.map(item => (
        <button
          key={item.type}
          draggable
          onDragStart={e => onDragStart(e, item.type)}
          onClick={() => onAddNode(item.type)}
          className="node-card w-full text-left"
        >
          <span className="text-lg">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{item.label}</div>
            <div className="text-xs text-n8n-gray truncate">{item.description}</div>
          </div>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
        </button>
      ))}
    </div>
  )
}
