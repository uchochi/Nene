import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { encodeDownloadData } from '../utils/downloadLink'
import type { MediaAsset } from '../types/media'
import { deleteSessionMedia } from '../utils/mediaUpload'
import {
  generateDatasetSignature,
  computeStats,
  signEntry,
  buildJSONLHeader,
  buildJSONLFooter,
  buildJSONLSeparator,
  buildCSVHeaderLine,
  buildCSVFooterLine,
  buildJSONWrapper,
} from '../utils/datasetSignature'

export type NodeType = 'input' | 'format' | 'tag' | 'group' | 'translate' | 'output' | 'ai'

export interface NodeConfig {
  label: string
  [key: string]: unknown
}

export interface InputNodeConfig extends NodeConfig {
  contentType: 'text' | 'json' | 'csv'
  content: string
  label: string

  /* ── Multimodal fields (merged from the 5 former nodes) ── */
  /** Uploaded media asset, or null for text-only input */
  media: MediaAsset | null
  /** OCR: extract text from images */
  enableOCR: boolean
  ocrPrompt: string
  ocrModel: string
  /** Transcribe: audio → text */
  enableTranscribe: boolean
  transcribePrompt: string
  transcribeModel: string
  /** Caption: AI image description */
  enableCaption: boolean
  captionPrompt: string
  captionModel: string
  /** Vision AI: structured multimodal analysis */
  enableVisionAI: boolean
  visionAIPrompt: string
  visionAIModel: string
}
export interface FormatNodeConfig extends NodeConfig {
  formatType: 'jsonl' | 'json'
  includeMetadata: boolean
  label: string
}
export interface TagNodeConfig extends NodeConfig {
  categories: string
  autoTag: boolean
  label: string
}
export interface GroupNodeConfig extends NodeConfig {
  groupBy: 'language' | 'category' | 'region' | 'mechanic'
  label: string
}
export interface TranslateNodeConfig extends NodeConfig {
  targetLanguages: string
  preserveMechanics: boolean
  label: string
}
export interface OutputNodeConfig extends NodeConfig {
  format: 'jsonl' | 'json' | 'csv'
  label: string
}
export interface AITransformNodeConfig extends NodeConfig {
  prompt: string
  label: string
}

export interface HistoryItem {
  id: string
  timestamp: number
  workflowName: string
  rowCount: number
  outputPreview: string
}

export interface SavedWorkflow {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  workflowName: string
  isRunning: boolean
  onboardingShown: boolean
  datasetResult: string | null
  /** Tokens consumed by the most recent workflow run */
  lastRunTokens: number
  history: HistoryItem[]
  showOnboarding: boolean

  /* multi-workflow */
  savedWorkflows: SavedWorkflow[]
  activeWorkflowId: string | null
  isDirty: boolean

  /* supabase sync */
  initialized: boolean
  userId: string | null
  initialize: (userId: string) => Promise<void>

  /* ephemeral media session */
  sessionId: string
  setMediaForNode: (nodeId: string, media: MediaAsset | null) => void
  clearSessionMedia: () => Promise<void>

  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  removeSelectedNode: () => void
  selectNode: (id: string | null) => void
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void
  setWorkflowName: (name: string) => void
  setRunning: (running: boolean) => void
  setOnboardingShown: (shown: boolean) => void
  setDatasetResult: (result: string | null) => void
  runWorkflow: () => Promise<boolean>

  /* multi-workflow actions */
  saveWorkflow: () => Promise<void>
  loadWorkflow: (id: string) => void
  deleteWorkflow: (id: string) => Promise<void>
  renameWorkflow: (id: string, name: string) => Promise<void>
  duplicateWorkflow: (id: string) => Promise<void>
  exportWorkflow: (id: string) => void
  importWorkflow: (data: string) => Promise<boolean>
  newWorkflow: () => void
  clearWorkflow: () => void
  markClean: () => void

  addToHistory: (item: HistoryItem) => Promise<void>
  clearHistory: () => Promise<void>
  setShowOnboarding: (show: boolean) => void
}

function getDefaultModelSafe(envVar: string, fallback: string): string {
  return import.meta.env[envVar] ?? fallback
}

const defaultNodeConfig: Record<NodeType, NodeConfig> = {
  input: {
    label: 'Input',
    contentType: 'text',
    content: '',
    media: null,
    enableOCR: false,
    ocrPrompt: '',
    ocrModel: getDefaultModelSafe('VITE_OCR_MODEL', 'nvidia/nemotron-nano-12b-v2-vl:free'),
    enableTranscribe: false,
    transcribePrompt: '',
    transcribeModel: getDefaultModelSafe('VITE_TRANSCRIBE_MODEL', 'google/gemini-2.5-flash-preview'),
    enableCaption: false,
    captionPrompt: '',
    captionModel: getDefaultModelSafe('VITE_CAPTION_MODEL', 'nvidia/nemotron-nano-12b-v2-vl:free'),
    enableVisionAI: false,
    visionAIPrompt: '',
    visionAIModel: getDefaultModelSafe('VITE_VISION_MODEL', 'nvidia/nemotron-nano-12b-v2-vl:free'),
  },
  format: { label: 'Format', formatType: 'jsonl', includeMetadata: true },
  tag: { label: 'Tag & Categorize', categories: '', autoTag: true },
  group: { label: 'Group', groupBy: 'language' },
  translate: { label: 'Translate', targetLanguages: '', preserveMechanics: true },
  output: { label: 'Output', format: 'jsonl' },
  ai: { label: 'AI Transform', prompt: '' },
}

