# n8n Dataset — User Guide

A step-by-step walkthrough for building data pipelines, formatting LLM training datasets, and exporting JSONL — with real examples.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Example 1: Format Jokes for Humor Training](#2-example-1-format-jokes-for-humor-training)
3. [Example 2: Translate & Localize a Dataset](#3-example-2-translate--localize-a-dataset)
4. [Example 3: AI-Powered Content Analysis](#4-example-3-ai-powered-content-analysis)
5. [Example 4: Full Dataset Pipeline](#5-example-4-full-dataset-pipeline)
6. [Exporting & Using Your Dataset](#6-exporting--using-your-dataset)
7. [Understanding the Output](#7-understanding-the-output)
8. [Tips & Best Practices](#8-tips--best-practices)
9. [Troubleshooting](#9-troubleshooting)

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

## 2. Example 1: Format Jokes for Humor Training

Let's turn raw joke text into structured JSONL entries.

### Step 1: Add an Input Node

Click **Input** in the sidebar. A green input node appears on the canvas. Click it to open the config panel.

Paste this content into the **Content** textarea:

```
Why don't scientists trust atoms? Because they make up everything!
What do you call a fish with no eyes? A fsh.
I told my wife she was drawing her eyebrows too high. She looked surprised.
```

Set **Content Type** to `Plain Text`.

### Step 2: Add a Format Node

Click **Format** in the sidebar. A blue node appears. Connect the **Input** node (drag from its bottom dot) to the **Format** node (drop on its top dot).

Click the Format node to configure it:
- **Output Format:** `JSONL`
- **Include Metadata:** ✓ checked

### Step 3: Add an Output Node

Click **Output** in the sidebar. A red node appears. Connect **Format** → **Output**.

Click the Output node:
- **Export Format:** `JSONL`

### Step 4: Run the Workflow

Click **Run Workflow** in the toolbar. The bottom panel will show the result:

```jsonl
{"id":"item_001","raw_content":"Why don't scientists trust atoms? Because they make up everything!","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-06-28T12:00:00.000Z","source":"user_input"}
{"id":"item_002","raw_content":"What do you call a fish with no eyes? A fsh.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-06-28T12:00:00.000Z","source":"user_input"}
{"id":"item_003","raw_content":"I told my wife she was drawing her eyebrows too high. She looked surprised.","language_code":"unknown","region":"unknown","format":"text","timestamp":"2026-06-28T12:00:00.000Z","source":"user_input"}
```

Click **Download** to save as a `.jsonl` file.

> **What happened?** The Format node split your text by lines, assigned each an ID, and wrapped them in the JSONL schema. The Output node rendered them as line-delimited JSON.

---

## 3. Example 2: Translate & Localize a Dataset

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

Click the **Translate** node (teal color). Set:

- **Target Languages:** `es, fr, de, ja`
- **Preserve humor mechanics:** ✓

### Step 5: Run

Click **Run Workflow**. Each entry gets duplicated per language:

```jsonl
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"unknown","region":"unknown","format":"text","timestamp":"...","source":"user_input","translated":true,"original_language":"unknown","language_code":"es"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"unknown","region":"unknown","format":"text","timestamp":"...","source":"user_input","translated":true,"original_language":"unknown","language_code":"fr"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"unknown","region":"unknown","format":"text","timestamp":"...","source":"user_input","translated":true,"original_language":"unknown","language_code":"de"}
{"id":"item_001","raw_content":"Why did the scarecrow win an award? Because he was outstanding in his field!","language_code":"unknown","region":"unknown","format":"text","timestamp":"...","source":"user_input","translated":true,"original_language":"unknown","language_code":"ja"}
```

Each row is tagged with its language code. When you train an LLM on this, it learns the same joke structure in four languages.

> **Real use case:** This is how you build a multilingual humor dataset. The AI learns that the "scarecrow/outstanding in his field" pun works across cultures, not just in English.

---

## 4. Example 3: AI-Powered Content Analysis

This requires an **OpenAI or OpenRouter API key**. Add it in the sidebar under **Settings → AI API Key**.

### Step 1: Build the pipeline

```
[Input] → [Format] → [AI Transform] → [Output]
```

### Step 2: Configure Input

Paste this content with richer data:

```
{
  "content": [
    {
      "text": "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
      "language": "es",
      "region": "Latin America"
    }
  ]
}
```

Set **Content Type** to `JSON`.

### Step 3: Configure Format

- **Output Format:** `JSON`
- **Include Metadata:** ✓

### Step 4: Configure AI Transform

Click the **AI Transform** node (pink color). Set:

- **Custom Prompt:** (leave empty for default)

The default prompt asks the AI to analyze content and extract: setup, punchline, humor mechanics, cultural context, linguistic context, and explanation_for_ai.

### Step 5: Run

The AI will analyze the Spanish bee joke and return:

```json
{
  "id": "item_001",
  "raw_content": "{\n  \"content\": [\n    {\n      \"text\": \"¿Qué hace una abeja en el gimnasio? ¡Zum-ba!\",\n      \"language\": \"es\",\n      \"region\": \"Latin America\"\n    }\n  ]\n}",
  "language_code": "unknown",
  "region": "unknown",
  "format": "json",
  "timestamp": "2026-06-28T12:00:00.000Z",
  "source": "user_input",
  "explanation_for_ai": "{\n  \"setup\": \"¿Qué hace una abeja en el gimnasio?\",\n  \"punchline\": \"¡Zum-ba!\",\n  \"humor_mechanics\": [\"pun\", \"phonetic_ambiguity\"],\n  \"cultural_context\": \"Zumba is a popular Latin dance fitness program that has spread worldwide.\",\n  \"linguistic_context\": \"The Spanish verb 'zumbar' means 'to buzz'. The punchline 'Zum-ba' phonetically matches both the sound of a bee and the fitness class name.\",\n  \"explanation_for_ai\": \"The humor arises from phonetic ambiguity. The word 'Zumba' is a fitness program, but 'zum-ba' sounds like a conjugation of 'zumbar' (to buzz). The joke creates an unexpected link between a bee (which buzzes) and a gym (which offers Zumba classes).\"\n}",
  "ai_processed": true
}
```

> **Why this matters:** This is the "Explain the Joke" paradigm. By generating `explanation_for_ai`, you're teaching the LLM *why* the joke works, not just the joke itself. This is what makes fine-tuned models genuinely funny instead of just memorizing punchlines.

---

## 5. Example 4: Full Pipeline — Every Node in Action

This example uses **all 7 node types** from the sidebar in a single workflow: Input, Format, Tag & Categorize, Group, Translate, AI Transform, Output.

### The Pipeline

```
[Input] → [Format] → [Tag & Categorize] → [Group] → [Translate] → [AI Transform] → [Output]
```

### Step 1: Add & Connect All Nodes

Click each node in the sidebar in this order. Then connect them by dragging from each node's **bottom orange dot** to the **top orange dot** of the next node:

| Order | Node | Sidebar Icon | Color |
|-------|------|-------------|-------|
| 1st | Input | 📥 | Green |
| 2nd | Format | 🔧 | Blue |
| 3rd | Tag & Categorize | 🏷️ | Orange |
| 4th | Group | 📂 | Purple |
| 5th | Translate | 🌐 | Teal |
| 6th | AI Transform | 🤖 | Pink |
| 7th | Output | 📤 | Red |

Your canvas should look like a chain of 7 connected blocks:

```
📥 → 🔧 → 🏷️ → 📂 → 🌐 → 🤖 → 📤
```

### Step 2: Configure Input Node

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

Type: Meme
Language: es
Image: Dog sitting in a room on fire
Text: This is fine
Caption: Este es mi nivel de estrés cada lunes

Type: Joke
Language: fr
Pourquoi les plongeurs plongent-ils toujours en arrière ?
Parce que sinon ils tombent dans le bateau.

Type: Joke
Language: fr
Que fait une fraise sur un cheval ? Tagada tagada tagada !
```

### Step 3: Configure Format Node

Click the blue **Format** node:

- **Output Format:** `JSONL`
- **Include Metadata:** ✓ checked

This splits each line, wraps them in JSON objects, and assigns sequential IDs.

### Step 4: Configure Tag & Categorize Node

Click the orange **Tag & Categorize** node:

- **Categories:** `humor, wordplay, pun, multilingual`
- **Auto-tag content:** ✓ checked

This appends a `tags` array and assigns the categories you listed to every entry.

### Step 5: Configure Group Node

Click the purple **Group** node:

- **Group By:** `language`

This collects entries by their `language_code` field. All `en` entries go together, all `es` together, all `fr` together. Each group becomes an object with a `group` name, `count`, and `items` array.

### Step 6: Configure Translate Node

Click the teal **Translate** node:

- **Target Languages:** `pt, it`
- **Preserve humor mechanics:** ✓ checked

This duplicates every entry for Portuguese and Italian. After this step, 6 entries become 18 (6 original × 3 language tags each: original + pt + it).

### Step 7: Configure AI Transform Node

Click the pink **AI Transform** node:

- **AI Model:** `gpt-4o-mini`
- **Custom Prompt:**

```
You are a humor analyst. For each piece of content, identify:
1. The setup and punchline
2. The humor mechanics at play (pun, wordplay, incongruity, irony, absurdity)
3. The cultural context needed to understand it
4. The linguistic tricks used (phonetic ambiguity, double meaning, etc.)
5. A Chain-of-Thought explanation of why the joke works

Output valid JSON with fields: setup, punchline, humor_mechanics, cultural_context, linguistic_context, explanation_for_ai
```

### Step 8: Configure Output Node

Click the red **Output** node:

- **Export Format:** `JSONL`

### Step 9: Run the Workflow

Click **Run Workflow** in the toolbar. As data flows through each node, here is what happens at every stage:

#### After Format Node
Each joke becomes a structured JSON object:
```json
{"id":"item_001","raw_content":"Why did the bicycle fall over? Because it was two-tired!","language_code":"unknown","format":"text"}
{"id":"item_002","raw_content":"Parallel lines have so much in common. It's a shame they'll never meet.","language_code":"unknown","format":"text"}
{"id":"item_003","raw_content":"¿Qué hace una abeja en el gimnasio? ¡Zum-ba!","language_code":"unknown","format":"text"}
...
```

#### After Tag & Categorize Node
Tags and categories are appended:
```json
{"id":"item_001","raw_content":"Why did the bicycle fall over?...","language_code":"unknown","tags":["humor","why","the","bicycle","fall","over","because","it","was","two-tired"],"categories":["humor","wordplay","pun","multilingual"],"categorized":true}
```

#### After Group Node
Entries are nested by language:
```json
{"group":"en","count":2,"items":[{...},{...}]}
{"group":"es","count":2,"items":[{...},{...}]}
{"group":"fr","count":2,"items":[{...},{...}]}
```

#### After Translate Node
Each entry expands to 3 language variants (original + pt + it):
```json
{"group":"en","count":2,"items":[
  {...,"language_code":"en","translated":false},
  {...,"language_code":"pt","translated":true,"original_language":"en"},
  {...,"language_code":"it","translated":true,"original_language":"en"}
]}
```

#### After AI Transform Node
Every entry gets AI-generated analysis:
```json
{
  "group": "en",
  "count": 6,
  "items": [
    {
      "id": "item_001",
      "language_code": "en",
      "raw_content": "Why did the bicycle fall over? Because it was two-tired!",
      "explanation_for_ai": "{\n  \"setup\": \"Why did the bicycle fall over?\",\n  \"punchline\": \"Because it was two-tired!\",\n  \"humor_mechanics\": [\"pun\", \"wordplay\"],\n  \"cultural_context\": \"Common knowledge about bicycles needing tires.\",\n  \"linguistic_context\": \"'Two-tired' is a homophone for 'too tired', creating a double meaning where the bicycle is both physically tired (having two tires) and exhausted.\",\n  \"explanation_for_ai\": \"The humor comes from a pun on 'two-tired' vs 'too tired'. The setup leads you to expect a logical answer about bicycle mechanics, but the punchline delivers a personification joke where the bicycle is anthropomorphized as feeling exhausted.\"}",
      "ai_processed": true
    }
  ]
}
```

### Step 10: Explore the Results

The preview panel appears at the bottom of the canvas with three tabs:

**Preview tab** — Shows the first few entries with their tags and language badges:
```
#1  en  pun, wordplay
Why did the bicycle fall over? Because it was two-tired!

#2  en  pun
Parallel lines have so much in common...

#3  es  pun, phonetic_ambiguity
¿Qué hace una abeja en el gimnasio? ¡Zum-ba!
```

**Stats tab** — Shows the breakdown:

| Stat | Value |
|------|-------|
| Total Entries | 18 |
| Languages | 5 (en, es, fr, pt, it) |
| Regions | 1 |
| Mechanics | pun, wordplay, incongruity, absurdity |

**Raw tab** — Shows the full JSONL text, ready to copy.

### Step 11: Export

Click **Download** in the preview panel. The file saves as `my_workflow_dataset.jsonl` with 18 fully enriched entries.

### What You Built

| Node | Job Done |
|------|----------|
| 📥 Input | Ingested 6 jokes in 3 languages (en, es, fr) |
| 🔧 Format | Split into structured JSON objects with IDs |
| 🏷️ Tag & Categorize | Tagged every entry with humor/wordplay/pun/multilingual |
| 📂 Group | Organized entries into language groups |
| 🌐 Translate | Expanded each entry into Portuguese and Italian (6 → 18 entries) |
| 🤖 AI Transform | Analyzed each joke's mechanics, context, and reasoning |
| 📤 Output | Exported as ready-to-train JSONL |

This is a production-grade pipeline. You can reuse this exact workflow for any content — just change the Input data and re-run.

---

## 6. Exporting & Using Your Dataset

### Download JSONL

Click **Export** in the toolbar or **Download** in the preview panel. The file is named after your workflow (e.g. `my_humor_dataset.jsonl`).

### Using the Dataset for Fine-Tuning

The exported JSONL file is ready for:

**OpenAI Fine-Tuning:**
```bash
openai api fine_tunes.create \
  -t my_humor_dataset.jsonl \
  -m gpt-3.5-turbo
```

**Hugging Face:**
```python
from datasets import load_dataset

dataset = load_dataset('json', data_files='my_humor_dataset.jsonl')
```

**Manual inspection:**
```bash
# Count entries
wc -l my_humor_dataset.jsonl

# Preview first entry
head -1 my_humor_dataset.jsonl | jq .
```

### Dataset Statistics

The **Stats** tab in the preview panel shows:
- Total entries
- Unique languages and regions
- Humor mechanics distribution
- Entries grouped by language

Use these stats to balance your dataset before training.

---

## 7. Understanding the Output

Each JSONL line follows this schema:

```json
{
  "id": "item_001",
  "language_code": "es",
  "region": "Latin America",
  "format": "text",
  "setup": "¿Qué hace una abeja en el gimnasio?",
  "punchline": "¡Zum-ba!",
  "literal_english_translation": "What does a bee do in the gym? Zumba!",
  "humor_mechanics": ["pun", "phonetic_ambiguity"],
  "cultural_context": "Requires knowing that Zumba is a dance fitness program.",
  "linguistic_context": "Relies on the Spanish verb 'zumbar' (to buzz).",
  "explanation_for_ai": "The humor arises from phonetic ambiguity..."
}
```

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier for each entry |
| `language_code` | ISO language code (en, es, fr, ja, etc.) |
| `region` | Geographic region for cultural context |
| `format` | Content format (text, Q&A, meme, etc.) |
| `setup` / `punchline` | The joke structure |
| `humor_mechanics` | Array of techniques used (pun, incongruity, etc.) |
| `cultural_context` | Background knowledge required |
| `linguistic_context` | Language-specific wordplay explanation |
| `explanation_for_ai` | Chain-of-Thought reasoning — teaches the model *why* |

---

## 8. Tips & Best Practices

### Dataset Quality

| Do | Don't |
|----|-------|
| Include 100+ entries per language | Mix languages without tagging them |
| Vary humor mechanics across entries | Translate puns literally |
| Add cultural_context for every entry | Leave `region` as "unknown" |
| Use the AI Transform for CoT reasoning | Rely on raw text alone |

### Workflow Tips

- **Save frequently** — Click Save in the toolbar to persist your workflow to localStorage
- **Use descriptive names** — Rename your workflow in the toolbar for easy identification
- **Preview before exporting** — Check the Preview tab to spot formatting issues
- **History tracking** — Every export is logged in the sidebar History section

### Recommended Pipeline for Production

```
Input (CSV/JSON) → Format → AI Transform → Translate → Group → Output
```

This pipeline:
1. Ingests raw content from a file
2. Structures it into the JSONL schema
3. AI enriches each entry with mechanics and explanations
4. Expands entries across target languages
5. Groups by language for balanced sampling
6. Exports as a ready-to-train JSONL file

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| No output after running | Make sure nodes are **connected** (orange dots linked) |
| AI Transform fails | Check your API key in sidebar Settings |
| Output is empty JSONL | Input node needs content — paste some text |
| Translate adds no languages | Enter comma-separated ISO codes: `es, fr, de` |
| Preview shows "Invalid JSON" | The Format node may have produced malformed output — check your input |
| Workflow lost after refresh | Click **Save** before leaving — or check History |
| Too many entries | The Group node can deduplicate and organize by field |
| Labels look wrong | Click any node and edit its Label in the config panel |

---

## Example Dataset (Ready to Copy)

Here is a complete, pre-formatted dataset you can paste directly into an **Input** node and run through the pipeline to see everything working end-to-end:

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

Run this through the pipeline: **Input → Format → AI Transform → Output** with your API key configured. You will see each joke transformed into a structured training entry with humor mechanics, cultural context, and Chain-of-Thought explanations.
