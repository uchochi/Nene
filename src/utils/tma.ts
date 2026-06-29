declare global {
  interface Window {
    Telegram?: {
      WebApp: Record<string, unknown>
    }
  }
}

interface TMAInstance {
  webApp: Record<string, unknown> | null
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
    const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
    if (tg) {
      const ready = tg.ready as () => void
      const expand = tg.expand as () => void
      if (ready) ready()
      if (expand) expand()

      const unsafeData = (tg.initDataUnsafe as Record<string, unknown>) || {}
      const user = unsafeData.user as Record<string, unknown> | undefined

      instance = {
        webApp: tg,
        ready: true,
        initData: (tg.initData as string) || '',
        initDataUnsafe: unsafeData,
        userId: (user?.id as number) || null,
        username: (user?.username as string) || null,
        languageCode: (user?.language_code as string) || null,
      }

      const mainButton = tg.MainButton as Record<string, unknown> | undefined
      if (mainButton) {
        const setParams = mainButton.setParams as (p: Record<string, string>) => void
        if (setParams) {
          setParams({ color: '#ff0c00', text_color: '#ffffff' })
        }
      }

      const setHeaderColor = tg.setHeaderColor as (c: string) => void
      const setBackgroundColor = tg.setBackgroundColor as (c: string) => void
      if (setHeaderColor) setHeaderColor('#080808')
      if (setBackgroundColor) setBackgroundColor('#080808')
    }
  } catch {
    // Not running in Telegram
  }

  return instance
}

export function isTMA(): boolean {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  return !!tg?.initData
}

export function showMainButton(text: string, onClick: () => void): void {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  if (!tg) return
  const mainButton = tg.MainButton as Record<string, unknown> | undefined
  if (!mainButton) return
  const setText = mainButton.setText as (t: string) => void
  const setOnClick = mainButton.onClick as (fn: () => void) => void
  const show = mainButton.show as () => void
  if (setText) setText(text)
  if (setOnClick) setOnClick(onClick)
  if (show) show()
}

export function hideMainButton(): void {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  if (!tg) return
  const mainButton = tg.MainButton as Record<string, unknown> | undefined
  if (!mainButton) return
  const hide = mainButton.hide as () => void
  const offClick = mainButton.offClick as (fn?: () => void) => void
  if (hide) hide()
  if (offClick) offClick()
}

export function showPopup(title: string, message: string): void {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  if (!tg) return
  const showPopupFn = tg.showPopup as (p: { title: string; message: string; buttons: Array<{ type: string; text: string }> }) => void
  if (showPopupFn) {
    showPopupFn({ title, message, buttons: [{ type: 'close', text: 'OK' }] })
  }
}

export function showAlert(message: string): void {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  if (!tg) return
  const showAlertFn = tg.showAlert as (m: string) => void
  if (showAlertFn) {
    showAlertFn(message)
  } else {
    alert(message)
  }
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'warning'): void {
  const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
  const hf = tg?.HapticFeedback as Record<string, unknown> | undefined
  if (!hf) return
  switch (type) {
    case 'light':
    case 'medium':
    case 'heavy': {
      const fn = hf.impactOccurred as (s: string) => void
      if (fn) fn(type)
      break
    }
    case 'selection': {
      const fn = hf.selectionChanged as () => void
      if (fn) fn()
      break
    }
    case 'success':
    case 'error':
    case 'warning': {
      const fn = hf.notificationOccurred as (s: string) => void
      if (fn) fn(type)
      break
    }
  }
}