const nodeColors: Record<NodeType, string> = {
  input: '#4CAF50',
  format: '#2196F3',
  tag: '#FF9800',
  group: '#9C27B0',
  translate: '#00BCD4',
  output: '#F44336',
  ai: '#E91E63',
}

export function getNodeColor(type: NodeType): string {
  return nodeColors[type] || '#7a7a7a'
}

export function getDefaultConfig(type: NodeType): NodeConfig {
  return { ...defaultNodeConfig[type] }
}

function getDefaultModel(): string {
  return import.meta.env.VITE_AI_MODEL ?? 'nvidia/nemotron-3-nano-30b-a3b:free'
}

function getAIProvider(): string {
  return import.meta.env.VITE_AI_PROVIDER ?? 'openrouter'
}

/* ── Token tracking for billing ── */

/**
 * Module-level accumulator for tokens consumed during a single workflow run.
 * Reset at the start of runWorkflow() and read at the end. Each AI call
 * (ai-completion, transcribe) adds its usage.total_tokens here.
 */
let runTokenAccumulator = 0

/**
 * Wraps an AI fetch call, parses the JSON response, and accumulates the
 * reported token usage. Returns the parsed JSON so callers can read both
 * `content` and `tokensUsed`.
 */
async function fetchAI(
  url: string,
  body: Record<string, unknown>,
): Promise<{ content?: string; error?: string; tokensUsed?: number }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json()
  const tokens = typeof result.tokensUsed === 'number' ? result.tokensUsed : 0
  runTokenAccumulator += tokens
  return result
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave(get: () => WorkflowState): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    const state = get()
    if (state.isDirty && state.activeWorkflowId) {
      state.saveWorkflow()
    }
  }, 3000)
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: 'Untitled Workflow',
  isRunning: false,
  onboardingShown: !!localStorage.getItem('ooguy-onboarding-seen'),
  datasetResult: null,
  lastRunTokens: 0,
  history: [],
  showOnboarding: !localStorage.getItem('ooguy-onboarding-seen'),
  savedWorkflows: [],
  activeWorkflowId: null,
  isDirty: false,
  initialized: false,
  userId: null,
  sessionId: uuidv4(),

  /* ── Ephemeral media session ── */

  setMediaForNode: (nodeId, media) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, media } } }
          : n
      ),
      isDirty: true,
    })
  },

  clearSessionMedia: async () => {
    const { userId, sessionId } = get()
    if (!userId) return
    try {
      await deleteSessionMedia(userId, sessionId)
    } catch (err) {
      console.error('Failed to clear session media:', err)
    }
  },

  initialize: async (userId: string) => {
    set({ userId })

    if (!supabase) return
    const [workflowsRes, historyRes] = await Promise.all([
      supabase.from('workflows').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('history_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    ])

    const savedWorkflows: SavedWorkflow[] = (workflowsRes.data || []).map((w: Record<string, unknown>) => ({
      id: w.id as string,
      name: w.name as string,
      nodes: (w.nodes as Node[]) || [],
      edges: (w.edges as Edge[]) || [],
      createdAt: new Date(w.created_at as string).getTime(),
      updatedAt: new Date(w.updated_at as string).getTime(),
    }))

    const history: HistoryItem[] = (historyRes.data || []).map((h: Record<string, unknown>) => ({
      id: h.id as string,
      timestamp: new Date(h.created_at as string).getTime(),
      workflowName: h.workflow_name as string,
      rowCount: (h.row_count as number) || 0,
      outputPreview: (h.output_preview as string) || '',
    }))

    set({ savedWorkflows, history, initialized: true })
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes), isDirty: true })
    scheduleAutoSave(get)
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges), isDirty: true })
    scheduleAutoSave(get)
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges), isDirty: true })
    scheduleAutoSave(get)
  },
  addNode: (type, position) => {
    const id = uuidv4()
    const config = getDefaultConfig(type)
    const newNode: Node = {
      id,
      type: 'customNode',
      position,
      data: { nodeType: type, config, color: getNodeColor(type) },
    }
    set({ nodes: [...get().nodes, newNode], isDirty: true })
    scheduleAutoSave(get)
  },
  removeSelectedNode: () => {
    const { selectedNodeId, nodes, edges } = get()
    if (!selectedNodeId) return
    set({
      nodes: nodes.filter(n => n.id !== selectedNodeId),
      edges: edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId),
      selectedNodeId: null,
      isDirty: true,
    })
    scheduleAutoSave(get)
  },
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNodeConfig: (id, config) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      ),
      isDirty: true,
    })
    scheduleAutoSave(get)
  },
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  setRunning: (running) => set({ isRunning: running }),
  setOnboardingShown: (shown) => {
    localStorage.setItem('ooguy-onboarding-seen', shown ? 'true' : '')
    set({ onboardingShown: shown })
  },
  setShowOnboarding: (show) => {
    if (!show) localStorage.setItem('ooguy-onboarding-seen', 'true')
    set({ showOnboarding: show })
  },
  setDatasetResult: (result) => set({ datasetResult: result }),
  markClean: () => set({ isDirty: false }),

  /* ── Multi-workflow CRUD ── */

  saveWorkflow: async () => {
    const { nodes, edges, workflowName, activeWorkflowId, savedWorkflows, userId } = get()
    if (!userId || !supabase) return

    // Strip ephemeral media data before persisting — only metadata survives.
    // signedUrl is removed and status becomes 'needsUpload' so that when the
    // workflow is reloaded, Media Input nodes show a re-upload prompt.
    const nodesToSave = stripEphemeralMedia(nodes)

    if (activeWorkflowId) {
      const now = new Date().toISOString()
      await supabase.from('workflows').update({
        name: workflowName,
        nodes: JSON.parse(JSON.stringify(nodesToSave)),
        edges: JSON.parse(JSON.stringify(edges)),
        updated_at: now,
      }).eq('id', activeWorkflowId).eq('user_id', userId)

      set({
        savedWorkflows: savedWorkflows.map(w =>
          w.id === activeWorkflowId
            ? { ...w, name: workflowName, nodes, edges, updatedAt: Date.now() }
            : w
        ),
        isDirty: false,
      })
    } else {
      const id = uuidv4()
      const now = new Date().toISOString()

      await supabase.from('workflows').insert({
        id,
        user_id: userId,
        name: workflowName,
        nodes: JSON.parse(JSON.stringify(nodesToSave)),
        edges: JSON.parse(JSON.stringify(edges)),
        created_at: now,
        updated_at: now,
      })

      set({
        activeWorkflowId: id,
        savedWorkflows: [
          ...savedWorkflows,
          { id, name: workflowName, nodes, edges, createdAt: Date.now(), updatedAt: Date.now() },
        ],
        isDirty: false,
      })
    }
  },

  loadWorkflow: (id) => {
    const wf = get().savedWorkflows.find(w => w.id === id)
    if (!wf) return
    set({
      nodes: wf.nodes,
      edges: wf.edges,
      workflowName: wf.name,
      activeWorkflowId: wf.id,
      selectedNodeId: null,
      datasetResult: null,
      isDirty: false,
      // New session for the loaded workflow — old media files are gone
      sessionId: uuidv4(),
    })
  },

  deleteWorkflow: async (id) => {
    const { savedWorkflows, activeWorkflowId, userId } = get()
    if (!userId || !supabase) return

    await supabase.from('workflows').delete().eq('id', id).eq('user_id', userId)

    const remaining = savedWorkflows.filter(w => w.id !== id)
    const wasActive = activeWorkflowId === id
    set({
      savedWorkflows: remaining,
      activeWorkflowId: wasActive ? null : activeWorkflowId,
      ...(wasActive ? { nodes: [], edges: [], workflowName: 'Untitled Workflow', selectedNodeId: null, datasetResult: null } : {}),
    })
  },

  renameWorkflow: async (id, name) => {
    const { userId } = get()
    if (!userId || !supabase) return

    await supabase.from('workflows').update({ name, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)

    set({
      savedWorkflows: get().savedWorkflows.map(w =>
        w.id === id ? { ...w, name, updatedAt: Date.now() } : w
      ),
      ...(get().activeWorkflowId === id ? { workflowName: name } : {}),
    })
  },

  duplicateWorkflow: async (id) => {
    const { userId } = get()
    if (!userId || !supabase) return

    const source = get().savedWorkflows.find(w => w.id === id)
    if (!source) return

    const newId = uuidv4()
    const now = new Date().toISOString()

    await supabase.from('workflows').insert({
      id: newId,
      user_id: userId,
      name: `${source.name} (copy)`,
      nodes: JSON.parse(JSON.stringify(source.nodes)),
      edges: JSON.parse(JSON.stringify(source.edges)),
      created_at: now,
      updated_at: now,
    })

    const newWf: SavedWorkflow = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set({ savedWorkflows: [...get().savedWorkflows, newWf] })
  },

  exportWorkflow: (id) => {
    const wf = get().savedWorkflows.find(w => w.id === id)
    if (!wf) return
    const content = JSON.stringify(wf, null, 2)
    const filename = `${wf.name.replace(/\s+/g, '_').toLowerCase()}.ooguy.json`
    const url = encodeDownloadData(content, filename)
    const telegram = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp)
    if (telegram?.openLink) {
      telegram.openLink(url)
      return
    }
    window.open(url, '_blank')
  },

  importWorkflow: async (data) => {
    const { userId } = get()
    if (!userId || !supabase) return false

    try {
      const parsed = JSON.parse(data) as SavedWorkflow
      if (!parsed.nodes || !parsed.edges) return false

      const newId = uuidv4()
      const now = new Date().toISOString()

      await supabase.from('workflows').insert({
        id: newId,
        user_id: userId,
        name: parsed.name || 'Imported Workflow',
        nodes: JSON.parse(JSON.stringify(parsed.nodes)),
        edges: JSON.parse(JSON.stringify(parsed.edges)),
        created_at: now,
        updated_at: now,
      })

      const newWf: SavedWorkflow = {
        id: newId,
        name: parsed.name || 'Imported Workflow',
        nodes: parsed.nodes,
        edges: parsed.edges,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      set({ savedWorkflows: [...get().savedWorkflows, newWf] })
      return true
    } catch {
      return false
    }
  },

  newWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      workflowName: 'Untitled Workflow',
      activeWorkflowId: null,
      selectedNodeId: null,
      datasetResult: null,
      isDirty: false,
      sessionId: uuidv4(),
    })
  },

  clearWorkflow: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, datasetResult: null, isDirty: true })
  },

  /* ── History ── */

  addToHistory: async (item) => {
    const { userId } = get()
    if (!userId || !supabase) return

    await supabase.from('history_items').insert({
      user_id: userId,
      workflow_name: item.workflowName,
      row_count: item.rowCount,
      output_preview: item.outputPreview,
    })

    set({ history: [item, ...get().history].slice(0, 50) })
  },

  clearHistory: async () => {
    const { userId } = get()
    if (!userId || !supabase) return

    await supabase.from('history_items').delete().eq('user_id', userId)
    set({ history: [] })
  },

  /* ── Pipeline execution ── */

  runWorkflow: async (): Promise<boolean> => {
    const { nodes, edges } = get()
    /* Reset token accumulator at the start of each run */
    runTokenAccumulator = 0
    set({ isRunning: true, datasetResult: null, lastRunTokens: 0 })

    try {
      const sorted = topologicalSort(nodes, edges)
      let data: Record<string, unknown>[] | string = ''

      for (const node of sorted) {
        const cfg = node.data.config as NodeConfig
        switch (node.data.nodeType) {
          case 'input': {
            const inputCfg = cfg as InputNodeConfig

            // If media is attached and uploaded, produce a media pipeline item
            // and run any enabled processing (OCR, transcribe, caption, vision AI)
            if (inputCfg.media && inputCfg.media.status === 'uploaded') {
              let mediaItems = mediaInputToItems(inputCfg.media)

              if (inputCfg.enableOCR && inputCfg.media.type === 'image') {
                mediaItems = await ocrProcess(mediaItems, inputCfg.ocrPrompt, inputCfg.ocrModel)
              }
              if (inputCfg.enableTranscribe && inputCfg.media.type === 'audio') {
                mediaItems = await transcribeProcess(mediaItems, inputCfg.transcribePrompt, inputCfg.transcribeModel)
              }
              if (inputCfg.enableCaption && inputCfg.media.type === 'image') {
                mediaItems = await captionProcess(mediaItems, inputCfg.captionPrompt, inputCfg.captionModel)
              }
              if (inputCfg.enableVisionAI) {
                mediaItems = await visionAIProcess(mediaItems, inputCfg.visionAIPrompt, inputCfg.visionAIModel)
              }

              // If there's also text content, merge it into each media item
              if (inputCfg.content && mediaItems.length > 0) {
                mediaItems = mediaItems.map(item => ({ ...item, raw_content: inputCfg.content }))
              }
              data = mediaItems
            } else if (inputCfg.media && inputCfg.media.status === 'needsUpload') {
              throw new Error(`Media file "${inputCfg.media.filename}" needs to be re-uploaded before running`)
            } else {
              // Text-only path (original behavior)
              data = inputCfg.content
            }
            break
          }
          case 'format': {
            const fmtCfg = cfg as FormatNodeConfig
            if (typeof data === 'string') {
              data = formatData(data, fmtCfg)
            } else if (Array.isArray(data)) {
              data = ensureFormatted(data)
            }
            break
          }
          case 'tag': {
            const tagCfg = cfg as TagNodeConfig
            if (Array.isArray(data)) {
              data = await tagData(data, tagCfg)
            }
            break
          }
          case 'group': {
            const grpCfg = cfg as GroupNodeConfig
            if (Array.isArray(data)) {
              data = groupData(data, grpCfg)
            }
            break
          }
          case 'translate': {
            const trCfg = cfg as TranslateNodeConfig
            if (Array.isArray(data)) {
              data = await translateData(data, trCfg)
            }
            break
          }
          case 'ai': {
            const aiCfg = cfg as AITransformNodeConfig
            if (Array.isArray(data)) {
              data = await aiTransform(data, aiCfg)
            } else if (typeof data === 'string') {
              data = await aiTransformString(data, aiCfg)
            }
            break
          }
          case 'output': {
            const outCfg = cfg as OutputNodeConfig
            if (Array.isArray(data)) {
              const result = outputData(data, outCfg)
              set({ datasetResult: result })
            }
            break
          }
        }
      }
      /* Persist total tokens consumed during this run */
      set({ lastRunTokens: runTokenAccumulator })
      return true
    } catch (err) {
      console.error('Workflow error:', err)
      set({ lastRunTokens: runTokenAccumulator })
      return false
    } finally {
      set({ isRunning: false })
    }
  },
}))

