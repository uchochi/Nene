import { useState } from 'react'
import { useAuthStore, type TgUser } from '../../store/authStore'

interface AuthScreenProps {
  user: TgUser
  onAuthSuccess: () => void
}

export function AuthScreen({ user, onAuthSuccess }: AuthScreenProps) {
  const [requestingPhone, setRequestingPhone] = useState(false)
  const phoneRequested = useAuthStore(s => s.user?.phone_number)
  const updatePhoneNumber = useAuthStore(s => s.updatePhoneNumber)

  const handleRequestPhone = async () => {
    setRequestingPhone(true)
    try {
      const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
      if (tg?.requestPhoneAccess) {
        const requestPhoneAccess = tg.requestPhoneAccess as (cb: (s: string) => void) => void
        requestPhoneAccess((status: string) => {
          if (status === 'sent') {
            updatePhoneNumber('requested')
          }
          setRequestingPhone(false)
        })
        return
      }
    } catch {}
    setRequestingPhone(false)
  }

  return (
    <div className="min-h-screen bg-n8n-dark-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <img src="/logo.png" alt="n8n Dataset" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white">n8n Dataset</h1>
          <p className="text-sm text-n8n-gray mt-1">Welcome, {user.first_name || user.username || 'User'}</p>
        </div>

        {!phoneRequested && (
          <div className="space-y-4">
            <p className="text-sm text-n8n-gray">
              Share your phone number to enable phone-based features.
            </p>
            <button
              onClick={handleRequestPhone}
              disabled={requestingPhone}
              className="w-full py-2.5 rounded-lg bg-n8n-orange text-white font-semibold text-sm hover:bg-n8n-orange/90 transition-colors disabled:opacity-50"
            >
              {requestingPhone ? 'Requesting...' : 'Share Phone Number'}
            </button>
            <button
              onClick={onAuthSuccess}
              className="w-full py-2.5 rounded-lg border border-n8n-dark-5 text-n8n-gray text-sm hover:bg-n8n-dark-4 transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {phoneRequested && (
          <div className="space-y-4">
            <p className="text-sm text-n8n-green">Phone number request sent!</p>
            <button
              onClick={onAuthSuccess}
              className="w-full py-2.5 rounded-lg bg-n8n-orange text-white font-semibold text-sm hover:bg-n8n-orange/90 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
