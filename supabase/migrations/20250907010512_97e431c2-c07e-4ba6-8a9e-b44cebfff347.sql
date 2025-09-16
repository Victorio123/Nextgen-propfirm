-- Create account tiers table if not exists
CREATE TABLE IF NOT EXISTS public.account_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  daily_drawdown_limit DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  overall_drawdown_limit DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  description TEXT,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for account tiers (public read)
ALTER TABLE public.account_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tiers
CREATE POLICY "Anyone can view active tiers" ON public.account_tiers
FOR SELECT USING (is_active = true);

-- Insert default account tiers if they don't exist
INSERT INTO public.account_tiers (name, price, balance, description, features) 
SELECT * FROM (VALUES
  ('Starter Challenge', 99.00, 10000.00, 'Perfect for beginners to start their prop trading journey', '["$10,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Email Support"]'::jsonb),
  ('Professional Challenge', 199.00, 25000.00, 'Ideal for experienced traders seeking higher capital', '["$25,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Priority Support", "Advanced Analytics"]'::jsonb),
  ('Elite Challenge', 399.00, 50000.00, 'For expert traders ready for substantial capital', '["$50,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "VIP Support", "Advanced Analytics", "Custom Risk Parameters"]'::jsonb),
  ('Master Challenge', 799.00, 100000.00, 'Maximum capital for proven professional traders', '["$100,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Dedicated Account Manager", "Advanced Analytics", "Custom Risk Parameters", "Priority Payouts"]'::jsonb)
) v(name, price, balance, description, features)
WHERE NOT EXISTS (SELECT 1 FROM public.account_tiers WHERE account_tiers.name = v.name);