# Client-side TMA Helpers (archived copy)

`tma.ts` in this folder is a reference copy of `src/utils/tma.ts`.

Unlike the API endpoints in `../api/`, the live `tma.ts` was **kept in the
app** after the browser migration: every exported function already no-ops
when `window.Telegram.WebApp` is absent, so the app gains Telegram-native
polish (MainButton theming, haptics, alerts) when opened inside Telegram
and behaves like a normal web app in the browser.

Callers at time of archiving:

- `src/main.tsx` — used `isTMA()` to gate app vs landing (removed in migration)
- `src/App.tsx` — `initTMA()` on mount (safe no-op in browser)
- `src/components/layout/Toolbar.tsx` — `isTMA()`, `hapticFeedback()`
- `src/components/layout/Canvas.tsx` — `isTMA()`
- `src/components/dataset/DatasetPreview.tsx` — `isTMA()`, `hapticFeedback()`
- `src/store/authStore.ts` — reads Telegram user id to detect account switches
