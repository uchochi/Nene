import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow'
import { v4 as uuidv4 } from 'uuid'

export type NodeType = 'input' | 'format' | 'tag' | 'group' | 'translate' | 'output' | 'ai'

export interface NodeConfig {
  label: string
  [key: string]: unknown
}

export interface InputNodeConfig extends NodeConfig {
  contentType: 'text' | 'json' | 'csv'
  content: string
  label: string
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
  model: string
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
  apiKey: string
  aiModel: string
  datasetResult: string | null
  history: HistoryItem[]
  showOnboarding: boolean

  /* multi-workflow */
  savedWorkflows: SavedWorkflow[]
  activeWorkflowId: string | null
  isDirty: boolean

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
  setApiKey: (key: string) => void
  setAiModel: (model: string) => void
  setDatasetResult: (result: string | null) => void
  runWorkflow: () => Promise<void>

  /* multi-workflow actions */
  saveWorkflow: () => void
  loadWorkflow: (id: string) => void
  deleteWorkflow: (id: string) => void
  renameWorkflow: (id: string, name: string) => void
  duplicateWorkflow: (id: string) => void
  exportWorkflow: (id: string) => void
  importWorkflow: (data: string) => boolean
  newWorkflow: () => void
  clearWorkflow: () => void
  markClean: () => void

  addToHistory: (item: HistoryItem) => void
  clearHistory: () => void
  setShowOnboarding: (show: boolean) => void
}

