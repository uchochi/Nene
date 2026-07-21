const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
const OPENAI_API = 'https://api.openai.com/v1/chat/completions'

export type AIProvider = 'openai' | 'openrouter'

export interface AIRequestConfig {
  provider: AIProvider
  apiKey: string
  model: string
  systemPrompt?: string
  temperature?: number
}

const SYSTEM_PROMPT = `You are a data formatting assistant for LLM training datasets. Your job is to analyze content and produce structured JSON output.

When analyzing humorous content:
1. Identify the setup and punchline
2. Determine the humor mechanics (pun, incongruity, hyperbole, irony, wordplay, etc.)
3. Explain the cultural context needed to understand the joke
4. Explain the linguistic techniques used
5. Provide a clear "explanation_for_ai" that teaches the model why the joke works

Always output valid JSON.`

export async function callAI(
  content: string,
  config: AIRequestConfig,
  customPrompt?: string
): Promise<string> {
  const apiUrl = config.provider === 'openrouter' ? OPENROUTER_API : OPENAI_API
  const userPrompt = customPrompt || `Analyze this content and produce a structured analysis:\n\n${content.slice(0, 3000)}`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' ? {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ooguy',
      } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt || SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature ?? 0.7,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`AI API error (${response.status}): ${err}`)
  }

  const result = await response.json()
  return result.choices?.[0]?.message?.content || '{}'
}
