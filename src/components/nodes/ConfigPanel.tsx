import { useCallback, useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useWorkflowStore, type NodeType, type NodeConfig } from '../../store/workflowStore'
import type {
  InputNodeConfig, FormatNodeConfig, TagNodeConfig, GroupNodeConfig,
  TranslateNodeConfig, OutputNodeConfig, AITransformNodeConfig,
} from '../../store/workflowStore'
import { useAuthStore } from '../../store/authStore'
import { X, Trash2, Upload, AlertCircle, FileText, CheckCircle2, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { getNodeColor } from '../../store/workflowStore'
import { uploadMedia } from '../../utils/mediaUpload'
import { isSupportedMime, type MediaAsset } from '../../types/media'

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

/** Common languages for translation UI. Code → Name. */
const LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  el: 'Greek',
  tr: 'Turkish',
  cs: 'Czech',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
}

export function ConfigPanel() {
  const nodes = useWorkflowStore(s => s.nodes)
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId)
  const selectNode = useWorkflowStore(s => s.selectNode)
  const updateNodeConfig = useWorkflowStore(s => s.updateNodeConfig)
  const removeSelectedNode = useWorkflowStore(s => s.removeSelectedNode)
  const setMediaForNode = useWorkflowStore(s => s.setMediaForNode)
  const sessionId = useWorkflowStore(s => s.sessionId)
  const userId = useAuthStore(s => s.user?.id ?? null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback((field: string, value: unknown) => {
    if (selectedNodeId) updateNodeConfig(selectedNodeId, { [field]: value })
  }, [selectedNodeId, updateNodeConfig])

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  if (!selectedNode || !selectedNodeId) return null

  const nodeType = selectedNode.data.nodeType as NodeType
  const config = selectedNode.data.config as NodeConfig
  const color = getNodeColor(nodeType)
  const icon = nodeIcons[nodeType] || '⬜'
  const label = nodeLabels[nodeType] || 'Config'

  async function handleFileUpload(file: File): Promise<void> {
    if (!userId) {
      setUploadError('You must be signed in to upload files')
      return
    }
    if (!isSupportedMime(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}`)
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const mediaAsset = await uploadMedia(file, userId, sessionId)
      setMediaForNode(selectedNodeId!, mediaAsset)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const inputConfig = nodeType === 'input' ? (config as InputNodeConfig) : null
  const currentMedia = inputConfig?.media ?? null

  return (
    <div data-tour="config-panel" className="panel w-80 flex-shrink-0 flex flex-col max-h-full overflow-hidden">
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

        {/* ── Input Node (text + media + AI processing combined) ── */}
        {nodeType === 'input' && inputConfig && (
          <InputSection
            config={inputConfig}
            media={currentMedia}
            uploading={uploading}
            uploadError={uploadError}
            fileInputRef={fileInputRef}
            onFileInputChange={onFileInputChange}
            onDrop={onDrop}
            onClearError={() => setUploadError(null)}
            update={update}
          />
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
              <label className="label">Target Languages</label>
              <input
                className="input-field mb-3"
                value={(config as TranslateNodeConfig).targetLanguages || ''}
                onChange={e => update('targetLanguages', e.target.value)}
                placeholder="Selected languages will appear here (es, fr, de, ja...)"
                readOnly
              />
              <p className="text-xs text-n8n-gray mb-2">Tap languages to add them:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LANGUAGES).map(([code, name]) => {
                  const selected = ((config as TranslateNodeConfig).targetLanguages || '').includes(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        const current = (config as TranslateNodeConfig).targetLanguages || ''
                        const codes = current ? current.split(',').map(s => s.trim()) : []
                        if (selected) {
                          update('targetLanguages', codes.filter(c => c !== code).join(', '))
                        } else {
                          update('targetLanguages', [...codes, code].join(', '))
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selected
                          ? 'bg-n8n-orange text-white'
                          : 'bg-n8n-dark-4 text-n8n-gray-light hover:bg-n8n-dark-5 hover:text-white'
                      }`}
                    >
                      {name}
                      {selected && <Check size={12} className="inline ml-1" />}
                    </button>
                  )
                })}
              </div>
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
          <div>
            <label className="label">Custom Prompt</label>
            <textarea
              className="textarea-field"
              value={(config as AITransformNodeConfig).prompt || ''}
              onChange={e => update('prompt', e.target.value)}
              placeholder="Leave empty for default analysis prompt..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Combined Input section: text + media upload + AI processing ── */

