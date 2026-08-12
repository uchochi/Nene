import { corsHeaders } from './_lib.js'

const AI_API = {
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

export async function POST(req) {
  try {
    const { messages, model, provider, temperature, maxTokens, responseFormat } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing messages array' }), {
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

    const apiUrl = AI_API[aiProvider] || AI_API.openai
    const modelId = model || 'nvidia/nemotron-3-nano-30b-a3b:free'

    // Build request body — supports multimodal content arrays:
    // messages[].content can be a string OR an array of content parts:
    //   { type: 'text', text: '...' }
    //   { type: 'image_url', image_url: { url: '... or data:image/...;base64,...' } }
    //   { type: 'input_audio', input_audio: { data: '<base64>', format: 'wav' } }
    //   { type: 'video_url', video_url: { url: '... or data:video/...;base64,...' } }
    const requestBody = {
      model: modelId,
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
    }

    if (maxTokens) {
      requestBody.max_tokens = maxTokens
    }

    // Only add response_format if explicitly requested (some vision models reject it)
    if (responseFormat) {
      requestBody.response_format = responseFormat
    }

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
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      console.error('AI API error:', JSON.stringify({ status: response.status, error: result.error, model: modelId }))
      const meta = result.error?.metadata
      const detail = meta?.raw?.error?.message || meta?.provider_name || ''
      const msg = result.error?.message || `AI API error: ${response.status}`
      return new Response(JSON.stringify({ error: detail ? `${msg} — ${detail}` : msg }), {
        status: response.status || 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const content = result.choices?.[0]?.message?.content || 'No response'
    const tokensUsed = result.usage?.total_tokens || 0

    return new Response(JSON.stringify({ content, tokensUsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI completion failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
