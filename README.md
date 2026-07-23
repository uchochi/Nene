# n8n Dataset


A Telegram Mini App for formatting, translating, and structuring data for LLM training — inspired by [n8n.io](https://n8n.io).

Build visual data-processing pipelines using a drag-and-drop node editor. Transform raw content into industry-standard JSONL datasets with rich metadata for fine-tuning AI models.

---

## Features


- **Visual workflow editor** — Drag-and-drop node canvas (ReactFlow), styled like n8n
- **7 node types** — Input, Format, Tag, Group, Translate, AI Transform, Output
- **JSONL export** — Industry-standard format with `id`, `language_code`, `region`, `humor_mechanics`, `cultural_context`, `explanation_for_ai`
- **AI-powered analysis** — Chain-of-Thought prompting via OpenAI/OpenRouter
- **Multi-language translation** — Preserve humor mechanics across languages
- **Dataset statistics** — Breakdown by language, region, humor mechanic
- **Telegram Mini App** — Full TMA SDK integration (MainButton, haptics, theming)
- **Onboarding** — First-visit intro screen
- **Paystack checkout** — Multi-step payment selection with country-aware methods

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 |
| Canvas | ReactFlow |
| State | Zustand |
| Payments | @paystack/inline-js |
| Icons | Lucide React |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser. The onboarding screen appears on first visit.

---

## Project Structure

```
src/
├── main.tsx                          # Entry point
├── App.tsx                           # Root: onboarding / workflow editor routing
├── index.css                         # Tailwind + n8n theme + ReactFlow overrides
│
├── store/
│   └── workflowStore.ts              # Zustand: nodes, edges, pipeline, AI, history
│
├── utils/
│   ├── tma.ts                        # Telegram Mini App SDK helpers
│   ├── ai.ts                         # OpenAI / OpenRouter API client
│   └── jsonl.ts                      # JSONL validation, stats, download
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Node palette + AI settings + history
│   │   ├── Toolbar.tsx               # Run / Save / Export / Clear
│   │   └── Canvas.tsx                # ReactFlow canvas (drag & drop)
│   ├── nodes/
│   │   ├── NodePalette.tsx           # Draggable node list
│   │   ├── CustomNode.tsx            # Styled node renderer
│   │   └── ConfigPanel.tsx           # Right-side config panel
│   ├── onboarding/
│   │   └── OnboardingScreen.tsx      # First-visit intro
│   ├── dataset/
│   │   └── DatasetPreview.tsx        # Output preview + stats + raw tabs
│   └── checkout/
│       └── PaystackCheckout.tsx      # Multi-step payment component
```

---

## Paystack Checkout Component

A self-contained, multi-step payment selection UI that bypasses Paystack's default method selector.

### Usage

```tsx
import { PaystackCheckout } from './components/checkout/PaystackCheckout'

function PaymentPage() {
  return (
    <PaystackCheckout
      config={{
        publicKey: 'pk_test_xxxxxxxxxxxx',
        email: 'customer@example.com',
        amount: 500000,               // 5000.00 in the currency's lowest unit
        currency: 'NGN',
        firstName: 'John',
        lastName: 'Doe',
      }}
      onSuccess={async (reference) => {
        await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        })
      }}
      onClose={() => {
        console.log('User closed the payment iframe')
      }}
    />
  )
}
```

### How It Works

**Step 1 — Country selection** — User picks from 24 major countries across Africa, Europe, North America, South America, and Asia. A quick-search input and scrollable list are provided.

**Step 2 — Payment method** — Dynamically computed per country:

| Country | Options |
|---------|---------|
| Nigeria (NG) | "Pay with Credit/Debit Card" + "Pay with Bank Transfer (PwT)" |
| All others | "Pay with Credit/Debit Card" (single option) |

**Payment launch** — Each button calls `PaystackPop.checkout()` directly with `channels: ['card']` or `channels: ['bank_transfer']`, bypassing Paystack's default method selector.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config.publicKey` | `string` | Yes | Paystack publishable key |
| `config.email` | `string` | Yes | Customer email |
| `config.amount` | `number` | Yes | Amount in lowest currency unit (e.g. 50000 = 500.00) |
| `config.currency` | `string` | No | Override currency (defaults to the selected country's currency) |
| `config.firstName` | `string` | No | Customer first name |
| `config.lastName` | `string` | No | Customer last name |
| `config.phone` | `string` | No | Customer phone |
| `config.metadata` | `object` | No | Extra data sent with the transaction |
| `onSuccess` | `(ref: string) => Promise<void>` | No | Called after payment + backend verification. Default: POSTs to `/api/verify-payment`. |
| `onClose` | `() => void` | No | Called when user closes the Paystack iframe without completing |

### Security Notes

- Only the **public key** is used on the frontend
- `onSuccess` triggers a backend verification call — never trust the client alone
- All sensitive logic (transaction initialization, verification) belongs server-side

---

## Available Scripts

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

---

## Deployment

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step instructions covering:

- Telegram Bot configuration via @BotFather
- Vercel deployment (CLI + dashboard)
- Netlify deployment (CLI + dashboard)
- Custom domain setup
- Production checklist

---

## Brand

This project uses n8n's visual design language:

- **Primary red:** `#ff0c00`
- **Orange accent:** `#ff6421`
- **Dark theme:** `#080808` → `#1b1728` backgrounds
- **Typography:** Inter (UI) + JetBrains Mono (code)

---

## License

MIT
