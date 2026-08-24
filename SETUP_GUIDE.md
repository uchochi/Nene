# n8n Dataset — Setup Guide

A browser-based web app for formatting, translating, and structuring data for LLM training.

> **History:** this app originally shipped as a Telegram Mini App. The Telegram
> integration (bot sign-in + phone-number webhook) was archived on 2026-08-24 —
> see [`telegram-webhook-archive/`](./telegram-webhook-archive/README.md) if you
> ever want to restore it. The app still works inside Telegram (it auto-skips
> the landing page), but the primary experience is now the browser.

---

## Prerequisites

- **Node.js** v18+ and **npm**
- (Optional) An **OpenAI** or **OpenRouter** API key for AI features

---

## 1. Local Setup

```bash
# Navigate to the project
cd n8n-dataset

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will run at `http://localhost:5173`:

- `/` — marketing landing page (home)
- `/app` — the application (email/password sign-in or sign-up)

---

## 2. Routing Overview

| Route | Access | Contents |
|---|---|---|
| `/` | Public | Landing page with feature overview and CTAs |
| `/app` | Auth-gated | Overview dashboard (after login) |
| `/app/projects` | Auth-gated | Saved workflows |
| `/app/history` | Auth-gated | Pipeline execution history |
| `/app/credits` | Auth-gated | Plans, purchase, transaction history |
| `/app/settings` | Auth-gated | Account settings |
| `/app/projects/:id` | Auth-gated | Visual workflow editor |

---

## 3. Deploy to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (if not already)
vercel login

# Deploy from the project root
vercel

