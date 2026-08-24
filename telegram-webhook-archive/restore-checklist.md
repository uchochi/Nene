# Restore Checklist — Telegram Mini App Integration

Reverse-order steps to re-enable the archived Telegram integration.
All paths are relative to the repo root.

## 1. Restore the API endpoints

```bash
cp telegram-webhook-archive/api/tg-auth.js      api/tg-auth.js
cp telegram-webhook-archive/api/tg-bot-webhook.js api/tg-bot-webhook.js
```

## 2. Restore the Telegram helpers in api/_lib.js

Copy `verifyTelegramInitData` and `parseUserFromInitData` from
`telegram-webhook-archive/api/_lib.js` back into the live `api/_lib.js`
(keep the existing `corsHeaders`/`signJwt` — do not duplicate).

## 3. Set environment variables (Vercel → Project → Settings → Environment Variables)

- `BOT_TOKEN` — from @BotFather
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API
- `VITE_SUPABASE_URL` — should already be set

Redeploy after adding.

## 4. Re-register the bot webhook (phone-number capture)

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<APP_URL>/api/tg-bot-webhook"
```

## 5. Client-side wiring (optional, per how deep you want to go)

- `src/utils/tma.ts` is unchanged and still active — `initTMA()`,
  `isTMA()`, haptics etc. work whenever the app runs inside Telegram.
- To gate the app shell to Telegram again (old behaviour), restore the
  `isTMA()` branch in `src/main.tsx`:

  ```tsx
  import { isTMA } from './utils/tma'
  // TMA → <App />, browser → <LandingPage />
  ```

- To bring back passwordless "Sign in with Telegram", re-add a button in
  `src/components/auth/AuthScreen.tsx` that posts
  `window.Telegram.WebApp.initData` to `/api/tg-auth` and applies the
  returned session with `supabase.auth.setSession(...)`.

## 6. Verify

- [ ] `POST /api/tg-auth` with valid initData returns a session
- [ ] Sharing a phone number in the Mini App upserts `users.phone_number`
- [ ] Browser access still works (integration must be additive, not a gate)