interface InputSectionProps {
  config: InputNodeConfig
  media: MediaAsset | null
  uploading: boolean
  uploadError: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onClearError: () => void
  update: (field: string, value: unknown) => void
}

function InputSection({
  config, media, uploading, uploadError, fileInputRef, onFileInputChange, onDrop, onClearError, update,
}: InputSectionProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <>
      {/* ── Text Input ── */}
      <div>
        <label className="label">Content Type</label>
        <select
          className="select-field"
          value={config.contentType || 'text'}
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
          className="textarea-field min-h-[120px] font-mono text-xs"
          value={config.content || ''}
          onChange={e => update('content', e.target.value)}
          placeholder="Paste text content here (optional if uploading media)..."
        />
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-n8n-dark-5 pt-4">
        <div className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider mb-3">
          Media Upload
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,audio/wav,audio/mpeg,audio/aac,audio/ogg,audio/flac,audio/mp4,audio/x-m4a,audio/aiff,audio/x-aiff,video/mp4,video/mpeg,video/quicktime,video/webm,application/pdf"
          onChange={onFileInputChange}
          className="hidden"
        />

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-3">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1">{uploadError}</span>
            <button onClick={onClearError} className="text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* No media uploaded yet */}
        {!media && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`
              cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors
              ${dragOver ? 'border-n8n-orange bg-n8n-orange/5' : 'border-n8n-dark-5 hover:border-n8n-purple-light'}
            `}
          >
            <Upload size={24} className="mx-auto mb-2 text-n8n-gray-light" />
            <p className="text-sm text-n8n-gray-light font-medium">
              {uploading ? 'Uploading...' : 'Click or drop file'}
            </p>
            <p className="text-xs text-n8n-gray mt-1">
              Image · Audio · Video · PDF · Max 50MB
            </p>
          </div>
        )}

        {/* Media uploaded — preview */}
        {media && media.status === 'uploaded' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-400 truncate flex-1">{media.filename}</span>
            </div>

            {/* Image preview */}
            {media.type === 'image' && media.signedUrl && (
              <img src={media.signedUrl} alt={media.filename} className="w-full rounded-lg border border-n8n-dark-5 max-h-40 object-cover" />
            )}
            {/* Audio preview */}
            {media.type === 'audio' && media.signedUrl && (
              <audio controls className="w-full h-9" src={media.signedUrl} />
            )}
            {/* Video preview */}
            {media.type === 'video' && media.signedUrl && (
              <video controls className="w-full rounded-lg max-h-40" src={media.signedUrl} />
            )}
            {/* Document */}
            {media.type === 'document' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-n8n-dark-4">
                <FileText size={20} className="text-n8n-gray-light" />
                <span className="text-xs text-n8n-gray-light">PDF Document</span>
              </div>
            )}

            <div className="text-xs text-n8n-gray">
              {media.type} · {media.mimeType} · {(media.size / 1024 / 1024).toFixed(2)} MB
            </div>

            <button
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-1.5 rounded-lg bg-n8n-dark-4 hover:bg-n8n-dark-5 text-xs text-n8n-gray-light transition-colors disabled:opacity-50"
            >
              Replace file
            </button>
            <p className="text-xs text-n8n-gray text-center">
              Ephemeral — deleted when session ends.
            </p>
          </div>
        )}

        {/* Needs re-upload */}
        {media && media.status === 'needsUpload' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-n8n-orange/10 border border-n8n-orange/30">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-n8n-orange" />
              <div className="flex-1">
                <p className="text-xs text-n8n-orange font-medium">Re-upload required</p>
                <p className="text-xs text-n8n-gray-light mt-0.5">
                  Previous: <span className="font-mono">{media.filename}</span> ({media.mimeType})
                </p>
              </div>
            </div>
            <button
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2 rounded-lg bg-n8n-orange hover:bg-n8n-orange-light text-sm text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Re-upload'}
            </button>
          </div>
        )}

        {/* ── AI Processing Options (shown when media is available) ── */}
        {media && (media.status === 'uploaded' || media.status === 'needsUpload') && (
          <div className="mt-4 pt-4 border-t border-n8n-dark-5 space-y-2">
            <div className="text-xs text-n8n-gray-light font-semibold uppercase tracking-wider mb-2">
              AI Processing
            </div>
            <p className="text-xs text-n8n-gray mb-3">
              Enable processing to run on the media when the workflow executes.
            </p>

            {/* OCR — images only */}
            {media.type === 'image' && (
              <ProcessingToggle
                icon="🔍"
                label="OCR — Extract Text"
                enabled={config.enableOCR ?? false}
                enableField="enableOCR"
                prompt={config.ocrPrompt}
                model={config.ocrModel}
                promptField="ocrPrompt"
                modelField="ocrModel"
                promptPlaceholder="Leave empty for default OCR prompt..."
                update={update}
              />
            )}

            {/* Transcribe — audio only */}
            {media.type === 'audio' && (
              <ProcessingToggle
                icon="🎙️"
                label="Transcribe — Audio → Text"
                enabled={config.enableTranscribe ?? false}
                enableField="enableTranscribe"
                prompt={config.transcribePrompt}
                model={config.transcribeModel}
                promptField="transcribePrompt"
                modelField="transcribeModel"
                promptPlaceholder="Leave empty for default transcription prompt..."
                update={update}
              />
            )}

            {/* Caption — images only */}
            {media.type === 'image' && (
              <ProcessingToggle
                icon="💬"
                label="Caption — Image Description"
                enabled={config.enableCaption ?? false}
                enableField="enableCaption"
                prompt={config.captionPrompt}
                model={config.captionModel}
                promptField="captionPrompt"
                modelField="captionModel"
                promptPlaceholder="Leave empty for default caption prompt..."
                update={update}
              />
            )}

            {/* Vision AI — any media type */}
            <ProcessingToggle
              icon="👁️"
              label="Vision AI — Structured Analysis"
              enabled={config.enableVisionAI ?? false}
              enableField="enableVisionAI"
              prompt={config.visionAIPrompt}
              model={config.visionAIModel}
              promptField="visionAIPrompt"
              modelField="visionAIModel"
              promptPlaceholder="Leave empty for default analysis prompt..."
              update={update}
            />
          </div>
        )}
      </div>
    </>
  )
}