/* ── helpers ── */

function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  nodes.forEach(n => { inDegree.set(n.id, 0); adj.set(n.id, []) })
  edges.forEach(e => {
    adj.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
  })

  const queue: string[] = []
  inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id) })

  const sorted: Node[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) sorted.push(node)
    for (const neighbor of adj.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }
  return sorted
}

function formatData(data: string, cfg: FormatNodeConfig): Record<string, unknown>[] {
  if (cfg.formatType === 'json') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch { return [{ raw: data }] }
  }
  const lines = data.split('\n').filter(l => l.trim())
  return lines.map((line, i) => ({
    id: `item_${String(i + 1).padStart(3, '0')}`,
    raw_content: line.trim(),
    language_code: 'unknown',
    region: 'unknown',
    format: 'text',
    ...(cfg.includeMetadata ? { timestamp: new Date().toISOString(), source: 'user_input' } : {}),
  }))
}

/** Ensures array items (e.g. from media input) have required metadata fields. */
function ensureFormatted(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((item, i) => ({
    id: item.id || `item_${String(i + 1).padStart(3, '0')}`,
    ...item,
    language_code: item.language_code || 'en',
    region: item.region || 'unknown',
    format: item.format || 'structured',
  }))
}

async function tagData(data: Record<string, unknown>[], cfg: TagNodeConfig): Promise<Record<string, unknown>[]> {
  const categories = cfg.categories.split(',').map(c => c.trim()).filter(Boolean)
  const catList = categories.length > 0 ? categories : ['general']

  if (cfg.autoTag) {
    const results: Record<string, unknown>[] = []
    for (const item of data) {
      try {
        const aiTags = await generateTagsWithAI(item)
        results.push({ ...item, tags: aiTags, categories: catList, categorized: true })
      } catch {
        results.push({ ...item, tags: extractTags(item), categories: catList, categorized: true })
      }
    }
    return results
  }

  return data.map(item => ({
    ...item,
    tags: extractTags(item),
    categories: catList,
    categorized: true,
  }))
}

