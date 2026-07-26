-- Fix RLS policies for user_credits and credit_transactions
-- Run this in Supabase Dashboard → SQL Editor

-- Enable RLS (may already be enabled)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT SELECT, INSERT ON credit_transactions TO authenticated;

-- user_credits policies
-- Users can read their own balance
DROP POLICY IF EXISTS "Users can read own credits" ON user_credits;
CREATE POLICY "Users can read own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own credits row (first top-up)
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own balance
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- credit_transactions policies
-- Users can read their own transactions
DROP POLICY IF EXISTS "Users can read own transactions" ON credit_transactions;
CREATE POLICY "Users can read own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