# For production
vercel --prod
```

### Option B: Vercel Dashboard (Manual)

1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Vercel auto-detects Vite — no config changes needed.
5. Click **Deploy**.

### Environment Variables (Vercel)

After deployment, go to **Vercel Dashboard → Project → Settings → Environment Variables** and add:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key — client-side checkout (Nigeria) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key — server-side payment verification |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | FlutterWave public key — client-side checkout (all other countries) |
| `FLUTTERWAVE_SECRET_KEY` | FlutterWave secret key — server-side payment verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (Settings → API) — server-side crediting in `api/verify-payment.js` |

Redeploy after setting environment variables.

---

## 4. Deploy to Netlify (Alternative)

> **Note:** The `api/` serverless functions require Vercel's runtime. Netlify does not support them. Use Vercel if you need payment verification or AI endpoints.

```bash
npm run build
npm i -g netlify-cli
netlify deploy --dir=dist --prod
```

---

## 5. Authentication

The app uses **Supabase email/password** authentication.

### Email / Password Flow

1. User lands on `/` (marketing page) and clicks **Sign Up** / **Get Started Free**
2. They're taken to `/app`, which shows the Auth screen when not signed in
3. On sign-up, a confirmation email with an **8-digit verification code** is sent (via Resend SMTP)
4. User enters the code to confirm their account
5. Once authenticated, the app loads normally

### Database tables

- **`users`** — Legacy Telegram account links (kept for reference; unused in browser mode)
- **`workflows`** — User's saved workflows (keyed by Supabase `auth.uid()` UUID)
- **`history_items`** — User's pipeline execution history (keyed by Supabase `auth.uid()` UUID)
- **`user_credits`** — Per-user credit balance and token usage
- **`credit_transactions`** — Purchase records

RLS policies use `auth.uid()` from the Supabase session to ensure users only access their own data.

> Telegram sign-in and the phone-number bot webhook are archived in
> [`telegram-webhook-archive/`](./telegram-webhook-archive/README.md) —
> its `restore-checklist.md` has step-by-step instructions.

---

## 6. Configure AI (Optional)

AI features are configured via environment variables — no settings UI needed in the app.

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `VITE_AI_PROVIDER` | `openrouter` or `openai` |
| `VITE_OPENROUTER_API_KEY` | Your OpenRouter API key (for OpenRouter provider) |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key (for OpenAI provider) |
| `VITE_AI_MODEL` | Model name e.g. `gpt-4o-mini`, `claude-3-haiku` |

---

## 7. Download Bridge (Legacy)

Browser downloads work natively, but the app still routes exports through a
small companion app (a relic of the Telegram era, where direct downloads
weren't possible). If you want to keep using it:

1. Clone and deploy [the downloader repo](https://github.com/uchochi/Nene2u.git)
2. Update `DOWNLOADER_BASE` in `src/utils/downloadLink.ts`
3. Redeploy the main app

This can be simplified to direct in-browser downloads in the future.

---

## 8. Production Checklist

- [ ] Landing page loads at `/` with working CTAs
- [ ] App loads at `/app` with email/password sign-in
- [ ] Email verification code is received and works
- [ ] Onboarding displays on first visit only
- [ ] Nodes can be added by clicking or dragging from the palette
- [ ] Workflow runs end-to-end (Input → Format → AI → Output)
- [ ] JSONL export downloads correctly
- [ ] Preview tab shows formatted entries
- [ ] Stats tab shows language/region/mechanic breakdown
- [ ] Sidebar closes on mobile
- [ ] Toolbar actions (Save, Export, Clear) work
- [ ] Payment env vars set (Paystack + FlutterWave) and a test purchase credits the account

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not received | Verify Resend SMTP is configured in Supabase Auth → Settings → SMTP |
| "Currency not supported by merchant" (Paystack) | Paystack accounts are country-locked; only Nigeria routes to Paystack — check `src/data/paymentCountries.ts` |
| Payment verified but credits missing | Check `SUPABASE_SERVICE_ROLE_KEY` and server logs for `/api/verify-payment` |
| AI Transform fails | Verify `VITE_AI_PROVIDER`, `VITE_OPENROUTER_API_KEY` (or `VITE_OPENAI_API_KEY`), and `VITE_AI_MODEL` in Vercel env vars |
| Nodes don't connect | Click and drag from the bottom handle (orange dot) to the top handle of another node |
| Canvas looks empty | Click any node in the sidebar palette to add it |
| CSS looks broken | Run `npm run build` and redeploy |

---

## 10. Project Structure Reference

```
n8n-dataset/
├── index.html                    # Entry HTML (Telegram SDK loaded — no-ops in browser)
├── vercel.json                   # SPA rewrites + serverless function config
├── api/                          # Vercel serverless functions
│   ├── _lib.js                   # Shared utilities (JWT signing, CORS)
│   ├── verify-payment.js         # Dual-provider payment verification (Paystack + FlutterWave)
│   ├── ai-completion.js          # AI proxy endpoint
│   └── transcribe.js             # Audio transcription endpoint
├── telegram-webhook-archive/     # Archived Telegram integration (README + restore checklist)
├── vite.config.ts
├── tailwind.config.js            # n8n brand colors + dark theme
├── postcss.config.js
├── public/
│   └── logo.png
├── src/
│   ├── main.tsx                  # React entry — single BrowserRouter
│   ├── App.tsx                   # Routes: / landing + /app/* gated shell (AppGate)
│   ├── index.css                 # Tailwind directives + component classes + ReactFlow overrides
│   ├── store/
│   │   ├── authStore.ts          # Zustand store (Supabase Auth session)
│   │   ├── creditStore.ts        # Zustand store (balance, transactions, per-user localStorage)
│   │   └── workflowStore.ts      # Zustand store (nodes, edges, pipeline, AI calls)
│   ├── lib/
│   │   └── supabase.ts           # Supabase client singleton
│   ├── data/
│   │   └── paymentCountries.ts   # 41-country provider map (Paystack NG / FlutterWave rest)
│   ├── utils/
│   │   ├── tma.ts                # Telegram WebApp helpers (all no-op in browser)
│   │   ├── credits.ts            # Plans, pricing, exchange rates
│   │   ├── flutterwave.ts        # FLW v3.js loader + tx refs
│   │   ├── ai.ts                 # OpenAI/OpenRouter API client
│   │   └── jsonl.ts              # JSONL validation, statistics, download
│   ├── components/
│   │   ├── landing/LandingPage.tsx   # Marketing home (/)
│   │   ├── auth/
│   │   │   ├── AuthScreen.tsx        # Email/password auth
│   │   │   └── VerifyEmailBanner.tsx # Recurring unverified-email reminder
│   │   ├── layout/
│   │   │   ├── GlobalLayout.tsx      # Sidebar + topbar shell (/app)
│   │   │   ├── GlobalSidebar.tsx     # Nav (Overview/Projects/History/Credits/Settings)
│   │   │   ├── Toolbar.tsx           # Run/Save/Export/Clear
│   │   │   └── Canvas.tsx            # ReactFlow canvas
│   │   ├── onboarding/OnboardingScreen.tsx
│   │   ├── credits/CreditTopUp.tsx   # Purchase flow (country → method → pay)
│   │   └── dataset/DatasetPreview.tsx
│   └── pages/
│       ├── OverviewPage.tsx / ProjectsPage.tsx / HistoryPage.tsx
│       ├── CreditsPage.tsx / SettingsPage.tsx
│       └── ProjectEditorPage.tsx     # /app/projects/:id
└── dist/                         # Production build output
```
