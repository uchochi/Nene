-- ───────────────────────────────────────────────────────────────────
-- 003_token_consumption.sql
-- Transform billing from per-operation credits to token-based credits.
--
-- 10,000 credits = 1M tokens (1 credit = 100 tokens)
-- Existing user balances are multiplied by 8 (Option B migration):
--   old 1,250 credits ($10)  →  10,000 credits (1M tokens)
--   old 2,500 credits ($20)  →  20,000 credits (2M tokens)
--   old 5,000 credits ($40)  →  40,000 credits (4M tokens)
--
-- Run this in Supabase Dashboard > SQL Editor.
-- ───────────────────────────────────────────────────────────────────

-- 1. Add token-tracking columns to user_credits
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS tokens_used INTEGER NOT NULL DEFAULT 0;

-- 2. Add token count to credit_transactions (tokens purchased)
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS tokens_awarded INTEGER NOT NULL DEFAULT 0;

-- 3. Create workflow_runs table for per-run token consumption
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name TEXT,
  nodes_count INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  credits_deducted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for workflow_runs
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own runs" ON public.workflow_runs;
CREATE POLICY "Users can read own runs"
  ON public.workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own runs" ON public.workflow_runs;
CREATE POLICY "Users can insert own runs"
  ON public.workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Grant permissions to authenticated role
GRANT SELECT, INSERT ON public.workflow_runs TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- 6. MIGRATE EXISTING BALANCES — Option B: multiply by 8
-- ───────────────────────────────────────────────────────────────────
-- Old: 1,250 credits = $10 (1 credit = 1 operation)
-- New: 10,000 credits = $10 (10,000 credits = 1M tokens)
-- So every old credit becomes 8 new credits.
UPDATE public.user_credits
  SET balance = balance * 8,
      total_purchased = total_purchased * 8,
      updated_at = now();

-- Also scale past transactions for consistency in history display
UPDATE public.credit_transactions
  SET credits_awarded = credits_awarded * 8,
      tokens_awarded = (credits_awarded * 8) * 100;
