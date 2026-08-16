import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, FileText, History, Zap, Settings,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface NavEntry {
  to: string
  label: string
  icon: typeof LayoutGrid
}

const NAV_ITEMS: NavEntry[] = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/projects', label: 'Projects', icon: FileText },
  { to: '/history', label: 'History', icon: History },
  { to: '/credits', label: 'Credits', icon: Zap },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface GlobalSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSidebar({ isOpen, onClose }: GlobalSidebarProps) {
  const user = useAuthStore(s => s.user)
  const signOut = useAuthStore(s => s.signOut)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-n8n-dark-2 border-r border-n8n-dark-4
          flex flex-col h-full flex-shrink-0 transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* logo header */}
        <div className="px-4 py-4 border-b border-n8n-dark-4 flex items-center gap-2.5">
          <img src="/logo.png" alt="ooguy" className="h-7 w-auto flex-shrink-0" />
          <span className="text-sm font-bold text-white">ooguy</span>
        </div>

        {/* nav items */}
        <nav data-tour="sidebar-nav" className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`nav-item-indicator w-1 h-4 rounded-full bg-transparent flex-shrink-0 transition-colors ${isActive ? '!bg-n8n-orange' : ''}`} />
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* user profile footer */}
        <div className="px-3 py-3 border-t border-n8n-dark-4">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-n8n-orange/20 flex items-center justify-center text-n8n-orange font-bold text-xs flex-shrink-0">
              {(user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-[10px] text-n8n-gray truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs text-n8n-gray-light hover:text-n8n-red hover:bg-n8n-dark-4 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
