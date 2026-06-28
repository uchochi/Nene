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
  saveWorkflow: () => void
  loadWorkflow: (data: string) => void
  clearWorkflow: () => void
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

const loadState = (): Partial<WorkflowState> => {
  try {
    const saved = localStorage.getItem('n8n-dataset-state')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        workflowName: parsed.workflowName || 'Untitled Workflow',
        onboardingShown: parsed.onboardingShown ?? false,
        apiKey: parsed.apiKey || '',
        aiModel: parsed.aiModel || 'gpt-4o-mini',
        history: parsed.history || [],
        showOnboarding: parsed.showOnboarding ?? true,
      }
    }
  } catch { /* ignore */ }
  return {}
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: 'Untitled Workflow',
  isRunning: false,
  onboardingShown: false,
  apiKey: '',
  aiModel: 'gpt-4o-mini',
  datasetResult: null,
  history: [],
  showOnboarding: true,

  ...loadState(),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) })
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
    set({ nodes: [...get().nodes, newNode] })
  },
  removeSelectedNode: () => {
    const { selectedNodeId, nodes, edges } = get()
    if (!selectedNodeId) return
    set({
      nodes: nodes.filter(n => n.id !== selectedNodeId),
      edges: edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId),
      selectedNodeId: null,
    })
  },
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNodeConfig: (id, config) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      ),
    })
  },
  setWorkflowName: (name) => set({ workflowName: name }),
  setRunning: (running) => set({ isRunning: running }),
  setOnboardingShown: (shown) => {
    set({ onboardingShown: shown })
    localStorage.setItem('n8n-dataset-state', JSON.stringify({ ...get(), onboardingShown: shown }))
  },
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setApiKey: (key) => set({ apiKey: key }),
  setAiModel: (model) => set({ aiModel: model }),
  setDatasetResult: (result) => set({ datasetResult: result }),

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
              data = await tagData(data, tagCfg, apiKey)
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
              data = await translateData(data, trCfg, apiKey)
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

  saveWorkflow: () => {
    const { nodes, edges, workflowName } = get()
    const data = JSON.stringify({ nodes, edges, workflowName })
    localStorage.setItem('n8n-dataset-workflow', data)
  },

  loadWorkflow: (data) => {
    try {
      const parsed = JSON.parse(data)
      set({
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        workflowName: parsed.workflowName || 'Loaded Workflow',
      })
    } catch { /* ignore */ }
  },

  clearWorkflow: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, datasetResult: null })
  },

  addToHistory: (item) => {
    set({ history: [item, ...get().history].slice(0, 50) })
  },

  clearHistory: () => set({ history: [] }),
}))

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

async function formatData(data: string, cfg: FormatNodeConfig): Promise<Record<string, unknown>[]> {
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

async function tagData(data: Record<string, unknown>[], cfg: TagNodeConfig, _apiKey: string): Promise<Record<string, unknown>[]> {
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
    result.push({
      group: groupName,
      count: items.length,
      items,
    })
  })
  return result
}

async function translateData(data: Record<string, unknown>[], cfg: TranslateNodeConfig, _apiKey: string): Promise<Record<string, unknown>[]> {
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

async function callAI(item: Record<string, unknown>, cfg: AITransformNodeConfig, apiKey: string): Promise<string> {
  const text = Object.values(item).join('\n').slice(0, 2000)
  const userPrompt = cfg.prompt || `Analyze this content and explain the underlying mechanics, cultural context, and linguistic techniques used. Format the output as a JSON object with fields: "setup", "punchline", "humor_mechanics", "cultural_context", "linguistic_context", "explanation_for_ai".\n\nContent: ${text}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model || 'gpt-4o-mini',
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