/** AI-powered tag generation. */
async function generateTagsWithAI(item: Record<string, unknown>): Promise<string[]> {
  const content = extractTextContent(item)
  if (!content) return ['general']

  const result = await fetchAI('/api/ai-completion', {
    messages: [
      { role: 'system', content: 'You are a content tagging assistant. Analyze the given content and return ONLY a JSON array of 3-7 relevant tags as lowercase strings. Example: ["humor","wordplay","culture"]' },
      { role: 'user', content: `Tag this content:\n\n${content.slice(0, 2000)}` },
    ],
    model: getDefaultModel(),
    provider: getAIProvider(),
    temperature: 0.3,
  })

  if (result.error) {
    throw new Error(result.error || 'Tag generation failed')
  }

  return parseStringArray(result.content || '')
}

/** Improved keyword-based tag extraction (no AI call). */
function extractTags(item: Record<string, unknown>): string[] {
  const text = extractTextContent(item).toLowerCase()
  if (!text) return ['general']

  const tagDictionary: Record<string, string[]> = {
    humor: ['humor', 'humour', 'joke', 'funny', 'comedy', 'pun', 'punchline', 'laugh', 'hilarious', 'meme', 'gag'],
    education: ['education', 'learn', 'teach', 'tutorial', 'lesson', 'course', 'study', 'knowledge', 'guide', 'explain'],
    technology: ['technology', 'tech', 'software', 'code', 'programming', 'ai', 'machine learning', 'data', 'computer', 'digital', 'app', 'algorithm'],
    culture: ['culture', 'cultural', 'tradition', 'custom', 'society', 'social', 'community', 'heritage', 'folklore'],
    language: ['language', 'linguistic', 'translation', 'bilingual', 'grammar', 'vocabulary', 'slang', 'dialect', 'idiom'],
    wordplay: ['pun', 'wordplay', 'double meaning', 'double entendre', 'homophone', 'homonym', 'ambiguity', 'phonetic'],
    irony: ['irony', 'ironic', 'sarcasm', 'sarcastic', 'paradox', 'satire'],
    emotion: ['emotion', 'emotional', 'feeling', 'mood', 'sentiment', 'happy', 'sad', 'angry', 'fear', 'love'],
    business: ['business', 'marketing', 'sales', 'finance', 'economy', 'money', 'trade', 'corporate'],
    science: ['science', 'scientific', 'biology', 'physics', 'chemistry', 'research', 'experiment', 'hypothesis'],
    entertainment: ['entertainment', 'movie', 'film', 'music', 'game', 'sport', 'celebrity', 'show'],
    food: ['food', 'cooking', 'recipe', 'cuisine', 'restaurant', 'dish', 'meal'],
    travel: ['travel', 'tourism', 'destination', 'vacation', 'adventure', 'journey'],
  }

  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(tagDictionary)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags.length > 0 ? tags : ['general']
}

