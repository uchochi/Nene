# n8n Dataset — User Guide

A step-by-step walkthrough for building data pipelines, formatting LLM training datasets, and exporting JSONL — with support for text and media files (images, audio, video, PDF).

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [The Node Palette](#2-the-node-palette)
3. [Example 1: Format Jokes for Humor Training](#3-example-1-format-jokes-for-humor-training)
4. [Example 2: Process an Image with AI](#4-example-2-process-an-image-with-ai)
5. [Example 3: Translate & Localize a Dataset](#5-example-3-translate--localize-a-dataset)
6. [Example 4: Full Pipeline — Every Node in Action](#6-example-4-full-pipeline--every-node-in-action)
7. [Exporting & Using Your Dataset](#7-exporting--using-your-dataset)
8. [Understanding the Output](#8-understanding-the-output)
9. [Tips & Best Practices](#9-tips--best-practices)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Quick Start

Open the app. On your first visit you will see the **onboarding screen** — click **Get Started** to enter the workflow editor.

The editor has three main areas:

```
┌─────────────────────────────────────────────────────┐
│  Toolbar: Workflow Name  [Run] [Save] [Export] [🗑] │
├────────┬────────────────────────────┬───────────────┤
│        │                            │               │
│ Sidebar│     Canvas                 │ Config Panel  │
│ (Nodes)│     (drag & drop here)     │ (appears when │
│        │                            │  you click a  │
│        │                            │  node)        │
│        │                            │               │
└────────┴────────────────────────────┴───────────────┘
```

**To build a workflow:**
1. Click a node in the **sidebar** to add it to the canvas (or drag it)
2. **Click a node** on the canvas to open its configuration panel on the right
3. **Connect nodes** by dragging from the orange dot on the bottom of one node to the orange dot on the top of another
4. Click **Run Workflow** in the toolbar to execute

---

## 2. The Node Palette

Nodes appear in the order they should be connected, organized into 5 pipeline phases:

```
1 · INPUT
  📥 Input              Text, JSON, CSV, or media files

2 · STRUCTURE & ENRICH
  🔧 Format            Structure raw text into items
  🤖 AI Transform      AI analyzes & enriches content

3 · ORGANIZE
  🏷️ Tag & Categorize  Add tags based on content
  📂 Group             Group items by field

4 · EXPAND
  🌐 Translate         Translate to target languages

5 · OUTPUT
  📤 Output            Export as JSONL / JSON / CSV
```

**Why this order?**
- **Input** — data enters here (text or media)
- **Format** — structures data into items with IDs
- **AI Transform** — enriches items with analysis. Runs early so Tag and Group can use the AI's output.
- **Tag** — adds tags using both original content AND AI analysis (for better results)
- **Group** — organizes by language, tags, or other fields
- **Translate** — translates the final enriched content once (not intermediate steps)
- **Output** — exports to your chosen format

---

## 3. Example 1: Format Jokes for Humor Training

Let's turn raw joke text into structured JSONL entries.

### Step 1: Add an Input Node

Click **Input** in the sidebar (green icon). A green input node appears on the canvas. Click it to open the config panel.

Paste this content into the **Content** textarea:

```
Why don't scientists trust atoms? Because they make up everything!
What do you call a fish with no eyes? A fsh.
I told my wife she was drawing her eyebrows too high. She looked surprised.
```

Set **Content Type** to `Plain Text`.

### Step 2: Add a Format Node

Click **Format** in the sidebar (blue icon). A blue node appears. Connect the **Input** node (drag from its bottom dot) to the **Format** node (drop on its top dot).

Click the Format node to configure it:
- **Output Format:** `JSONL`
- **Include Metadata:** ✓ checked

### Step 3: Add an Output Node

Click **Output** in the sidebar (red icon). A red node appears. Connect **Format** → **Output**.

Click the Output node:
- **Export Format:** `JSONL`

### Step 4: Run the Workflow

Click **Run Workflow** in the toolbar. The bottom panel will show the result:

```jsonl
{"id":"item_001","raw_content":"Why don't scientists trust atoms? Because they make up everything!","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
{"id":"item_002","raw_content":"What do you call a fish with no eyes? A fsh.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
{"id":"item_003","raw_content":"I told my wife she was drawing her eyebrows too high. She looked surprised.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-08-12T12:00:00.000Z","source":"user_input"}
```

Click **Export** to copy the download link. Open it in your system browser to download the file.

> **What happened?** The Format node split your text by lines, assigned each an ID, and wrapped them in the JSONL schema. The Output node rendered them as line-delimited JSON.

---

## 4. Example 2: Process an Image with AI

This requires an **OpenRouter API key**. Add it in the sidebar under **Settings → AI API Key**.

### Step 1: Add an Input Node and Upload Media

Click **Input** in the sidebar. Click it to open the config panel.

Scroll to the **Media Upload** section and click or drag an image file (PNG, JPEG, WebP, or GIF, up to 50MB).

Once uploaded, enable AI processing:
- **OCR — Extract Text:** ✓ (extracts text from the image)
- **Caption — Image Description:** ✓ (generates a visual description)
- **Vision AI — Structured Analysis:** ✓ (produces a detailed JSON analysis)

### Step 2: Add and Connect Nodes

```
[Input] → [Format] → [AI Transform] → [Output]
```

### Step 3: Configure Format

- **Output Format:** `JSONL`
- **Include Metadata:** ✓

### Step 4: Configure AI Transform

- **Custom Prompt:** Leave empty for default (content-agnostic analysis)

### Step 5: Run

Click **Run Workflow**. The pipeline will:
1. Extract text via OCR (if enabled)
2. Generate a caption describing the image
3. Run Vision AI for structured analysis
4. Pass all enriched data through Format and AI Transform

**Output example:**

```jsonl
{
  "id":"item_001",
  "filename":"meme.png",
  "extracted_text":"This is fine",
  "image_description":"A dog sitting in a room on fire with a calm expression",
  "explanation_for_ai":"{\"summary\":\"A dark humor meme showing acceptance in chaos\",\"key_topics\":[\"dark humor\",\"resilience\",\"internet culture\"],\"sentiment\":\"ironic\",\"visual_elements\":[\"dog in fire\",\"calm expression\",\"office setting\"]}",
  "ai_processed":true
}
```

> **Note:** Media files are **ephemeral** — they're stored in a temporary session-scoped bucket and deleted when you close the app. When you reload a saved workflow, the Input node will show "Re-upload required" and you'll need to upload the file again. The workflow itself persists.

---

## 5. Example 3: Translate & Localize a Dataset

Let's take a single joke and expand it across multiple languages.

### Step 1: Build the pipeline

Add and connect nodes in this order:

```
[Input] → [Format] → [Translate] → [Output]
```

### Step 2: Configure Input

Paste this content:

```
Why did the scarecrow win an award? Because he was outstanding in his field!
```

### Step 3: Configure Format

- **Output Format:** `JSONL`
- **Include Metadata:** ✓

### Step 4: Configure Translate

Click the **Translate** node (teal icon). Set:

- **Target Languages:** `es, fr, de, ja`
- **Preserve humor mechanics:** ✓

### Step 5: Run

Click **Run Workflow**. Each entry gets duplicated per language:

```jsonl
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"es","translated":true,"original_language":"unknown"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"fr","translated":true,"original_language":"unknown"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"de","translated":true,"original_language":"unknown"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"ja","translated":true,"original_language":"unknown"}
```

> **What happened?** The Translate node sent each entry to the AI with the target language and the "preserve humor mechanics" flag. The AI adapted the "outstanding in his field" pun to work natively in each language, then returned the translated `raw_content`.

---

## 6. Example 4: Full Pipeline — Every Node in Action

This example uses all 7 node types in a single workflow.

### The Pipeline

```
[Input] → [Format] → [AI Transform] → [Tag & Categorize] → [Group] → [Translate] → [Output]
```

### Step 1: Configure Input Node

Click the green **Input** node. In the config panel:

- **Content Type:** `Plain Text`
- **Content:** Paste this multilingual dataset:

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

### Step 2: Configure Format Node

Click the blue **Format** node:

- **Output Format:** `JSONL`
- **Include Metadata:** ✓ checked

### Step 3: Configure AI Transform Node

Click the pink **AI Transform** node:

- **Custom Prompt:** Leave empty (default analyzes content and returns fields like `summary`, `key_topics`, `sentiment`)

> **Note:** AI Transform now uses a content-agnostic prompt that adapts to whatever content it receives. It no longer assumes humor.

### Step 4: Configure Tag & Categorize Node

Click the orange **Tag & Categorize** node:

- **Categories:** `humor, wordplay, pun`
- **Auto-tag content:** ✓ checked

When auto-tag is ON, the AI analyzes each item's content (including AI-generated fields) to generate intelligent tags. When OFF, it uses a keyword dictionary with 14 categories.

### Step 5: Configure Group Node

Click the purple **Group** node:

- **Group By:** `language`

This adds a `group` field to each item with the value of the `language_code` (or first tag if no language code). The data stays flat — downstream nodes work on individual items, not nested groups.

### Step 6: Configure Translate Node

Click the teal **Translate** node:

- **Target Languages:** `pt, it`
- **Preserve humor mechanics:** ✓

### Step 7: Configure Output Node

Click the red **Output** node:

- **Export Format:** `JSONL`

### Step 8: Run the Workflow

Click **Run Workflow** in the toolbar.

**Data flow through the pipeline:**

1. **After Format:** 4 structured items with IDs
2. **After AI Transform:** Each item gets an `explanation_for_ai` field with summary, key_topics, sentiment
3. **After Tag:** Each item gets `tags` (AI-generated) and `categories` (from config)
4. **After Group:** Each item gets a `group` field (e.g., "en", "es", "fr")
5. **After Translate:** Each item expands to 3 variants (original + pt + it) → 12 total entries
6. **After Output:** Exported as JSONL

### Step 9: Export

Click **Export** in the toolbar. The modal shows the download link — share or open it to download `my_workflow_dataset.jsonl` with 12 fully enriched entries.

---

## 7. Exporting & Using Your Dataset

### Exporting Your Dataset

Click **Export** in the toolbar. A modal appears with the filename and a download link.

- **Copy** — Copies the download link to your clipboard
- **Share** — Shares the link via Web Share API or Telegram (inside TMA)
- **Open & Export** — Deducts credits, logs the export to history, and opens the link in your system browser

Since Telegram Mini Apps cannot trigger file downloads directly, the link opens a **download bridge** page in your system browser. The file downloads automatically on that page.

> **Note:** The export costs 1 credit and is recorded in the sidebar History section.

### Using the Dataset for Fine-Tuning

The exported JSONL file is ready for:

**OpenAI Fine-Tuning:**
```bash
openai api fine_tunes.create \
  -t my_dataset.jsonl \
  -m gpt-3.5-turbo
```

**Hugging Face:**
```python
from datasets import load_dataset

dataset = load_dataset('json', data_files='my_dataset.jsonl')
```

**Manual inspection:**
```bash
# Count entries
wc -l my_dataset.jsonl

# Preview first entry
head -1 my_dataset.jsonl | jq .
```

### Media Files in Exports

If your pipeline includes media processing (OCR, transcription, captioning, Vision AI), the output includes the media-derived fields:

- `extracted_text` — text from images (OCR)
- `transcript` — text from audio (transcription)
- `image_description` — visual description (caption)
- `explanation_for_ai` — structured analysis (Vision AI or AI Transform)

The media files themselves are not embedded in the JSONL — they're ephemeral and deleted after the session. Only the extracted text and analysis persist in the dataset.

---

## 8. Understanding the Output

### Basic Text Dataset

Each JSONL line follows this schema:

```json
{
  "id": "item_001",
  "raw_content": "Why don't scientists trust atoms? Because they make up everything!",
  "language_code": "unknown",
  "region": "unknown",
  "format": "text",
  "timestamp": "2026-08-12T12:00:00.000Z",
  "source": "user_input"
}
```

### After AI Transform

```json
{
  "id": "item_001",
  "raw_content": "Why don't scientists trust atoms? Because they make up everything!",
  "explanation_for_ai": "{\"summary\":\"A pun-based joke about scientific concepts\",\"key_topics\":[\"pun\",\"science\",\"atoms\",\"humor\"],\"sentiment\":\"playful\"}",
  "ai_processed": true
}
```

### After Tag

```json
{
  "id": "item_001",
  "raw_content": "...",
  "tags": ["humor", "science", "pun"],
  "categories": ["humor", "wordplay"],
  "categorized": true
}
```

### After Group

```json
{
  "id": "item_001",
  "raw_content": "...",
  "group": "en",
  "grouped": true
}
```

### After Translate

```json
{
  "id": "item_001",
  "raw_content": "¿Por qué no confían los científicos en los átomos? ¡Porque inventan todo!",
  "language_code": "es",
  "translated": true,
  "original_language": "unknown"
}
```

### Media Processing Dataset

```json
{
  "id": "item_001",
  "filename": "meme.png",
  "extracted_text": "This is fine",
  "image_description": "A dog sitting in a room on fire with a calm expression",
  "explanation_for_ai": "{\"summary\":\"Dark humor meme\",\"key_topics\":[\"acceptance\",\"irony\"],\"sentiment\":\"ironic\"}",
  "ai_processed": true
}
```

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier for each entry |
| `raw_content` | The original input text |
| `extracted_text` | Text extracted from images (OCR) |
| `transcript` | Text transcribed from audio |
| `image_description` | Visual description of images |
| `explanation_for_ai` | AI-generated analysis (summary, topics, sentiment, etc.) |
| `language_code` | ISO language code (en, es, fr, ja, etc.) |
| `region` | Geographic region for cultural context |
| `format` | Content format (text, json, csv) |
| `tags` | AI-generated or keyword-based tags |
| `categories` | Manual categories from Tag node config |
| `group` | Group key from Group node (e.g., language, category) |
| `translated` | Boolean — whether translation was applied |
| `original_language` | Source language before translation |
| `ai_processed` | Boolean — whether AI Transform ran |
| `categorized` | Boolean — whether Tag ran |
| `grouped` | Boolean — whether Group ran |

---

## 9. Tips & Best Practices

### Dataset Quality

| Do | Don't |
|----|-------|
| Include 100+ entries per language | Mix languages without tagging them |
| Vary content types across entries | Translate puns literally without "Preserve humor mechanics" |
| Use AI Transform for enrichment | Rely on raw text alone |
| Use media processing for visual/audio content | Forget to re-upload media when loading saved workflows |
| Group by language for balanced datasets | Group by too many fine-grained fields |

### Workflow Tips

- **Save frequently** — Click Save in the toolbar to persist your workflow to the database
- **Use descriptive names** — Rename your workflow in the toolbar for easy identification
- **Preview before exporting** — Check the Preview tab to spot formatting issues
- **History tracking** — Every export is logged in the sidebar History section
- **Media is ephemeral** — When loading a saved workflow, re-upload any media files (they show "Re-upload required")
- **Use the correct node order** — Follow the palette's 1-5 flow for best results

### Recommended Pipelines

**Text-only pipeline:**
```
Input → Format → AI Transform → Tag → Group → Translate → Output
```

**Media pipeline (single image):**
```
Input (with media + OCR/Caption/Vision AI) → Format → Output
```

**Media pipeline (batch processing):**
```
Input → Format → AI Transform → Tag → Group → Translate → Output
```

### Processing Order Matters

- **AI Transform before Tag** — Tagging benefits from AI-enriched content (better tags)
- **Group after Tag** — Grouping works best when items have tags
- **Translate late** — Translate the final enriched content once, not after every step

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| No output after running | Make sure nodes are **connected** (orange dots linked) |
| AI Transform fails | Check your API key in sidebar Settings |
| Output is empty JSONL | Input node needs content — paste some text or upload media |
| Translate adds no languages | Enter comma-separated ISO codes: `es, fr, de` |
| Preview shows "Invalid JSON" | The Format node may have produced malformed output — check your input |
| Media upload fails | Make sure you're signed in and the file is a supported type (image/audio/video/PDF, max 50MB) |
| Media shows "Re-upload required" | Media files are ephemeral — upload the file again when loading saved workflows |
| Workflow lost after refresh | Click **Save** before leaving — saved workflows are in the database (check sidebar) |
| Tags look generic | Turn ON "Auto-tag content" for AI-based tagging, or add better keywords |
| Group doesn't organize | Items need the field you're grouping by (e.g., `language_code` for language grouping) |
| Translate fails on specific content | Check if content has valid text fields. The node skips entries with no text. |

---

## Example Dataset (Ready to Copy)

Here is a complete, pre-formatted dataset you can paste directly into an **Input** node:

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

Run this through the pipeline: **Input → Format → AI Transform → Tag → Output** with your API key configured. You will see each joke transformed into a structured training entry with AI-generated analysis and intelligent tags.