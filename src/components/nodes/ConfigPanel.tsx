import { useCallback } from 'react'
import { useWorkflowStore, type NodeType, type NodeConfig } from '../../store/workflowStore'
import type { InputNodeConfig, FormatNodeConfig, TagNodeConfig, GroupNodeConfig, TranslateNodeConfig, OutputNodeConfig, AITransformNodeConfig } from '../../store/workflowStore'
import { X, Trash2 } from 'lucide-react'
import { getNodeColor } from '../../store/workflowStore'

const nodeIcons: Record<string, string> = {
  input: '📥',
  format: '🔧',
  tag: '🏷️',
  group: '📂',
  translate: '🌐',
  output: '📤',
  ai: '🤖',
}

const nodeLabels: Record<string, string> = {
  input: 'Input Config',
  format: 'Format Config',
  tag: 'Tag & Categorize Config',
  group: 'Group Config',
  translate: 'Translate Config',
  output: 'Output Config',
  ai: 'AI Transform Config',
}

export function ConfigPanel() {
  const nodes = useWorkflowStore(s => s.nodes)
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId)
  const selectNode = useWorkflowStore(s => s.selectNode)
  const updateNodeConfig = useWorkflowStore(s => s.updateNodeConfig)
  const removeSelectedNode = useWorkflowStore(s => s.removeSelectedNode)

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  if (!selectedNode || !selectedNodeId) return null

  const nodeType = selectedNode.data.nodeType as NodeType
  const config = selectedNode.data.config as NodeConfig
  const color = getNodeColor(nodeType)
  const icon = nodeIcons[nodeType] || '⬜'
  const label = nodeLabels[nodeType] || 'Config'

  const update = useCallback((field: string, value: unknown) => {
    updateNodeConfig(selectedNodeId, { [field]: value })
  }, [selectedNodeId, updateNodeConfig])

  return (
    <div className="panel w-80 flex-shrink-0 flex flex-col max-h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-n8n-dark-4"
        style={{ borderBottomColor: color + '40' }}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={removeSelectedNode}
            className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-n8n-red transition-colors"
            title="Delete node"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="label">Label</label>
          <input
            className="input-field"
            value={config.label || ''}
            onChange={e => update('label', e.target.value)}
          />
        </div>

        {nodeType === 'input' && (
          <>
            <div>
              <label className="label">Content Type</label>
              <select
                className="select-field"
                value={(config as InputNodeConfig).contentType || 'text'}
                onChange={e => update('contentType', e.target.value)}
              >
                <option value="text">Plain Text</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div>
              <label className="label">Content</label>
              <textarea
                className="textarea-field min-h-[200px] font-mono text-xs"
                value={(config as InputNodeConfig).content || ''}
                onChange={e => update('content', e.target.value)}
                placeholder="Paste your content here..."
              />
            </div>
          </>
        )}

        {nodeType === 'format' && (
          <>
            <div>
              <label className="label">Output Format</label>
              <select
                className="select-field"
                value={(config as FormatNodeConfig).formatType || 'jsonl'}
                onChange={e => update('formatType', e.target.value)}
              >
                <option value="jsonl">JSONL</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeMetadata"
                className="accent-n8n-orange"
                checked={(config as FormatNodeConfig).includeMetadata ?? true}
                onChange={e => update('includeMetadata', e.target.checked)}
              />
              <label htmlFor="includeMetadata" className="text-sm text-n8n-gray-light">
                Include Metadata
              </label>
            </div>
          </>
        )}

        {nodeType === 'tag' && (
          <>
            <div>
              <label className="label">Categories (comma-separated)</label>
              <input
                className="input-field"
                value={(config as TagNodeConfig).categories || ''}
                onChange={e => update('categories', e.target.value)}
                placeholder="humor, education, tech"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoTag"
                className="accent-n8n-orange"
                checked={(config as TagNodeConfig).autoTag ?? true}
                onChange={e => update('autoTag', e.target.checked)}
              />
              <label htmlFor="autoTag" className="text-sm text-n8n-gray-light">
                Auto-tag content
              </label>
            </div>
          </>
        )}

        {nodeType === 'group' && (
          <div>
            <label className="label">Group By</label>
            <select
              className="select-field"
              value={(config as GroupNodeConfig).groupBy || 'language'}
              onChange={e => update('groupBy', e.target.value)}
            >
              <option value="language">Language</option>
              <option value="category">Category</option>
              <option value="region">Region</option>
              <option value="mechanic">Humor Mechanic</option>
            </select>
          </div>
        )}

        {nodeType === 'translate' && (
          <>
            <div>
              <label className="label">Target Languages (comma-separated)</label>
              <input
                className="input-field"
                value={(config as TranslateNodeConfig).targetLanguages || ''}
                onChange={e => update('targetLanguages', e.target.value)}
                placeholder="es, fr, ja, de"
              />
              <p className="text-xs text-n8n-gray mt-1">Use ISO language codes (es, fr, ja, de, etc.)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="preserveMechanics"
                className="accent-n8n-orange"
                checked={(config as TranslateNodeConfig).preserveMechanics ?? true}
                onChange={e => update('preserveMechanics', e.target.checked)}
              />
              <label htmlFor="preserveMechanics" className="text-sm text-n8n-gray-light">
                Preserve humor mechanics
              </label>
            </div>
          </>
        )}

        {nodeType === 'output' && (
          <div>
            <label className="label">Export Format</label>
            <select
              className="select-field"
              value={(config as OutputNodeConfig).format || 'jsonl'}
              onChange={e => update('format', e.target.value)}
            >
              <option value="jsonl">JSONL</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        )}

        {nodeType === 'ai' && (
          <>
            <div>
              <label className="label">AI Model</label>
              <select
                className="select-field"
                value={(config as AITransformNodeConfig).model || 'gpt-4o-mini'}
                onChange={e => update('model', e.target.value)}
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="label">Custom Prompt</label>
              <textarea
                className="textarea-field"
                value={(config as AITransformNodeConfig).prompt || ''}
                onChange={e => update('prompt', e.target.value)}
                placeholder="Leave empty for default analysis prompt..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
