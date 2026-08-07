import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Plus, TrendingUp, History as HistoryIcon, ArrowRight } from 'lucide-react'
import { useCreditStore } from '../store/creditStore'
import { CreditTopUp } from '../components/credits/CreditTopUp'
import { formatCurrency } from '../utils/credits'

export function CreditsPage() {
  const navigate = useNavigate()
  const balance = useCreditStore(s => s.balance)
  const totalPurchased = useCreditStore(s => s.totalPurchased)
  const transactions = useCreditStore(s => s.transactions)

  const [showTopUp, setShowTopUp] = useState(false)
  const [reason, setReason] = useState('')

  const onBuy = useCallback((r = '') => {
    setReason(r)
    setShowTopUp(true)
  }, [])

  const completedCount = transactions.filter(t => t.status === 'completed').length
  const totalSpentCents = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amountPaid, 0)

  return (
    <div className="page-container">
      <CreditTopUp open={showTopUp} onClose={() => setShowTopUp(false)} reason={reason} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Credits</h1>
        <p className="text-sm text-n8n-gray-light mt-1">
          Monitor your balance and purchase credits for workflow runs and exports.
        </p>
      </div>

      {/* balance hero */}
      <div className="stat-card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-n8n-orange/10 flex items-center justify-center">
              <Zap size={28} className="text-n8n-orange" />
            </div>
            <div>
              <div className="text-xs text-n8n-gray-light uppercase tracking-wider">Current Balance</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {balance.toLocaleString()}
                <span className="text-base font-normal text-n8n-gray-light ml-1.5">credits</span>
              </div>
            </div>
          </div>
          <button onClick={() => onBuy()} className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus size={16} />
            Buy Credits
          </button>
        </div>
      </div>

      {/* mini stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-n8n-orange" />
            <span className="text-xs text-n8n-gray-light uppercase tracking-wider">Lifetime Credits</span>
          </div>
          <div className="text-xl font-bold text-white">{totalPurchased.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-n8n-orange" />
            <span className="text-xs text-n8n-gray-light uppercase tracking-wider">Purchases</span>
          </div>
          <div className="text-xl font-bold text-white">{completedCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <HistoryIcon size={16} className="text-n8n-orange" />
            <span className="text-xs text-n8n-gray-light uppercase tracking-wider">Total Spent</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(totalSpentCents / 100, 'USD')}
          </div>
        </div>
      </div>

      {/* recent transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Recent Transactions
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-n8n-orange hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowRight size={12} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-n8n-dark-2 border border-dashed border-n8n-dark-5 rounded-xl p-10 text-center">
            <Zap size={32} className="mx-auto text-n8n-gray mb-3" />
            <p className="text-sm text-n8n-gray-light mb-1">No transactions yet</p>
            <p className="text-xs text-n8n-gray mb-4">Purchase credits to start running workflows.</p>
            <button onClick={() => onBuy()} className="btn-primary text-xs inline-flex items-center gap-1.5">
              <Plus size={14} />
              Buy Credits
            </button>
          </div>
        ) : (
          <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl overflow-hidden">
            {transactions.slice(0, 8).map((txn, i) => (
              <div
                key={txn.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-n8n-dark-4' : ''}`}
              >
                <div className="w-9 h-9 rounded-lg bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Zap size={16} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {txn.creditsAwarded.toLocaleString()} credits
                  </div>
                  <div className="text-xs text-n8n-gray">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white flex-shrink-0">
                  {formatCurrency(txn.amountPaid / 100, txn.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
