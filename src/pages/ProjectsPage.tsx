import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Upload, Copy, Trash2, Edit3, Download, Clock, Search,
} from 'lucide-react'
import {
  useWorkflowStore, type SavedWorkflow,
} from '../store/workflowStore'

export function ProjectsPage() {
  const navigate = useNavigate()
  const savedWorkflows = useWorkflowStore(s => s.savedWorkflows)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow)
  const importWorkflow = useWorkflowStore(s => s.importWorkflow)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? savedWorkflows.filter(w => w.name.toLowerCase().includes(query.toLowerCase()))
    : savedWorkflows

  const openProject = (id: string) => {
    loadWorkflow(id)
    navigate(`/app/projects/${id}`)
  }

  const handleNew = () => {
    navigate('/app/projects/new')
    try { newWorkflow() } catch (e) { console.error('newWorkflow error:', e) }
  }

  const handleImport = () => importInputRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const ok = await importWorkflow(text)
      if (ok) alert('Workflow imported successfully')
      else alert('Invalid workflow file')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="page-container">
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-n8n-gray-light mt-1">
            {savedWorkflows.length} {savedWorkflows.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleImport} className="btn-secondary text-xs inline-flex items-center gap-1.5">
            <Upload size={14} />
            Import
          </button>
          <button onClick={handleNew} className="btn-primary text-xs inline-flex items-center gap-1.5">
            <Plus size={14} />
            New Project
          </button>
        </div>
      </div>

      {/* search */}
      {savedWorkflows.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-n8n-gray" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="input-field pl-9 max-w-sm"
          />
        </div>
      )}

      {/* grid */}
      {savedWorkflows.length === 0 ? (
        <div className="bg-n8n-dark-2 border border-dashed border-n8n-dark-5 rounded-xl p-12 text-center">
          <FileText size={40} className="mx-auto text-n8n-gray mb-4" />
          <h3 className="text-base font-semibold text-white mb-1">No projects yet</h3>
          <p className="text-sm text-n8n-gray mb-6 max-w-xs mx-auto">
            Create a new workflow to format, tag, and translate datasets for LLM training.
          </p>
          <button onClick={handleNew} className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus size={16} />
            Create your first project
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-n8n-gray">
          No projects match "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(wf => (
            <ProjectCard key={wf.id} wf={wf} onOpen={() => openProject(wf.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  wf: SavedWorkflow
  onOpen: () => void
}

function ProjectCard({ wf, onOpen }: ProjectCardProps) {
  const deleteWorkflow = useWorkflowStore(s => s.deleteWorkflow)
  const renameWorkflow = useWorkflowStore(s => s.renameWorkflow)
  const duplicateWorkflow = useWorkflowStore(s => s.duplicateWorkflow)
  const exportWorkflow = useWorkflowStore(s => s.exportWorkflow)

  const nodeCount = wf.nodes.length
  const updated = new Date(wf.updatedAt)

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    const name = prompt('Rename project:', wf.name)
    if (name?.trim()) renameWorkflow(wf.id, name.trim())
  }

  return (
    <div
      onClick={onOpen}
      className="project-card group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-n8n-orange/10 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-n8n-orange" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{wf.name}</div>
            <div className="text-[11px] text-n8n-gray flex items-center gap-1">
              <Clock size={10} />
              {updated.toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={handleRename} title="Rename" className="p-1.5 rounded-md hover:bg-n8n-dark-5 text-n8n-gray-light hover:text-white transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={() => duplicateWorkflow(wf.id)} title="Duplicate" className="p-1.5 rounded-md hover:bg-n8n-dark-5 text-n8n-gray-light hover:text-white transition-colors">
            <Copy size={13} />
          </button>
          <button onClick={() => exportWorkflow(wf.id)} title="Export" className="p-1.5 rounded-md hover:bg-n8n-dark-5 text-n8n-gray-light hover:text-white transition-colors">
            <Download size={13} />
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${wf.name}"?`)) deleteWorkflow(wf.id) }}
            title="Delete"
            className="p-1.5 rounded-md hover:bg-n8n-dark-5 text-n8n-gray-light hover:text-n8n-red transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-n8n-gray-light bg-n8n-dark-4 px-2 py-0.5 rounded-full">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
        <span className="text-[11px] text-n8n-orange opacity-0 group-hover:opacity-100 transition-opacity">
          Open editor →
        </span>
      </div>
    </div>
  )
}
