/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER: string
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_AI_MODEL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_REDIRECT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
