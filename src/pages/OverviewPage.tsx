import { useNavigate } from 'react-router-dom'
import {
  FileText, Zap, History, Plus, ArrowRight, Clock,
} from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { useCreditStore } from '../store/creditStore'
import { useAuthStore } from '../store/authStore'

export function OverviewPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const savedWorkflows = useWorkflowStore(s => s.savedWorkflows)
  const history = useWorkflowStore(s => s.history)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)
  const balance = useCreditStore(s => s.balance)
  const totalPurchased = useCreditStore(s => s.totalPurchased)

  const handleNew = () => {
    newWorkflow()
    navigate('/projects/new')
  }

  const firstName = user?.email?.split('@')[0] || 'there'
  const totalRows = history.reduce((sum, h) => sum + h.rowCount, 0)

  return (
    <div className="page-container">
      {/* greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white capitalize">
          Hello, {firstName}
        </h1>
        <p className="text-sm text-n8n-gray-light mt-1">
          Here's what's happening with your datasets.
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <button onClick={() => navigate('/projects')} className="stat-card text-left">
          <div className="flex items-center justify-between mb-2">
            <FileText size={18} className="text-n8n-orange" />
            <ArrowRight size={14} className="text-n8n-gray" />
          </div>
          <div className="text-2xl font-bold text-white">{savedWorkflows.length}</div>
          <div className="text-xs text-n8n-gray-light mt-0.5">Projects</div>
        </button>

        <button onClick={() => navigate('/credits')} className="stat-card text-left">
          <div className="flex items-center justify-between mb-2">
            <Zap size={18} className="text-n8n-orange" />
            <ArrowRight size={14} className="text-n8n-gray" />
          </div>
          <div className="text-2xl font-bold text-white">{balance.toLocaleString()}</div>
          <div className="text-xs text-n8n-gray-light mt-0.5">Credits left</div>
        </button>

        <button onClick={() => navigate('/history')} className="stat-card text-left">
          <div className="flex items-center justify-between mb-2">
            <History size={18} className="text-n8n-orange" />
            <ArrowRight size={14} className="text-n8n-gray" />
          </div>
          <div className="text-2xl font-bold text-white">{history.length}</div>
          <div className="text-xs text-n8n-gray-light mt-0.5">Exports</div>
        </button>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <Clock size={18} className="text-n8n-orange" />
          </div>
          <div className="text-2xl font-bold text-white">{totalRows.toLocaleString()}</div>
          <div className="text-xs text-n8n-gray-light mt-0.5">Rows processed</div>
        </div>
      </div>

      {/* quick action */}
      <div className="mb-8">
        <button
          onClick={handleNew}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* recent projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Recent Projects
          </h2>
          {savedWorkflows.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-n8n-orange hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {savedWorkflows.length === 0 ? (
          <div className="bg-n8n-dark-2 border border-dashed border-n8n-dark-5 rounded-xl p-8 text-center">
            <FileText size={32} className="mx-auto text-n8n-gray mb-3" />
            <p className="text-sm text-n8n-gray-light mb-1">No projects yet</p>
            <p className="text-xs text-n8n-gray mb-4">
              Create your first workflow to start formatting datasets.
            </p>
            <button
              onClick={handleNew}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedWorkflows.slice(0, 6).map(wf => (
              <button
                key={wf.id}
                onClick={() => navigate(`/projects/${wf.id}`)}
                className="project-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-n8n-orange flex-shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">{wf.name}</span>
                </div>
                <div className="text-xs text-n8n-gray-light">
                  {wf.nodes.length} nodes · {new Date(wf.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {totalPurchased > 0 && (
        <p className="text-xs text-n8n-gray mt-8">
          Lifetime credits purchased: {totalPurchased.toLocaleString()}
        </p>
      )}
    </div>
  )
}
