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
  'media-input': '🖼️',
  ocr: '🔍',
  transcribe: '🎙️',
  caption: '💬',
  'vision-ai': '👁️',
}

function CustomNode({ data, selected }: NodeProps) {
  const nodeType = data.nodeType as NodeType
  const color = getNodeColor(nodeType)
  const icon = nodeIcons[nodeType] || '⬜'
  const label = data.config?.label || nodeType

  // Media badge: shows upload status on Media Input nodes
  const hasMedia = nodeType === 'media-input'
  const mediaStatus = hasMedia ? data.config?.media?.status : null
  const mediaFilename = hasMedia ? data.config?.media?.filename : null

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

      {/* Media status badge for Media Input nodes */}
      {hasMedia && (
        <div className="mt-2 pt-2 border-t border-n8n-dark-5 text-xs">
          {mediaStatus === 'uploaded' && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="truncate">{mediaFilename || 'File ready'}</span>
            </span>
          )}
          {mediaStatus === 'needsUpload' && (
            <span className="flex items-center gap-1 text-n8n-orange">
              <span className="w-1.5 h-1.5 rounded-full bg-n8n-orange" />
              <span className="truncate">Re-upload: {mediaFilename || 'needed'}</span>
            </span>
          )}
          {!mediaStatus && (
            <span className="flex items-center gap-1 text-n8n-gray">
              <span className="w-1.5 h-1.5 rounded-full bg-n8n-gray" />
              <span>No file uploaded</span>
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-n8n-orange" />
    </div>
  )
}

export default memo(CustomNode)
