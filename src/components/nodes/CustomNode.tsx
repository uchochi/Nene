import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { getNodeColor } from '../../store/workflowStore'
import type { NodeType } from '../../store/workflowStore'

const nodeIcons: Record<string, string> = {
  input: '📥',
  format: '🔧',
  tag: '🏷️',
  group: '📂',
  translate: '🌐',
  output: '📤',
  ai: '🤖',
}

function CustomNode({ data, selected }: NodeProps) {
  const nodeType = data.nodeType as NodeType
  const color = getNodeColor(nodeType)
  const icon = nodeIcons[nodeType] || '⬜'
  const label = data.config?.label || nodeType

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[180px] shadow-lg
        bg-n8n-dark-3 transition-all duration-150
        ${selected ? 'border-n8n-orange shadow-orange-500/20' : 'border-transparent'}
      `}
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-n8n-orange" />

      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{label}</div>
          <div className="text-xs text-n8n-gray-light capitalize mt-0.5">{nodeType}</div>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-n8n-orange" />
    </div>
  )
}

export default memo(CustomNode)
