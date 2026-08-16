import { useNavigate } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'
import { useCreditStore } from '../../store/creditStore'

interface TopBarProps {
  onToggleSidebar: () => void
  onBuyCredits: (reason?: string) => void
}

export function TopBar({ onToggleSidebar, onBuyCredits }: TopBarProps) {
  const navigate = useNavigate()
  const balance = useCreditStore(s => s.balance)

  const low = balance <= 10
  const empty = balance <= 0

  return (
    <header className="h-12 bg-n8n-dark-2 border-b border-n8n-dark-4 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors lg:hidden"
        title="Toggle menu"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      {/* credit balance pill — click to go to credits page */}
      <button
        onClick={() => navigate('/credits')}
        data-tour="credits-pill"
        title="View credits & billing"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          empty
            ? 'bg-n8n-red/10 text-n8n-red'
            : low
              ? 'bg-n8n-orange/10 text-n8n-orange'
              : 'bg-green-900/20 text-green-400'
        } hover:opacity-80`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="flex-shrink-0">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        <span className="tabular-nums">{balance.toLocaleString()}</span>
        <span className="text-current/70 hidden sm:inline">credits</span>
      </button>

      <button
        onClick={() => onBuyCredits()}
        data-tour="buy-credits"
        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
      >
        <Plus size={14} />
        <span className="hidden sm:inline">Buy Credits</span>
      </button>
    </header>
  )
}
