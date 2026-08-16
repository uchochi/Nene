import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTourStore } from '../tour/tourStore'
import { useWorkflowStore } from '../store/workflowStore'
import {
  User, Mail, Key, Map,
  Copy, Check, Eye, EyeOff, Loader2, LogOut, Lock,
  AlertTriangle, PlayCircle,
} from 'lucide-react'

export function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const signOut = useAuthStore(s => s.signOut)
  const updatePassword = useAuthStore(s => s.updatePassword)
  const navigate = useNavigate()
  const startTour = useTourStore(s => s.startTour)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)

  /* password form */
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  /* sign out confirmation */
  const [signingOut, setSigningOut] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  /* copy user id */
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    if (!user?.id) return
    try {
      await navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (currentPassword && currentPassword === newPassword) {
      setPwError('New password must be different from current password.')
      return
    }

    setPwLoading(true)
    try {
      await updatePassword(newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  const inputClass = 'w-full pl-10 pr-4 py-2.5 bg-n8n-dark-4 border border-n8n-dark-5 rounded-lg text-sm text-white placeholder:text-n8n-gray outline-none focus:border-n8n-orange focus:ring-1 focus:ring-n8n-orange/20 transition-all disabled:opacity-50'
  const labelClass = 'text-xs text-n8n-gray-light font-medium uppercase tracking-wider mb-1.5 block'

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-n8n-gray-light mt-1">
          Manage your account, password, and session.
        </p>
      </div>

      <div className="space-y-8">
        {/* ─── Account Info ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-n8n-orange" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account</h2>
          </div>

          <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-n8n-dark-4">
              <div className="w-12 h-12 rounded-full bg-n8n-orange/20 flex items-center justify-center text-n8n-orange font-bold">
                {(user?.email?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-n8n-gray">Member since {memberSince}</div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-n8n-gray pointer-events-none" />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className={inputClass + ' cursor-not-allowed opacity-60'}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                User ID
                <button
                  onClick={handleCopyId}
                  className="ml-2 inline-flex items-center gap-1 text-n8n-orange hover:text-n8n-orange/80 transition-colors text-xs font-normal normal-case"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </label>
              <div className="bg-n8n-dark-4 rounded-lg px-3.5 py-2.5 text-xs text-n8n-gray font-mono truncate select-all">
                {user?.id || '—'}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Password ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-n8n-orange" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl p-5 space-y-3">
            <div>
              <label className={labelClass}>Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-n8n-gray pointer-events-none" size={16} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className={inputClass + ' pr-10'}
                  placeholder="Enter current password"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-n8n-gray pointer-events-none" size={16} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={inputClass + ' pr-10'}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-n8n-gray pointer-events-none" size={16} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputClass + ' pr-10'}
                  placeholder="Re-enter new password"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwLoading || !newPassword || newPassword !== confirmPassword}
              className="w-full py-2.5 bg-n8n-orange hover:bg-n8n-orange/80 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              {pwLoading ? 'Updating...' : 'Change Password'}
            </button>

            {pwSuccess && (
              <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/30 text-sm text-green-400 flex items-center gap-2">
                <Check size={16} />
                Password updated successfully.
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30 text-sm text-red-400 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                {pwError}
              </div>
            )}
          </form>
        </section>

        {/* ─── Guided Tours ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-n8n-orange" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Guided Tours</h2>
          </div>

          <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl p-5 space-y-3">
            <p className="text-xs text-n8n-gray">
              New to the app or need a refresher? Replay the interactive walkthroughs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  navigate('/')
                  setTimeout(() => startTour('overview'), 300)
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg bg-n8n-dark-4 hover:bg-n8n-dark-5 border border-n8n-dark-5 hover:border-n8n-orange/40 transition-all text-left group"
              >
                <PlayCircle size={20} className="text-n8n-orange flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Welcome Tour</div>
                  <div className="text-xs text-n8n-gray mt-0.5">Navigation, credits & billing basics</div>
                </div>
              </button>

              <button
                onClick={() => {
                  newWorkflow()
                  navigate('/projects/new')
                  setTimeout(() => startTour('editor'), 400)
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg bg-n8n-dark-4 hover:bg-n8n-dark-5 border border-n8n-dark-5 hover:border-n8n-orange/40 transition-all text-left group"
              >
                <PlayCircle size={20} className="text-n8n-orange flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Editor Tour</div>
                  <div className="text-xs text-n8n-gray mt-0.5">Nodes, connections, run & export</div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-n8n-gray">
              Note: the Editor Tour opens a fresh unsaved project with a sample workflow.
            </p>
          </div>
        </section>

        {/* ─── Danger Zone ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-n8n-red" />
            <h2 className="text-sm font-bold text-n8n-red uppercase tracking-wider">Danger Zone</h2>
          </div>

          <div className="bg-n8n-dark-2 border border-n8n-red/20 rounded-xl p-5 space-y-3">
            {!confirmSignOut ? (
              <button
                onClick={() => setConfirmSignOut(true)}
                className="w-full py-2.5 bg-n8n-red/10 hover:bg-n8n-red/20 text-n8n-red rounded-lg font-semibold text-sm transition-all border border-n8n-red/30 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-n8n-gray-light">Are you sure you want to sign out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex-1 py-2 bg-n8n-red hover:bg-n8n-red/80 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
                  </button>
                  <button
                    onClick={() => setConfirmSignOut(false)}
                    className="flex-1 py-2 bg-n8n-dark-4 hover:bg-n8n-dark-5 text-white rounded-lg font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
