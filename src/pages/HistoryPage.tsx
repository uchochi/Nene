import { useState } from 'react'
import { History, FileText, Zap, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { useCreditStore, type CreditTransaction } from '../store/creditStore'
import { formatCurrency, creditsToTokens, formatTokens } from '../utils/credits'

type Tab = 'exports' | 'transactions'

export function HistoryPage() {
  const [tab, setTab] = useState<Tab>('exports')
  const history = useWorkflowStore(s => s.history)
  const clearHistory = useWorkflowStore(s => s.clearHistory)
  const transactions = useCreditStore(s => s.transactions)

  return (
    <div className="page-container">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-sm text-n8n-gray-light mt-1">
            Your dataset exports and credit activity.
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 mb-6 bg-n8n-dark-2 border border-n8n-dark-4 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('exports')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'exports' ? 'bg-n8n-dark-4 text-white' : 'text-n8n-gray-light hover:text-white'
          }`}
        >
          <FileText size={14} />
          Exports
          {history.length > 0 && (
            <span className="text-[10px] bg-n8n-dark-5 px-1.5 py-0.5 rounded-full">{history.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'transactions' ? 'bg-n8n-dark-4 text-white' : 'text-n8n-gray-light hover:text-white'
          }`}
        >
          <Zap size={14} />
          Transactions
          {transactions.length > 0 && (
            <span className="text-[10px] bg-n8n-dark-5 px-1.5 py-0.5 rounded-full">{transactions.length}</span>
          )}
        </button>
      </div>

      {tab === 'exports' ? (
        <ExportsTab history={history} onClear={clearHistory} />
      ) : (
        <TransactionsTab transactions={transactions} />
      )}
    </div>
  )
}

/* ── Exports tab ── */

interface ExportsTabProps {
  history: ReturnType<typeof useWorkflowStore.getState>['history']
  onClear: () => Promise<void>
}

function ExportsTab({ history, onClear }: ExportsTabProps) {
  if (history.length === 0) {
    return (
      <div className="bg-n8n-dark-2 border border-dashed border-n8n-dark-5 rounded-xl p-12 text-center">
        <History size={40} className="mx-auto text-n8n-gray mb-4" />
        <h3 className="text-base font-semibold text-white mb-1">No exports yet</h3>
        <p className="text-sm text-n8n-gray">
          Run a workflow and export a dataset to see it here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => { if (confirm('Clear all export history?')) onClear() }}
          className="inline-flex items-center gap-1.5 text-xs text-n8n-gray-light hover:text-n8n-red transition-colors"
        >
          <Trash2 size={13} />
          Clear all
        </button>
      </div>
      <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl overflow-hidden">
        {history.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-n8n-dark-4' : ''}`}
          >
            <div className="w-9 h-9 rounded-lg bg-n8n-orange/10 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-n8n-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{item.workflowName}</div>
              <div className="text-xs text-n8n-gray">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
            <span className="text-xs text-n8n-gray-light bg-n8n-dark-4 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
              {item.rowCount} rows
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Transactions tab ── */

interface TransactionsTabProps {
  transactions: CreditTransaction[]
}

function TransactionsTab({ transactions }: TransactionsTabProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-n8n-dark-2 border border-dashed border-n8n-dark-5 rounded-xl p-12 text-center">
        <Zap size={40} className="mx-auto text-n8n-gray mb-4" />
        <h3 className="text-base font-semibold text-white mb-1">No transactions yet</h3>
        <p className="text-sm text-n8n-gray">
          When you purchase credits, your transactions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl overflow-hidden">
      {transactions.map((txn, i) => (
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
              <span className="text-n8n-orange/70 text-xs ml-1.5">
                ({formatTokens(creditsToTokens(txn.creditsAwarded))})
              </span>
            </div>
            <div className="text-xs text-n8n-gray truncate">
              {new Date(txn.createdAt).toLocaleString()} · {txn.reference}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-white">
              {formatCurrency(txn.amountPaid / 100, txn.currency)}
            </div>
            <StatusBadge status={txn.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: CreditTransaction['status'] }) {
  const styles: Record<CreditTransaction['status'], string> = {
    completed: 'text-green-400',
    pending: 'text-n8n-orange',
    failed: 'text-n8n-red',
  }
  return <span className={`text-[10px] uppercase font-medium ${styles[status]}`}>{status}</span>
}
