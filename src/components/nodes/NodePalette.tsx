import { useCallback, type DragEvent } from 'react'
import type { NodeType } from '../../store/workflowStore'

interface PaletteItem {
  type: NodeType
  label: string
  icon: string
  color: string
  description: string
  step: number
}

interface PaletteSection {
  title: string
  items: PaletteItem[]
}

const paletteSections: PaletteSection[] = [
  {
    title: '1 · Input',
    items: [
      { type: 'input', label: 'Input', icon: '📥', color: '#4CAF50', description: 'Text, JSON, CSV, or media files', step: 1 },
    ],
  },
  {
    title: '2 · Structure & Enrich',
    items: [
      { type: 'format', label: 'Format', icon: '🔧', color: '#2196F3', description: 'Structure raw text into items', step: 2 },
      { type: 'ai', label: 'AI Transform', icon: '🤖', color: '#E91E63', description: 'AI analyzes & enriches content', step: 3 },
    ],
  },
  {
    title: '3 · Organize',
    items: [
      { type: 'tag', label: 'Tag & Categorize', icon: '🏷️', color: '#FF9800', description: 'Add tags based on content', step: 4 },
      { type: 'group', label: 'Group', icon: '📂', color: '#9C27B0', description: 'Group items by field', step: 5 },
    ],
  },
  {
    title: '4 · Expand',
    items: [
      { type: 'translate', label: 'Translate', icon: '🌐', color: '#00BCD4', description: 'Translate to target languages', step: 6 },
    ],
  },
  {
    title: '5 · Output',
    items: [
      { type: 'output', label: 'Output', icon: '📤', color: '#F44336', description: 'Export as JSONL / JSON / CSV', step: 7 },
    ],
  },
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
      {paletteSections.map((section) => (
        <div key={section.title}>
          <div className="text-[10px] text-n8n-gray font-semibold uppercase tracking-widest px-2 mt-3 mb-1.5 first:mt-0">
            {section.title}
          </div>
          {section.items.map(item => (
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
      ))}
    </div>
  )
}