/** Group: adds a `group` field to each item — does NOT restructure. */
function groupData(data: Record<string, unknown>[], cfg: GroupNodeConfig): Record<string, unknown>[] {
  return data.map(item => ({
    ...item,
    group: String(item[cfg.groupBy] || (item.tags as string[])?.[0] || 'unknown'),
    grouped: true,
  }))
}

/** Translate: actually translates text fields into each target language via AI. */
async function translateData(data: Record<string, unknown>[], cfg: TranslateNodeConfig): Promise<Record<string, unknown>[]> {
  const langs = cfg.targetLanguages.split(',').map(l => l.trim()).filter(Boolean)
  if (langs.length === 0) return data

  const results: Record<string, unknown>[] = []
  for (const item of data) {
    for (const lang of langs) {
      try {
        const translated = await translateItem(item, lang, cfg.preserveMechanics)
        results.push(translated)
      } catch (e) {
        results.push({
          ...item,
          language_code: lang,
          translated: false,
          original_language: item.language_code || 'unknown',
          translation_error: e instanceof Error ? e.message : 'Translation failed',
        })
      }
    }
  }
  return results
}

/** Translates all text fields of an item into a target language using AI. */
async function translateItem(
  item: Record<string, unknown>,
  targetLang: string,
  preserveMechanics: boolean,
): Promise<Record<string, unknown>> {
  const originalLang = String(item.language_code || 'en')

  const textFields = ['raw_content', 'setup', 'punchline', 'literal_english_translation',
                      'cultural_context', 'linguistic_context', 'explanation_for_ai',
                      'extracted_text', 'image_description', 'transcript']
  const textsToTranslate: Record<string, string> = {}
  for (const field of textFields) {
    const val = item[field]
    if (typeof val === 'string' && val.trim()) {
      textsToTranslate[field] = val
    }
  }

  if (Object.keys(textsToTranslate).length === 0) {
    return { ...item, language_code: targetLang, translated: true, original_language: originalLang }
  }

  const preserveNote = preserveMechanics
    ? ' IMPORTANT: If the content uses humor mechanics (puns, wordplay, idioms), ADAPT them to the target language so they work natively — do not translate literally. The result should feel natural and funny to a native speaker.'
    : ''

  const result = await fetchAI('/api/ai-completion', {
    messages: [
      { role: 'system', content: `You are a professional translator. Translate the following JSON content into ${targetLang}. Return ONLY a JSON object with the same keys, values translated.${preserveNote}` },
      { role: 'user', content: JSON.stringify(textsToTranslate, null, 2) },
    ],
    model: getDefaultModel(),
    provider: getAIProvider(),
    temperature: 0.3,
  })

  if (result.error) {
    throw new Error(result.error || 'Translation API error')
  }

  let translatedTexts: Record<string, unknown> = {}
  try {
    translatedTexts = JSON.parse(result.content || '{}')
  } catch {
    translatedTexts = { raw_content: result.content }
  }

  return {
    ...item,
    ...translatedTexts,
    language_code: targetLang,
    translated: true,
    original_language: originalLang,
  }
}

