import { corsHeaders } from './_lib.js'

const AI_API = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

/**
 * Audio transcription endpoint.
 * Accepts base64-encoded audio and sends it to a multimodal model (e.g. Gemini)
 * via OpenRouter's input_audio content part format.
 *
 * Request body:
 *   { audio: string, format: string, prompt?: string, model?: string, provider?: string }
 *
 * Response:
 *   { content: string }  — the transcribed text
 */
export async function POST(req) {
  try {
    const { audio, format, prompt, model, provider } = await req.json()

    if (!audio || typeof audio !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audio data (base64 string required)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    if (!format) {
      return new Response(JSON.stringify({ error: 'Missing audio format (e.g. wav, mp3)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const aiProvider = provider || 'openrouter'
    const apiKey = aiProvider === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : process.env.OPENAI_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI API key not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const apiUrl = AI_API[aiProvider] || AI_API.openrouter
    const modelId = model || 'google/gemini-2.5-flash-preview'

    // Build multimodal message: text prompt + audio content part
    // OpenRouter audio input uses { data, format } — NOT a data URI prefix
    const userPrompt = prompt || 'Please transcribe this audio file accurately. Output only the transcribed text without any additional commentary.'

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'input_audio',
            input_audio: {
              data: audio,    // raw base64, no data: prefix
              format,         // e.g. 'wav', 'mp3', 'aac', 'ogg', 'flac', 'm4a'
            },
          },
        ],
      },
    ]

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(aiProvider === 'openrouter' ? {
          'HTTP-Referer': 'https://ooguy.vercel.app',
          'X-Title': 'ooguy',
        } : {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: 0.3,  // Low temperature for accurate transcription
      }),
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      console.error('Transcribe API error:', JSON.stringify({ status: response.status, error: result.error, model: modelId }))
      const meta = result.error?.metadata
      const detail = meta?.raw?.error?.message || meta?.provider_name || ''
      const msg = result.error?.message || `Transcription API error: ${response.status}`
      return new Response(JSON.stringify({ error: detail ? `${msg} — ${detail}` : msg }), {
        status: response.status || 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const content = result.choices?.[0]?.message?.content || ''

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
