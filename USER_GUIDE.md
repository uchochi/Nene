# ooguy — User Guide

Turn raw text, images, and audio into clean training data for AI models. This guide shows you how, step by step. No technical background needed.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [The Editor in 30 Seconds](#2-the-editor-in-30-seconds)
3. [The 7 Nodes, In Order](#3-the-7-nodes-in-order)
4. [Example 1: Turn Jokes Into a Dataset](#4-example-1-turn-jokes-into-a-dataset)
5. [Example 2: Get Text Out of an Image](#5-example-2-get-text-out-of-an-image)
6. [Example 3: Translate Into Other Languages](#6-example-3-translate-into-other-languages)
7. [Example 4: The Full Pipeline](#7-example-4-the-full-pipeline)
8. [Exporting Your Dataset](#8-exporting-your-dataset)
9. [Credits & Pricing](#9-credits--pricing)
10. [What the Output Means](#10-what-the-output-means)
11. [Tips That Save You Money and Time](#11-tips-that-save-you-money-and-time)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Getting Started

1. Open the website. You'll land on the home page.
2. Click **Get Started Free**.
3. Create an account with your email and a password.
4. Enter the 8-digit code we email you (check your spam folder if it doesn't arrive within a few minutes).
5. Done — the first-time tour will walk you through the basics.

AI features are built in. There's nothing to configure or plug in.

---

## 2. The Editor in 30 Seconds

The editor has three areas:

```
┌─────────────────────────────────────────────────────┐
│  Toolbar: Workflow Name  [Run] [Save] [Export] [🗑] │
├────────┬────────────────────────────┬───────────────┤
│        │                            │               │
│ Sidebar│      Canvas                │ Config Panel  │
│ (nodes)│   (your workflow lives     │ (opens when   │
│        │    here)                   │  you click a  │
│        │                            │  node)        │
└────────┴────────────────────────────┴───────────────┘
```

Every workflow is the same three moves:

1. **Add** — click a node in the sidebar to place it on the canvas
2. **Connect** — drag from the dot under one node to the dot above the next
3. **Run** — hit **Run Workflow** in the toolbar

Click any node to open its settings on the right. That's the whole app.

---

## 3. The 7 Nodes, In Order

The sidebar lists nodes in the order you'd normally connect them:

```
1 · INPUT
   📥 Input              Paste text, or upload images, audio, video, PDFs

2 · STRUCTURE & ENRICH
   🔧 Format             Splits your text into numbered entries
   🤖 AI Transform       AI reads each entry and adds a summary, topics, sentiment

3 · ORGANIZE
   🏷️ Tag & Categorize   Adds tags to each entry
   📂 Group              Adds a group label (e.g., by language)

4 · EXPAND
   🌐 Translate          Duplicates entries into other languages

5 · OUTPUT
   📤 Output             Exports everything as JSONL, JSON, or CSV
```

**Why this order?** The AI should read your content before tagging it (better tags), and translation should happen last (translate the finished version once, not every step along the way).

You don't need all 7. A minimal workflow is just **Input → Format → Output**.

---

## 4. Example 1: Turn Jokes Into a Dataset

*Goal: paste plain text, get structured training data. Takes 2 minutes.*

### Step 1 — Add an Input node

Click **Input** in the sidebar. Click the node on the canvas, then paste this into **Content**:

```
Why don't scientists trust atoms? Because they make up everything!
What do you call a fish with no eyes? A fsh.
I told my wife she was drawing her eyebrows too high. She looked surprised.
```

Set **Content Type** to `Plain Text`.

### Step 2 — Add a Format node

Click **Format** in the sidebar. Connect **Input → Format** (drag from the dot under Input to the dot above Format).

Click the Format node and set:
- **Output Format:** `JSONL`
- **Include Metadata:** ✓

### Step 3 — Add an Output node

Click **Output** in the sidebar. Connect **Format → Output**.

### Step 4 — Run

Click **Run Workflow**. You'll get one structured entry per line:

```jsonl
{"id":"item_001","raw_content":"Why don't scientists trust atoms? Because they make up everything!","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
{"id":"item_002","raw_content":"What do you call a fish with no eyes? A fsh.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
{"id":"item_003","raw_content":"I told my wife she was drawing her eyebrows too high. She looked surprised.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
```

**What happened:** Format split your text into one entry per line, gave each an ID, and wrapped them in the schema. Click **Export** to get the file (see section 8).

---

## 5. Example 2: Get Text Out of an Image

*Goal: upload an image, let AI describe and analyze it.*

### Step 1 — Upload

Add an **Input** node and click it. Scroll to **Media Upload** and drop in an image (PNG, JPEG, WebP, or GIF, up to 50MB).

Tick the AI options you want:

- **OCR — Extract Text** ✓ reads any text in the image
- **Caption — Image Description** ✓ writes a description of the image
- **Vision AI — Structured Analysis** ✓ produces a detailed JSON analysis

### Step 2 — Build the pipeline

```
[Input] → [Format] → [AI Transform] → [Output]
```

Leave all settings at their defaults.

### Step 3 — Run

Click **Run Workflow**. Example output:

```jsonl
{
  "id":"item_001",
  "filename":"meme.png",
  "extracted_text":"This is fine",
  "image_description":"A dog sitting in a room on fire with a calm expression",
  "explanation_for_ai":"{\"summary\":\"A dark humor meme showing acceptance in chaos\",\"key_topics\":[\"dark humor\",\"resilience\"],\"sentiment\":\"ironic\"}",
  "ai_processed":true
}
```

**Good to know:** uploaded files are temporary — they're deleted when you close the app. If you reload a saved workflow, the Input node will say "Re-upload required". Your workflow and results are safe; just upload the file again.

Audio works the same way (transcription) — upload an audio or video file instead of an image.

---

## 6. Example 3: Translate Into Other Languages

*Goal: take one entry and produce versions in Spanish, French, German, and Japanese.*

### Step 1 — Build the pipeline

```
[Input] → [Format] → [Translate] → [Output]
```

### Step 2 — Configure

**Input** — paste your text:

```
Why did the scarecrow win an award? Because he was outstanding in his field!
```

**Translate** — click the node and set:
- **Target Languages:** `es, fr, de, ja` (comma-separated language codes)
- **Preserve humor mechanics:** ✓ (adapts puns so they're actually funny in the target language, instead of translating them word-for-word)

### Step 3 — Run

Each entry is duplicated once per language:

```jsonl
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"es","translated":true,"original_language":"unknown"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"fr","translated":true,"original_language":"unknown"}
```

---

## 7. Example 4: The Full Pipeline

*Goal: use every node at once.*

### The pipeline

```
[Input] → [Format] → [AI Transform] → [Tag & Categorize] → [Group] → [Translate] → [Output]
```

### Input

Set **Content Type** to `Plain Text` and paste:

```
Type: Joke
Language: en
Why did the bicycle fall over? Because it was two-tired!

Type: Joke
Language: en
Parallel lines have so much in common. It's a shame they'll never meet.

Type: Joke
Language: es
¿Qué hace una abeja en el gimnasio? ¡Zum-ba!

Type: Joke
Language: fr
Pourquoi les plongeurs plongent-ils toujours en arrière ?
Parce que sinon ils tombent dans le bateau.
```

### The other nodes (click each one)

- **Format** — Output Format: `JSONL`, Include Metadata: ✓
- **AI Transform** — leave the custom prompt empty; the default adapts to any content
- **Tag & Categorize** — Categories: `humor, wordplay, pun`, Auto-tag: ✓ (AI makes the tags; turn it off for a fast keyword-based pass)
- **Group** — Group By: `language`
- **Translate** — Target Languages: `pt, it`, Preserve humor mechanics: ✓
- **Output** — Export Format: `JSONL`

### Run

Click **Run Workflow**. Follow the data:

1. **After Format** — 4 structured entries
2. **After AI Transform** — each gets an `explanation_for_ai` field (summary, topics, sentiment)
3. **After Tag** — each gets `tags` and `categories`
4. **After Group** — each gets a `group` field (`en`, `es`, `fr`)
5. **After Translate** — each entry becomes 3 (original + Portuguese + Italian) → 12 total
6. **Output** — all 12 exported as JSONL

---

## 8. Exporting Your Dataset

1. Click **Export** in the toolbar.
2. A modal shows your filename and a download link.
3. Click **Open & Export** — this deducts **1 credit**, saves the export to your History, and downloads the file.

You can also **Copy** the link or **Share** it.

### Using the file

The JSONL works directly with fine-tuning tools:

```bash
# OpenAI fine-tuning
openai api fine_tunes.create -t my_dataset.jsonl -m gpt-3.5-turbo
```

```python
# Hugging Face
from datasets import load_dataset
dataset = load_dataset('json', data_files='my_dataset.jsonl')
```

```bash
# Quick check: count entries and preview the first one
wc -l my_dataset.jsonl
head -1 my_dataset.jsonl | jq .
```

---

## 9. Credits & Pricing

### How billing works

You buy **credits**. Running a workflow consumes AI tokens, and tokens are converted to credits:

> **1 credit = 100 tokens** · 10,000 credits = 1M tokens

At the end of each run, the exact number of tokens the AI used is converted and deducted. A short workflow costs cents; a huge batch costs more. You only pay for what you process.

Exporting a file costs a flat **1 credit** (no AI runs during export).

### Plans

| Plan | Credits | Tokens | Price |
|------|---------|--------|-------|
| Starter | 10,000 | 1M | $10 |
| Pro | 20,000 | 2M | $20 |
| Business | 40,000 | 4M | $40 |

**First purchase? Use coupon `new2026set` at checkout for 75% off.** (New accounts only — one use.)

### Paying

On the Credits page, pick a plan, pick your country, and pay:
- **Nigeria** — Naira via Paystack (card or bank transfer)
- **Everywhere else** — your local currency (African countries) or USD (international) via FlutterWave

### Rough token costs

| Operation | Approx. tokens |
|-----------|----------------|
| AI Transform (per entry) | ~500–2000 |
| Translate (per entry, per language) | ~300–1000 |
| Auto-tagging (per entry) | ~200–500 |
| Image AI — OCR/caption/vision (per image) | ~500–1500 |
| Audio transcription (per file) | ~1000–5000 |

Your balance is always visible in the top bar and on the Credits page.

---

## 10. What the Output Means

Every line in your JSONL is one entry. Fields are added as your data flows through nodes:

| Field | Added by | Meaning |
|-------|----------|---------|
| `id` | Format | Unique entry ID (`item_001`…) |
| `raw_content` | Format | The original text |
| `language_code` | Format / Translate | Language (`en`, `es`, `fr`…) |
| `extracted_text` | Input (OCR) | Text read from an image |
| `transcript` | Input | Text transcribed from audio |
| `image_description` | Input (Caption) | AI description of an image |
| `explanation_for_ai` | AI Transform / Vision AI | AI analysis — summary, key topics, sentiment |
| `tags` | Tag | Content tags |
| `categories` | Tag | The categories you set in Tag config |
| `group` | Group | Group label (e.g., the language) |
| `translated` | Translate | `true` if this entry was translated |
| `original_language` | Translate | Language before translation |
| `ai_processed` / `categorized` / `grouped` | — | Flags showing which nodes ran |

A maximally enriched entry looks like:

```json
{
  "id": "item_001",
  "raw_content": "Why don't scientists trust atoms? Because they make up everything!",
  "explanation_for_ai": "{\"summary\":\"A pun about atoms\",\"key_topics\":[\"pun\",\"science\"],\"sentiment\":\"playful\"}",
  "tags": ["humor", "science", "pun"],
  "categories": ["humor", "wordplay"],
  "group": "en",
  "ai_processed": true,
  "categorized": true,
  "grouped": true
}
```

---

## 11. Tips That Save You Money and Time

**Quality**
- Aim for 100+ entries per language — small mixed datasets train poorly
- Run **AI Transform before Tag** — tags are much better when the AI has analyzed the content first
- **Translate last** — translating the finished entry once is cheaper than translating at every step

**Workflow habits**
- Click **Save** before you leave — workflows live in the database, unsaved changes don't
- Give workflows descriptive names (click the name in the toolbar)
- Check the **Preview** tab before exporting to catch formatting issues
- Every export is logged under **History**

**Media**
- Media files are temporary — when you reload a saved workflow, re-upload them (the node will remind you)
- Only the *extracted text and analysis* go into your dataset — the files themselves aren't embedded

**Money**
- Test a small batch first, check the token cost, then run the full dataset
- Keep auto-tag OFF while experimenting — the keyword pass is free

---

## 12. Troubleshooting

| Problem | Fix |
|---------|-----|
| Nothing happens when I run | Nodes must be **connected** — drag from the bottom dot of one to the top dot of the next |
| Output is empty | The Input node has no content — paste text or upload a file |
| Translate did nothing | Enter language codes separated by commas: `es, fr, de` |
| Preview says "Invalid JSON" | Your input probably has broken formatting — check the Input node content |
| Media upload fails | Sign in first; check the file type (image/audio/video/PDF) and size (max 50MB) |
| Node says "Re-upload required" | Media is temporary — upload the file again |
| My workflow disappeared | It only saves when you click **Save** — check the Projects page for saved ones |
| Tags look generic | Turn ON "Auto-tag content", or add your own keywords in Tag config |
| Email code never arrives | Wait a few minutes, check spam, then use the "resend" link in the yellow banner |
| Payment failed | Check your card details; Nigeria pays in Naira, other countries pay via FlutterWave |

---

## Ready-Made Practice Dataset

Paste this into an **Input** node and run **Input → Format → AI Transform → Tag → Output**:

```
Why did the math book look so sad? Because it had too many problems.
What do you call a fake noodle? An impasta.
I used to play piano by ear, but now I use my hands.
Why don't skeletons fight each other? They don't have the guts.
How does a penguin build its house? Igloos it together!
I told my computer I needed a break. Now it won't stop sending me vacation ads.
Why did the coffee file a police report? It got mugged.
What's orange and sounds like a parrot? A carrot.
I'm reading a book on anti-gravity. It's impossible to put down.
Why did the scarecrow become a successful politician? He was outstanding in his field.
```

You'll get 10 fully analyzed, tagged training entries — a complete dataset in under a minute.
