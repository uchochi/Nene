-- Create credit system tables
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT,
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  reference TEXT,
  subscription_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Then add test credits (replace with your actual user_id)
-- INSERT INTO public.user_credits (user_id, balance, total_purchased)
-- VALUES ('YOUR_USER_UUID', 5000, 5000)
-- ON CONFLICT (user_id) DO UPDATE SET balance = 5000, total_purchased = 5000;
