# n8n Dataset — Setup Guide

A Telegram Mini App for formatting, translating, and structuring data for LLM training.

---

## Prerequisites

- **Node.js** v18+ and **npm**
- A **Telegram Bot** (create one via [@BotFather](https://t.me/BotFather))
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

The app will run at `http://localhost:5173`. Open it in a browser to verify it loads.

---

## 2. Configure the Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Run `/newbot` and follow the prompts to create a bot.
3. Once created, run `/mybots`, select your bot, then **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Set the menu button text to "n8n Dataset" and URL to your deployed app URL (or `http://localhost:5173` for testing).
5. Alternatively, set the Mini App directly:
   - Run `/setmenubutton` in BotFather
   - Send your bot's name
   - Send the URL of your app
   - Send "n8n Dataset" as the button text

> **Note:** In development, Telegram cannot access `localhost`. Use a tunnel like [ngrok](https://ngrok.com): `ngrok http 5173` and use the generated `https://*.ngrok.io` URL in BotFather.

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

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/n8n-dataset.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Vercel auto-detects Vite — no config changes needed.
5. Click **Deploy**.
6. After deployment, Vercel gives you a URL like `https://n8n-dataset.vercel.app`.

### Environment Variables (Vercel)

After deployment, go to **Vercel Dashboard → Project → Settings → Environment Variables** and add:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `BOT_TOKEN` | Telegram bot token from [@BotFather](https://t.me/BotFather) — used for Telegram sign-in and bot webhook |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (Settings → API) — for server-side user management |

Redeploy after setting environment variables.

---

## 4. Deploy to Netlify (Alternative)

> **Note:** The `api/` serverless functions require Vercel's runtime. Netlify does not support them. Use Vercel if you need Telegram sign-in or bot webhook.

### Option A: Netlify CLI

```bash
# Build the project
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --dir=dist

# For production
netlify deploy --dir=dist --prod
```

### Option B: Netlify Dashboard (Manual)

1. Push your code to a repository (same steps as Vercel option B above).
2. Go to [netlify.com/new](https://netlify.com/new).
3. Import your repository.
4. Build settings (auto-detected):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**.
6. After deployment, Netlify gives you a URL like `https://n8n-dataset.netlify.app`.

---

## 5. Connect Your Domain to Telegram

After deploying, take your production URL (e.g. `https://n8n-dataset.vercel.app`) and configure it in BotFather:

1. Message [@BotFather](https://t.me/BotFather).
2. Run `/setmenubutton`.
3. Select your bot.
4. Send the full URL: `https://n8n-dataset.vercel.app`
5. Send the button text: `n8n Dataset`

Now open a chat with your bot and tap the menu button at the bottom — it opens your Mini App.

### Setup Bot Webhook (for Phone Number)

To receive phone numbers when users share them, configure the Telegram bot webhook:

```bash
# Replace <BOT_TOKEN> with your bot token and <URL> with your Vercel app URL
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<URL>/api/tg-bot-webhook"
```

Example:
```bash
curl -X POST "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook?url=https://n8n-dataset.vercel.app/api/tg-bot-webhook"
```

After this, when a user shares their phone number in the Mini App, Telegram will forward it to the webhook, which stores it in the Supabase `users` table.

---

## 6. Authentication

The app uses **Supabase email/password** as the primary authentication method, with **Telegram sign-in** as an extra option when opened inside the Telegram Mini App.

### Email / Password Flow (Primary)

1. User opens the app in any browser or Telegram
2. The Auth screen shows email/password sign-in and sign-up forms
3. On sign-up, a confirmation email with an **8-digit verification code** is sent (uses `onboarding@resend.dev` via Resend SMTP)
4. User enters the code to confirm their account
5. Once authenticated, the app loads normally

### Telegram Sign-In Flow (Extra Option)

1. Inside Telegram, the Auth screen shows a **"Sign in with Telegram"** button below the email form
2. Clicking it sends the user's Telegram identity to `/api/tg-auth`
3. The API verifies the Telegram init data and creates a corresponding user in Supabase Auth (or links to an existing one)
4. A Supabase session is returned — no email/password needed

### Database tables

- **`users`** — Links Telegram accounts to Supabase Auth: `id` (UUID PK), `supabase_user_id` (UUID FK → auth.users), `telegram_id` (BIGINT), `username`, `first_name`, `last_name`, `phone_number`
- **`workflows`** — User's saved workflows (keyed by Supabase `auth.uid()` UUID)
- **`history_items`** — User's pipeline execution history (keyed by Supabase `auth.uid()` UUID)

RLS policies use `auth.uid()` from the Supabase session to ensure users only access their own data.

### Bot Webhook for Phone Numbers

When a user shares their phone number via the Telegram Mini App, Telegram sends it to the bot as a service message. The webhook endpoint (`/api/tg-bot-webhook`) receives it and updates the `phone_number` field in the `users` table (matched by `telegram_id`).

---

## 7. Optional: Redirect Outside Telegram

To prevent non-Telegram access (e.g., shared links opened in browsers), set `VITE_REDIRECT_URL` in your Vercel env vars:

```bash
VITE_REDIRECT_URL=https://your-website.com
```

Two layers protect the app:

1. **Server-side (Vercel Edge Middleware)** — Checks for `tgWebAppData` query param on every request. If missing and `VITE_REDIRECT_URL` is set, sends a 301 redirect before any content loads.

2. **Client-side fallback (main.tsx)** — If middleware is bypassed (e.g., local dev), checks `window.Telegram.WebApp.initData` and redirects via JavaScript.

Leave `VITE_REDIRECT_URL` **empty** during local development so the app works in any browser. Static assets (`/assets/*`) are excluded from the middleware check.

---

## 8. Configure AI (Optional)

AI features are configured via environment variables — no settings UI needed in the app.

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `VITE_AI_PROVIDER` | `openrouter` or `openai` |
| `VITE_OPENROUTER_API_KEY` | Your OpenRouter API key (for OpenRouter provider) |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key (for OpenAI provider) |
| `VITE_AI_MODEL` | Model name e.g. `gpt-4o-mini`, `claude-3-haiku` |

Supported models:

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4o-mini`, `gpt-4o` |
| OpenRouter | `gpt-4o-mini`, `gpt-4o`, `claude-3-haiku`, `claude-3-sonnet` |

---

## 8. Production Checklist

- [ ] App loads in browser with email/password sign-in
- [ ] App loads inside Telegram with "Sign in with Telegram" option
- [ ] Email verification code is received and works
- [ ] Telegram sign-in creates/links to correct Supabase user
- [ ] Onboarding displays on first visit only
- [ ] Nodes can be added by clicking or dragging from the palette
- [ ] Workflow runs end-to-end (Input → Format → AI → Output)
- [ ] JSONL export downloads correctly
- [ ] Preview tab shows formatted entries
- [ ] Stats tab shows language/region/mechanic breakdown
- [ ] Sidebar closes on mobile
- [ ] Toolbar actions (Save, Export, Clear) work
- [ ] `BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` set in Vercel env vars
- [ ] `VITE_REDIRECT_URL` set if redirecting outside Telegram
- [ ] Bot webhook configured (for phone number)

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| App doesn't load in Telegram | Ensure URL uses **HTTPS** (required by Telegram) |
| "This bot can't access the URL" | Check Mini App URL in BotFather is correct |
| Email not received | Verify Resend SMTP is configured in Supabase Auth → Settings → SMTP |
| "Server misconfigured" on Telegram sign-in | Verify `BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel env vars |
| Phone number not stored | Run the `setWebhook` command and verify the webhook URL is reachable |
| AI Transform fails | Verify `VITE_AI_PROVIDER`, `VITE_OPENROUTER_API_KEY` (or `VITE_OPENAI_API_KEY`), and `VITE_AI_MODEL` in Vercel env vars |
| Nodes don't connect | Click and drag from the bottom handle (orange dot) to the top handle of another node |
| Canvas looks empty | Click any node in the sidebar palette to add it |
| CSS looks broken | Run `npm run build` and redeploy |

---

## 10. Project Structure Reference

```
n8n-dataset/
├── index.html              # Entry HTML (loads Telegram SDK)
├── middleware.ts           # Vercel Edge Middleware — redirect outside Telegram (optional)
├── api/
│   ├── _lib.ts             # Shared utilities (HMAC, user parsing, CORS)
│   ├── tg-auth.ts          # Telegram auth endpoint — exchange initData for Supabase session
│   └── tg-bot-webhook.ts   # Bot webhook — stores shared phone numbers
├── vite.config.ts          # Vite config (base: './')
├── tailwind.config.js      # n8n brand colors + dark theme
├── postcss.config.js       # PostCSS + Tailwind
├── package.json
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component (routing between onboarding + editor)
│   ├── index.css           # Tailwind directives + component classes + ReactFlow overrides
│   ├── store/
│   │   ├── authStore.ts    # Zustand store (Supabase Auth session)
│   │   └── workflowStore.ts # Zustand store (nodes, edges, pipeline, AI calls)
│   ├── lib/
│   │   └── supabase.ts     # Supabase client singleton
│   ├── utils/
│   │   ├── tma.ts          # Telegram Mini App SDK helpers
│   │   ├── ai.ts           # OpenAI/OpenRouter API client
│   │   └── jsonl.ts        # JSONL validation, statistics, download
│   └── components/
│       ├── auth/
│       │   └── AuthScreen.tsx  # Email/password auth + Telegram sign-in button
│       ├── layout/
│       │   ├── Sidebar.tsx        # Node palette + AI settings + history
│       │   ├── Toolbar.tsx        # Run/Save/Export/Clear
│       │   └── Canvas.tsx         # ReactFlow canvas
│       ├── nodes/
│       │   ├── NodePalette.tsx    # Draggable/clickable node list
│       │   ├── CustomNode.tsx     # Styled node renderer
│       │   └── ConfigPanel.tsx    # Right-side config panel
│       ├── onboarding/
│       │   └── OnboardingScreen.tsx
│       └── dataset/
│           └── DatasetPreview.tsx # Output preview + stats + raw
└── dist/                   # Production build output
```
