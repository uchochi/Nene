# Telegram Webhook Archive

This folder preserves the **Telegram Mini App integration** that ooguy used
before migrating to browser-first access (2026-08-24). Nothing here is
deployed or imported by the live app — it is kept so the integration can be
restored quickly if Telegram distribution is ever wanted again.

## What the integration did

| Piece | File (archived copy) | Purpose |
|---|---|---|
| Telegram sign-in endpoint | `api/tg-auth.js` | Verified the Mini App's `initData` (HMAC-SHA256 against `BOT_TOKEN`), created/linked a Supabase Auth user per Telegram account, and minted a Supabase session via the admin API |
| Bot webhook | `api/tg-bot-webhook.js` | Received Telegram service messages when users shared their phone number; upserted it into the `users` table keyed by `telegram_id` |
| Shared utilities | `api/_lib.js` | `verifyTelegramInitData`, `parseUserFromInitData`, plus `corsHeaders`/`signJwt` (the live `api/_lib.js` still keeps `corsHeaders` for the other endpoints) |
| Client SDK helpers | `client/tma.ts` | Telegram WebApp bootstrapping (`initTMA`, `isTMA`), MainButton, popups, haptics. **The original still lives at `src/utils/tma.ts`** — optional TMA polish (haptics, theme) still activates if the app is opened inside Telegram; copy kept here for reference |

## Environment variables it required

| Variable | Where | Used by |
|---|---|---|
| `BOT_TOKEN` | Vercel | `tg-auth.js` (initData verification), bot webhook setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | both endpoints (admin user creation + table writes) |
| `VITE_SUPABASE_URL` | Vercel | both endpoints |

## Database tables it touched

- `public.users` — linked `telegram_id` ↔ `supabase_user_id`, stored
  `username`, `first_name`, `last_name`, `phone_number`
  (the table itself is untouched by the migration and can stay)

## How the pieces were wired (pre-migration)

1. `index.html` loads `https://telegram.org/js/telegram-web-app.js` (still present).
2. `main.tsx` used to branch on `isTMA()`: Mini App → app shell, browser → marketing landing.
3. Inside Telegram, a "Sign in with Telegram" button posted `initData` to `/api/tg-auth`.
4. Telegram was told to forward contact-shared messages to `/api/tg-bot-webhook` via `setWebhook`.

See `restore-checklist.md` for the exact steps to bring all of this back.
