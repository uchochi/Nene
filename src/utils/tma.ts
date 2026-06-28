type TelegramWebApp = typeof window.Telegram.WebApp

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

interface TMAInstance {
  webApp: TelegramWebApp | null
  ready: boolean
  initData: string
  initDataUnsafe: Record<string, unknown>
  userId: number | null
  username: string | null
  languageCode: string | null
}

let instance: TMAInstance = {
  webApp: null,
  ready: false,
  initData: '',
  initDataUnsafe: {},
  userId: null,
  username: null,
  languageCode: null,
}

export function initTMA(): TMAInstance {
  if (instance.ready) return instance

  try {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()

      instance = {
        webApp: tg,
        ready: true,
        initData: tg.initData || '',
        initDataUnsafe: tg.initDataUnsafe || {},
        userId: tg.initDataUnsafe?.user?.id || null,
        username: tg.initDataUnsafe?.user?.username || null,
        languageCode: tg.initDataUnsafe?.user?.language_code || null,
      }

      tg.MainButton.setParams({
        color: '#ff0c00',
        text_color: '#ffffff',
      })

      if (tg.setHeaderColor) tg.setHeaderColor('#080808')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#080808')
    }
  } catch {
    // Not running in Telegram
  }

  return instance
}

export function isTMA(): boolean {
  return !!window.Telegram?.WebApp?.initData
}

export function showMainButton(text: string, onClick: () => void): void {
  const tg = window.Telegram?.WebApp
  if (!tg) return
  tg.MainButton.setText(text)
  tg.MainButton.onClick(onClick)
  tg.MainButton.show()
}

export function hideMainButton(): void {
  const tg = window.Telegram?.WebApp
  if (!tg) return
  tg.MainButton.hide()
  tg.MainButton.offClick()
}

export function showPopup(title: string, message: string): void {
  const tg = window.Telegram?.WebApp
  if (!tg) return
  tg.showPopup({
    title,
    message,
    buttons: [{ type: 'close', text: 'OK' }],
  })
}

export function showAlert(message: string): void {
  const tg = window.Telegram?.WebApp
  if (tg?.showAlert) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'warning'): void {
  const tg = window.Telegram?.WebApp
  if (!tg?.HapticFeedback) return
  switch (type) {
    case 'light':
    case 'medium':
    case 'heavy':
      tg.HapticFeedback.impactOccurred(type)
      break
    case 'selection':
      tg.HapticFeedback.selectionChanged()
      break
    case 'success':
    case 'error':
    case 'warning':
      tg.HapticFeedback.notificationOccurred(type)
      break
  }
}
