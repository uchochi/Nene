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

---

## 4. Deploy to Netlify

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

---

## 6. Configure AI (Optional)

To use the AI Transform node, add your API key in the app:

1. Open the app and click **Get Started**.
2. In the sidebar, scroll to **Settings**.
3. Enter your **OpenAI** (`sk-...`) or **OpenRouter** API key.
4. Select your preferred model.

Supported providers and models:

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4o-mini`, `gpt-4o` |
| OpenRouter | `gpt-4o-mini`, `gpt-4o`, `claude-3-haiku`, `claude-3-sonnet` |

> API keys are stored in **localStorage** on your device only.

---

## 7. Production Checklist

- [ ] App loads inside Telegram (test on iOS, Android, Desktop)
- [ ] Onboarding displays on first visit only
- [ ] Nodes can be added by clicking or dragging from the palette
- [ ] Workflow runs end-to-end (Input → Format → AI → Output)
- [ ] JSONL export downloads correctly
- [ ] Preview tab shows formatted entries
- [ ] Stats tab shows language/region/mechanic breakdown
- [ ] Sidebar closes on mobile
- [ ] Toolbar actions (Save, Export, Clear) work

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| App doesn't load in Telegram | Ensure URL uses **HTTPS** (required by Telegram) |
| "This bot can't access the URL" | Check Mini App URL in BotFather is correct |
| AI Transform fails | Verify your API key in sidebar Settings |
| Nodes don't connect | Click and drag from the bottom handle (orange dot) to the top handle of another node |
| Canvas looks empty | Click any node in the sidebar palette to add it |
| CSS looks broken | Run `npm run build` and redeploy |

---

## 9. Project Structure Reference

```
n8n-dataset/
├── index.html              # Entry HTML (loads Telegram SDK)
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
│   │   └── workflowStore.ts # Zustand store (nodes, edges, pipeline, AI calls)
│   ├── utils/
│   │   ├── tma.ts          # Telegram Mini App SDK helpers
│   │   ├── ai.ts           # OpenAI/OpenRouter API client
│   │   └── jsonl.ts        # JSONL validation, statistics, download
│   └── components/
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
