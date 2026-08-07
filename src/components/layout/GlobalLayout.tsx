import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { GlobalSidebar } from './GlobalSidebar'
import { TopBar } from './TopBar'
import { CreditTopUp } from '../credits/CreditTopUp'

/**
 * Layout for account-level pages (Overview, Projects list, History, Credits, Settings).
 * Renders the persistent Vercel-style global sidebar + top bar + content via <Outlet />.
 * Used as a parent layout route.
 */
export function GlobalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpReason, setTopUpReason] = useState('')

  const onBuyCredits = useCallback((reason = '') => {
    setTopUpReason(reason)
    setShowTopUp(true)
  }, [])

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-n8n-dark">
      <CreditTopUp open={showTopUp} onClose={() => setShowTopUp(false)} reason={topUpReason} />

      <GlobalSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(v => !v)} onBuyCredits={onBuyCredits} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
