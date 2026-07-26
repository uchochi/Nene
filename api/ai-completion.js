import { corsHeaders } from './_lib.js'

const AI_API = {
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const { messages, model, provider } = await req.json()

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
    const modelId = model || 'meta-llama/llama-3.1-8b-instruct:free'

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
        temperature: 0.7,
      }),
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

    return new Response(JSON.stringify({ content }), {
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