async function aiTransform(data: Record<string, unknown>[], cfg: AITransformNodeConfig): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = []
  const BATCH = 3

  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        const explanation = await callAI(item, cfg)
        return { ...item, explanation_for_ai: explanation, ai_processed: true }
      })
    )
    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j]
      if (r.status === 'fulfilled') {
        results.push(r.value)
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : 'AI error'
        results.push({ ...batch[j], ai_processed: false, error: msg })
      }
    }
  }
  return results
}

async function aiTransformString(data: string, cfg: AITransformNodeConfig): Promise<Record<string, unknown>[]> {
  try {
    const response = await callAI({ raw_content: data }, cfg)
    return [{ raw_content: data, explanation_for_ai: response, ai_processed: true }]
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown AI error'
    console.error('aiTransformString failed:', msg)
    return [{ raw_content: data, ai_processed: false, error: msg }]
  }
}

/** Sends an item's content to AI — strips internal fields first. */
async function callAI(item: Record<string, unknown>, cfg: AITransformNodeConfig): Promise<string> {
  const { media, ai_processed, categorized, grouped, translated, translation_error, ...content } = item
  void media; void ai_processed; void categorized; void grouped; void translated; void translation_error
  const text = JSON.stringify(content, null, 2).slice(0, 3000)
  const userPrompt = cfg.prompt || `Analyze the following content and produce a structured JSON object. Choose field names and analysis depth appropriate to whatever the content actually is — do not assume a specific topic or format. Include at minimum: a "summary" field, a "key_topics" array, a "sentiment" field, and any other fields that are relevant to this specific content.\n\nContent: ${text}`

  const result = await fetchAI('/api/ai-completion', {
    messages: [
      { role: 'system', content: 'You are an intelligent data analysis assistant. Analyze content and produce structured JSON output. Adapt your analysis to the actual content type — do not assume humor, education, or any specific category. Choose output fields that are relevant to what the content actually contains.' },
      { role: 'user', content: userPrompt },
    ],
    model: getDefaultModel(),
    provider: getAIProvider(),
  })

  if (result.error) {
    throw new Error(result.error || 'AI API error')
  }
  return result.content || 'No response'
}

