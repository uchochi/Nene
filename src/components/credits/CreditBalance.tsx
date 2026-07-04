import { useCreditStore } from '../../store/creditStore'
import { Zap, Plus } from 'lucide-react'

interface CreditBalanceProps {
  onBuyCredits: () => void
}

export function CreditBalance({ onBuyCredits }: CreditBalanceProps) {
  const balance = useCreditStore(s => s.balance)

  const low = balance <= 10
  const empty = balance <= 0

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        empty
          ? 'bg-n8n-red/10 text-n8n-red'
          : low
            ? 'bg-n8n-orange/10 text-n8n-orange'
            : 'bg-green-900/20 text-green-400'
      }`}
    >
      <Zap size={14} />
      <span className="tabular-nums">{balance.toLocaleString()}</span>
      <span className="text-current/70 hidden sm:inline">credits</span>
      {low && (
        <button
          onClick={onBuyCredits}
          className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
          title="Buy more credits"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
