import { useState } from 'react'
import { Zap, X, Coins, TrendingUp, Check } from 'lucide-react'

const SEEN_KEY = 'ooguy-token-billing-announcement-seen'

/**
 * One-time announcement modal explaining the transition from per-operation
 * credits to token-based billing. Shows once per user (tracked via localStorage).
 *
 * Key changes communicated:
 * - 10,000 credits = 1M tokens (1 credit = 100 tokens)
 * - Existing balances multiplied by 8x (old 1,250 → new 10,000)
 * - Billing is now based on actual AI token consumption, not fixed per-run
 */
export function TokenBillingAnnouncement() {
  const [open, setOpen] = useState(() => !localStorage.getItem(SEEN_KEY))

  if (!open) return null

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-2xl w-full max-w-md shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n8n-dark-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-n8n-orange/10 flex items-center justify-center">
              <Zap size={18} className="text-n8n-orange" />
            </div>
            <span className="font-bold text-white">Billing Updated</span>
          </div>
          <button
            onClick={dismiss}
            className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-n8n-gray-light leading-relaxed">
            We've upgraded our billing to be <span className="text-white font-medium">token-based</span> —
            you now pay only for the AI tokens each workflow actually uses, not a flat fee per run.
          </p>

          {/* key facts */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-n8n-dark-3 border border-n8n-dark-4">
              <Coins size={18} className="text-n8n-orange flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">New conversion</div>
                <div className="text-xs text-n8n-gray-light mt-0.5">
                  10,000 credits = 1M tokens (1 credit = 100 tokens)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-900/10 border border-green-700/20">
              <TrendingUp size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Your balance was multiplied 8x</div>
                <div className="text-xs text-n8n-gray-light mt-0.5">
                  Old credits are now worth 8x more in the new system.
                  Same dollar value, same token capacity.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-n8n-dark-3 border border-n8n-dark-4">
              <Check size={18} className="text-n8n-orange flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Fairer pricing</div>
                <div className="text-xs text-n8n-gray-light mt-0.5">
                  Short workflows cost less. You only pay for what you process.
                </div>
              </div>
            </div>
          </div>

          {/* new plans */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center p-2.5 rounded-lg bg-n8n-dark-3 border border-n8n-dark-4">
              <div className="text-xs text-n8n-gray-light">Starter</div>
              <div className="text-sm font-bold text-n8n-orange mt-0.5">1M</div>
              <div className="text-[10px] text-n8n-gray">$10</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-n8n-dark-3 border border-n8n-dark-4">
              <div className="text-xs text-n8n-gray-light">Pro</div>
              <div className="text-sm font-bold text-n8n-orange mt-0.5">2M</div>
              <div className="text-[10px] text-n8n-gray">$20</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-n8n-dark-3 border border-n8n-dark-4">
              <div className="text-xs text-n8n-gray-light">Business</div>
              <div className="text-sm font-bold text-n8n-orange mt-0.5">4M</div>
              <div className="text-[10px] text-n8n-gray">$40</div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-n8n-dark-4">
          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-lg bg-n8n-orange hover:bg-n8n-orange/90 text-sm font-medium text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