/* ── Collapsible processing toggle with prompt + model ── */

interface ProcessingToggleProps {
  icon: string
  label: string
  enabled: boolean
  enableField: string
  prompt: string | undefined
  model: string | undefined
  promptField: string
  modelField: string
  promptPlaceholder: string
  update: (field: string, value: unknown) => void
}

function ProcessingToggle({
  icon, label, enabled, enableField, prompt, model, promptField, modelField, promptPlaceholder, update,
}: ProcessingToggleProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-n8n-dark-5 overflow-hidden">
      <label className="flex items-center gap-2 p-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => {
            update(enableField, e.target.checked)
            if (e.target.checked) setExpanded(true)
          }}
          className="accent-n8n-orange flex-shrink-0"
        />
        <span className="text-sm flex-shrink-0">{icon}</span>
        <span className="text-sm text-n8n-gray-light flex-1 truncate">{label}</span>
        {enabled && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded) }}
            className="text-n8n-gray hover:text-white transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </label>

      {/* Prompt + model fields (shown when enabled and expanded) */}
      {enabled && expanded && (
        <div className="p-2.5 pt-0 space-y-2">
          <textarea
            className="textarea-field text-xs min-h-[60px]"
            value={prompt || ''}
            onChange={e => update(promptField, e.target.value)}
            placeholder={promptPlaceholder}
          />
          <input
            className="input-field font-mono text-xs"
            value={model || ''}
            onChange={e => update(modelField, e.target.value)}
            placeholder="model id..."
          />
        </div>
      )}
    </div>
  )
}