function outputData(data: Record<string, unknown>[], cfg: OutputNodeConfig): string {
  /* Draw one signature per dataset — consistent across the whole file */
  const sig = generateDatasetSignature()
  const stats = computeStats(data)

  switch (cfg.format) {
    case 'json':
      /* Unique dataset envelope: { _dataset_meta: {...}, data: [...] } */
      return JSON.stringify(buildJSONWrapper(data, sig), null, 2)
    case 'csv': {
      if (data.length === 0) return ''
      const keySet = new Set<string>()
      data.forEach(item => Object.keys(item).forEach(k => keySet.add(k)))
      /* `_dataset_sig` is always the first column */
      const headers = ['_dataset_sig', ...Array.from(keySet)]
      const escapeCSV = (val: unknown): string => {
        const str = typeof val === 'object' && val !== null
          ? JSON.stringify(val)
          : String(val ?? '')
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }
      const rows = data.map(item => [sig.id, ...headers.slice(1).map(h => escapeCSV(item[h]))].join(','))
      return [
        buildCSVHeaderLine(sig, stats),
        [headers.join(','), ...rows].join('\n'),
        buildCSVFooterLine(sig, stats),
      ].join('\n')
    }
    case 'jsonl':
    default: {
      /* Unique dataset structure: header block + signed entries + separators + footer */
      const body = data.map(item => JSON.stringify(signEntry(item, sig)))
      return [
        buildJSONLHeader(sig, stats),
        body.join('\n' + buildJSONLSeparator() + '\n'),
        buildJSONLFooter(sig, stats),
      ].join('\n')
    }
  }
}

/* ── Shared helpers ── */

/** Extracts all text content from an item for AI processing or tag matching. */
function extractTextContent(item: Record<string, unknown>): string {
  const skipKeys = new Set(['media', 'signedUrl', 'id', 'timestamp', 'source'])
  return Object.entries(item)
    .filter(([key, val]) => !skipKeys.has(key) && typeof val === 'string')
    .map(([, val]) => val as string)
    .join(' ')
}

/** Parses a JSON string array from an AI response, with fallback. */
function parseStringArray(content: string): string[] {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    const matches = content.match(/"([^"]+)"/g)
    if (matches) return matches.map(m => m.replace(/"/g, ''))
  }
  return ['general']
}

/* ── Multimodal pipeline helpers ── */

/**
 * Strips ephemeral data (signedUrl) from media assets before persisting
 * a workflow to Supabase. The media metadata (filename, type, size) survives
 * so users know what to re-upload; the actual file reference is dropped.
 */
function stripEphemeralMedia(nodes: Node[]): Node[] {
  return nodes.map(n => {
    if (n.data?.nodeType === 'input' && n.data?.config?.media) {
      const media = n.data.config.media as MediaAsset
      return {
        ...n,
        data: {
          ...n.data,
          config: {
            ...n.data.config,
            media: { ...media, signedUrl: undefined, status: 'needsUpload' as const },
          },
        },
      }
    }
    return n
  })
}

/**
 * Converts an uploaded media asset into pipeline items.
 * Each media file becomes a structured object with a `media` field carrying
 * the MediaAsset and metadata fields for the JSONL output schema.
 */
function mediaInputToItems(media: MediaAsset): Record<string, unknown>[] {
  if (!media.signedUrl) return []
  return [{
    id: `media_${media.id.slice(0, 8)}`,
    media_type: media.type,
    media_id: media.id,
    media_filename: media.filename,
    media_mimeType: media.mimeType,
    image_url: media.type === 'image' ? media.signedUrl : undefined,
    audio_ref: media.type === 'audio' ? media.signedUrl : undefined,
    video_ref: media.type === 'video' ? media.signedUrl : undefined,
    doc_ref: media.type === 'document' ? media.signedUrl : undefined,
    media,
    raw_content: '',
    language_code: 'unknown',
    region: 'unknown',
    format: media.type,
  }]
}

/**
 * OCR processing — extracts text from image media via vision AI.
 */
async function ocrProcess(
  data: Record<string, unknown>[],
  customPrompt: string,
  model: string,
): Promise<Record<string, unknown>[]> {
  const provider = getAIProvider()
  const prompt = customPrompt || 'Extract ALL text visible in this image. Output only the extracted text, preserving line breaks. If there is no text, output empty string.'

  const results: Record<string, unknown>[] = []
  for (const item of data) {
    const media = item.media as MediaAsset | undefined
    if (!media || media.type !== 'image' || !media.signedUrl) {
      results.push(item)
      continue
    }
    try {
      const result = await fetchAI('/api/ai-completion', {
        provider,
        model,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: media.signedUrl } },
          ],
        }],
      })
      const extractedText = !result.error
        ? (result.content || '').trim()
        : `[OCR failed: ${result.error}]`
      results.push({ ...item, extracted_text: extractedText, ocr_processed: true, ocr_model: model })
    } catch (e) {
      results.push({ ...item, extracted_text: `[OCR error: ${e instanceof Error ? e.message : 'unknown'}]`, ocr_processed: false, ocr_model: model })
    }
  }
  return results
}