const defaultNodeConfig: Record<NodeType, NodeConfig> = {
  input: { label: 'Input', contentType: 'text', content: '' },
  format: { label: 'Format', formatType: 'jsonl', includeMetadata: true },
  tag: { label: 'Tag & Categorize', categories: '', autoTag: true },
  group: { label: 'Group', groupBy: 'language' },
  translate: { label: 'Translate', targetLanguages: '', preserveMechanics: true },
  output: { label: 'Output', format: 'jsonl' },
  ai: { label: 'AI Transform', prompt: '', model: 'gpt-4o-mini' },
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

const STORAGE_KEY = 'n8n-dataset-state'

function persist(state: WorkflowState): void {
  try {
    const data = {
      savedWorkflows: state.savedWorkflows,
      activeWorkflowId: state.activeWorkflowId,
      onboardingShown: state.onboardingShown,
      apiKey: state.apiKey,
      aiModel: state.aiModel,
      history: state.history,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function getEnvApiKey(): string {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'openrouter'
  if (provider === 'openrouter') {
    return import.meta.env.VITE_OPENROUTER_API_KEY ?? ''
  }
  return import.meta.env.VITE_OPENAI_API_KEY ?? ''
}

function getDefaultModel(): string {
  return import.meta.env.VITE_AI_MODEL ?? 'gpt-4o-mini'
}

function getAIProvider(): string {
  return import.meta.env.VITE_AI_PROVIDER ?? 'openrouter'
}

const loadState = (): Partial<WorkflowState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        savedWorkflows: parsed.savedWorkflows || [],
        activeWorkflowId: parsed.activeWorkflowId || null,
        onboardingShown: parsed.onboardingShown ?? false,
        apiKey: parsed.apiKey || getEnvApiKey(),
        aiModel: parsed.aiModel || getDefaultModel(),
        history: parsed.history || [],
        showOnboarding: parsed.showOnboarding ?? true,
      }
    }
  } catch { /* ignore */ }
  return {
    apiKey: getEnvApiKey(),
    aiModel: getDefaultModel(),
  }
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
  onboardingShown: false,
  apiKey: getEnvApiKey(),
  aiModel: getDefaultModel(),
  datasetResult: null,
  history: [],
  showOnboarding: true,
  savedWorkflows: [],
  activeWorkflowId: null,
  isDirty: false,

  ...loadState(),

  /* load active workflow from saved */
  ...(() => {
    const saved = loadState()
    if (saved.activeWorkflowId && saved.savedWorkflows) {
      const active = (saved.savedWorkflows as SavedWorkflow[]).find(
        w => w.id === saved.activeWorkflowId
      )
      if (active) {
        return {
          nodes: active.nodes,
          edges: active.edges,
          workflowName: active.name,
        }
      }
    }
    return {}
  })(),

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
    set({ onboardingShown: shown })
    persist(get())
  },
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setApiKey: (key) => {
    set({ apiKey: key })
    persist(get())
  },
  setAiModel: (model) => {
    set({ aiModel: model })
    persist(get())
  },
  setDatasetResult: (result) => set({ datasetResult: result }),
  markClean: () => set({ isDirty: false }),

  /* ── Multi-workflow CRUD ── */

  saveWorkflow: () => {
    const { nodes, edges, workflowName, activeWorkflowId, savedWorkflows } = get()
    const now = Date.now()

    if (activeWorkflowId) {
      /* update existing */
      set({
        savedWorkflows: savedWorkflows.map(w =>
          w.id === activeWorkflowId
            ? { ...w, name: workflowName, nodes, edges, updatedAt: now }
            : w
        ),
        isDirty: false,
      })
    } else {
      /* create new */
      const id = uuidv4()
      set({
        activeWorkflowId: id,
        savedWorkflows: [
          ...savedWorkflows,
          { id, name: workflowName, nodes, edges, createdAt: now, updatedAt: now },
        ],
        isDirty: false,
      })
    }
    persist(get())
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
    })
    persist(get())
  },

  deleteWorkflow: (id) => {
    const { savedWorkflows, activeWorkflowId } = get()
    const remaining = savedWorkflows.filter(w => w.id !== id)
    const wasActive = activeWorkflowId === id
    set({
      savedWorkflows: remaining,
      activeWorkflowId: wasActive ? null : activeWorkflowId,
      ...(wasActive ? { nodes: [], edges: [], workflowName: 'Untitled Workflow', selectedNodeId: null, datasetResult: null } : {}),
    })
    persist(get())
  },

  renameWorkflow: (id, name) => {
    set({
      savedWorkflows: get().savedWorkflows.map(w =>
        w.id === id ? { ...w, name, updatedAt: Date.now() } : w
      ),
      ...(get().activeWorkflowId === id ? { workflowName: name } : {}),
    })
    persist(get())
  },

  duplicateWorkflow: (id) => {
    const source = get().savedWorkflows.find(w => w.id === id)
    if (!source) return
    const newWf: SavedWorkflow = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set({ savedWorkflows: [...get().savedWorkflows, newWf] })
    persist(get())
  },

  exportWorkflow: (id) => {
    const wf = get().savedWorkflows.find(w => w.id === id)
    if (!wf) return
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${wf.name.replace(/\s+/g, '_').toLowerCase()}.n8n-dataset.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importWorkflow: (data) => {
    try {
      const parsed = JSON.parse(data) as SavedWorkflow
      if (!parsed.nodes || !parsed.edges) return false
      const newWf: SavedWorkflow = {
        id: uuidv4(),
        name: parsed.name || 'Imported Workflow',
        nodes: parsed.nodes,
        edges: parsed.edges,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      set({ savedWorkflows: [...get().savedWorkflows, newWf] })
      persist(get())
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
    })
  },

  clearWorkflow: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, datasetResult: null, isDirty: true })
  },

  /* ── History ── */

  addToHistory: (item) => {
    set({ history: [item, ...get().history].slice(0, 50) })
    persist(get())
  },
  clearHistory: () => {
    set({ history: [] })
    persist(get())
  },

  /* ── Pipeline execution ── */

  runWorkflow: async () => {
    const { nodes, edges, apiKey } = get()
    set({ isRunning: true, datasetResult: null })

    try {
      const sorted = topologicalSort(nodes, edges)
      let data: Record<string, unknown>[] | string = ''

      for (const node of sorted) {
        const cfg = node.data.config as NodeConfig
        switch (node.data.nodeType) {
          case 'input': {
            const inputCfg = cfg as InputNodeConfig
            data = inputCfg.content
            break
          }
          case 'format': {
            const fmtCfg = cfg as FormatNodeConfig
            if (typeof data === 'string') {
              data = await formatData(data, fmtCfg)
            }
            break
          }
          case 'tag': {
            const tagCfg = cfg as TagNodeConfig
            if (Array.isArray(data)) {
              data = tagData(data, tagCfg)
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
              data = translateData(data, trCfg)
            }
            break
          }
          case 'ai': {
            const aiCfg = cfg as AITransformNodeConfig
            if (Array.isArray(data)) {
              data = await aiTransform(data, aiCfg, apiKey)
            } else if (typeof data === 'string') {
              data = await aiTransformString(data, aiCfg, apiKey)
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
    } catch (err) {
      console.error('Workflow error:', err)
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
    try { return JSON.parse(data) } catch { return [{ raw: data }] }
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

function tagData(data: Record<string, unknown>[], cfg: TagNodeConfig): Record<string, unknown>[] {
  const categories = cfg.categories.split(',').map(c => c.trim()).filter(Boolean)
  return data.map(item => ({
    ...item,
    tags: extractTags(item),
    categories: categories.length > 0 ? categories : ['general'],
    categorized: true,
  }))
}

function extractTags(item: Record<string, unknown>): string[] {
  const text = Object.values(item).join(' ').toLowerCase()
  const common = ['humor', 'education', 'technology', 'culture', 'language', 'pun', 'wordplay']
  return common.filter(t => text.includes(t))
}

function groupData(data: Record<string, unknown>[], cfg: GroupNodeConfig): Record<string, unknown>[] {
  const key = cfg.groupBy
  const groups = new Map<string, Record<string, unknown>[]>()
  data.forEach(item => {
    const val = String(item[key] || 'unknown')
    if (!groups.has(val)) groups.set(val, [])
    groups.get(val)!.push(item)
  })
  const result: Record<string, unknown>[] = []
  groups.forEach((items, groupName) => {
    result.push({ group: groupName, count: items.length, items })
  })
  return result
}

function translateData(data: Record<string, unknown>[], cfg: TranslateNodeConfig): Record<string, unknown>[] {
  const langs = cfg.targetLanguages.split(',').map(l => l.trim()).filter(Boolean)
  if (langs.length === 0) return data
  return data.flatMap(item => {
    return langs.map(lang => ({
      ...item,
      language_code: lang,
      translated: true,
      original_language: item.language_code || 'unknown',
    }))
  })
}

async function aiTransform(data: Record<string, unknown>[], cfg: AITransformNodeConfig, apiKey: string): Promise<Record<string, unknown>[]> {
  if (!apiKey) return data.map(item => ({ ...item, ai_processed: false, error: 'No API key configured' }))
  try {
    const enhanced = await Promise.all(data.map(async (item) => {
      const explanation = await callAI(item, cfg, apiKey)
      return { ...item, explanation_for_ai: explanation, ai_processed: true }
    }))
    return enhanced
  } catch {
    return data.map(item => ({ ...item, ai_processed: false }))
  }
}

async function aiTransformString(data: string, cfg: AITransformNodeConfig, apiKey: string): Promise<Record<string, unknown>[]> {
  if (!apiKey) return [{ raw: data, ai_processed: false, error: 'No API key configured' }]
  try {
    const response = await callAI({ raw_content: data }, cfg, apiKey)
    return [{ raw_content: data, explanation_for_ai: response, ai_processed: true }]
  } catch {
    return [{ raw_content: data, ai_processed: false }]
  }
}

const AI_API: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

async function callAI(item: Record<string, unknown>, cfg: AITransformNodeConfig, apiKey: string): Promise<string> {
  const text = Object.values(item).join('\n').slice(0, 2000)
  const userPrompt = cfg.prompt || `Analyze this content and explain the underlying mechanics, cultural context, and linguistic techniques used. Format the output as a JSON object with fields: "setup", "punchline", "humor_mechanics", "cultural_context", "linguistic_context", "explanation_for_ai".\n\nContent: ${text}`
  const provider = getAIProvider()
  const apiUrl = AI_API[provider] || AI_API.openai
  const model = cfg.model || getDefaultModel()

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': 'https://n8n-dataset.vercel.app',
        'X-Title': 'n8n Dataset',
      } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a data formatting assistant. Analyze content and produce structured JSON output.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error(`AI API error: ${response.status}`)
  const result = await response.json()
  return result.choices?.[0]?.message?.content || 'No response'
}

function outputData(data: Record<string, unknown>[], cfg: OutputNodeConfig): string {
  switch (cfg.format) {
    case 'json':
      return JSON.stringify(data, null, 2)
    case 'csv': {
      if (data.length === 0) return ''
      const headers = Object.keys(data[0])
      const rows = data.map(item => headers.map(h => String(item[h] ?? '')).join(','))
      return [headers.join(','), ...rows].join('\n')
    }
    case 'jsonl':
    default:
      return data.map(item => JSON.stringify(item)).join('\n')
  }
}