/**
 * Audio transcription — converts audio media to text via multimodal AI.
 * Fetches the audio file, converts to base64, sends to /api/transcribe.
 */
async function transcribeProcess(
  data: Record<string, unknown>[],
  customPrompt: string,
  model: string,
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = []
  for (const item of data) {
    const media = item.media as MediaAsset | undefined
    if (!media || media.type !== 'audio' || !media.signedUrl) {
      results.push(item)
      continue
    }
    try {
      // Fetch audio from signed URL → base64
      const audioResp = await fetch(media.signedUrl)
      const audioBlob = await audioResp.blob()
      const base64 = await blobToBase64(audioBlob)
      const format = media.mimeType.split('/')[1]?.split(';')[0] || 'wav'

      const result = await fetchAI('/api/transcribe', {
        audio: base64,
        format,
        prompt: customPrompt || undefined,
        model,
      })
      const transcript = !result.error
        ? (result.content || '').trim()
        : `[Transcription failed: ${result.error}]`
      results.push({ ...item, transcript, transcribe_processed: true, transcribe_model: model })
    } catch (e) {
      results.push({ ...item, transcript: `[Transcription error: ${e instanceof Error ? e.message : 'unknown'}]`, transcribe_processed: false, transcribe_model: model })
    }
  }
  return results
}

/**
 * Image captioning — generates a natural language description of image media.
 */
async function captionProcess(
  data: Record<string, unknown>[],
  customPrompt: string,
  model: string,
): Promise<Record<string, unknown>[]> {
  const provider = getAIProvider()
  const prompt = customPrompt || 'Describe this image in detail. Include: the main subjects, the setting/context, any text visible in the image, the mood or tone, and notable visual elements. Output a single paragraph description.'

  const results: Record<string, unknown>[] = []
  for (const item of data) {
    const media = item.media as MediaAsset | undefined
    if (!media || media.type !== 'image' || !media.signedUrl) {
      results.push(item)
      continue
    }
    try {
      const result = await fetchAI('/api/ai-completion', {
        provider,
        model,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: media.signedUrl } },
          ],
        }],
      })
      const description = !result.error
        ? (result.content || '').trim()
        : `[Caption failed: ${result.error}]`
      results.push({ ...item, image_description: description, caption_processed: true, caption_model: model })
    } catch (e) {
      results.push({ ...item, image_description: `[Caption error: ${e instanceof Error ? e.message : 'unknown'}]`, caption_processed: false, caption_model: model })
    }
  }
  return results
}

/**
 * Vision AI analysis — combines image + text for structured analysis.
 * Implements the meme/humor vision paradigm from description.md: generates
 * image_description, image_text, humor_mechanics, cultural_context, etc.
 */
async function visionAIProcess(
  data: Record<string, unknown>[],
  customPrompt: string,
  model: string,
): Promise<Record<string, unknown>[]> {
  const provider = getAIProvider()
  const defaultPrompt = `Analyze this image and produce a structured JSON object for LLM training data. Include these fields:
- "image_description": A detailed description of what is visually shown
- "image_text": Any text visible in the image (exact transcription)
- "visual_elements": Key visual components and their arrangement
- "context": The cultural, social, or situational context needed to understand the image
- "explanation_for_ai": Why this image works (or doesn't), what makes it notable, and what an AI should learn from it

Output valid JSON only.`

  const results: Record<string, unknown>[] = []
  for (const item of data) {
    const media = item.media as MediaAsset | undefined
    if (!media || !media.signedUrl) {
      results.push(item)
      continue
    }

    // Build content parts — images use image_url, video uses video_url
    const contentParts: Record<string, unknown>[] = [
      { type: 'text', text: customPrompt || defaultPrompt },
    ]

    if (media.type === 'image') {
      contentParts.push({ type: 'image_url', image_url: { url: media.signedUrl } })
    } else if (media.type === 'video') {
      contentParts.push({ type: 'video_url', video_url: { url: media.signedUrl } })
    } else {
      // For audio/docs, pass the extracted text/transcript if available
      const textContent = (item.extracted_text || item.transcript || '') as string
      if (textContent) {
        contentParts.push({ type: 'text', text: `Associated text content: ${textContent}` })
      }
    }

    try {
      const result = await fetchAI('/api/ai-completion', {
        provider,
        model,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: contentParts,
        }],
      })
      const analysis = !result.error
        ? (result.content || '').trim()
        : `[Vision AI failed: ${result.error}]`
      results.push({ ...item, vision_analysis: analysis, vision_processed: true, vision_model: model })
    } catch (e) {
      results.push({ ...item, vision_analysis: `[Vision AI error: ${e instanceof Error ? e.message : 'unknown'}]`, vision_processed: false, vision_model: model })
    }
  }
  return results
}

/** Converts a Blob to a raw base64 string (no data: prefix). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip "data:audio/wav;base64," prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to convert blob to base64'))
    reader.readAsDataURL(blob)
  })
}
