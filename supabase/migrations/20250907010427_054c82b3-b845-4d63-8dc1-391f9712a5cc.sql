-- Create user accounts table for trading accounts
CREATE TABLE public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'standard',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  equity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  daily_drawdown_limit DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  overall_drawdown_limit DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  current_daily_drawdown DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  current_overall_drawdown DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  deriv_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts" ON public.user_accounts
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts" ON public.user_accounts
FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all accounts
CREATE POLICY "Service can manage accounts" ON public.user_accounts
FOR ALL USING (true);

-- Create account tiers table
CREATE TABLE public.account_tiers (
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

-- Insert default account tiers
INSERT INTO public.account_tiers (name, price, balance, description, features) VALUES
('Starter Challenge', 99.00, 10000.00, 'Perfect for beginners to start their prop trading journey', '["$10,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Email Support"]'),
('Professional Challenge', 199.00, 25000.00, 'Ideal for experienced traders seeking higher capital', '["$25,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Priority Support", "Advanced Analytics"]'),
('Elite Challenge', 399.00, 50000.00, 'For expert traders ready for substantial capital', '["$50,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "VIP Support", "Advanced Analytics", "Custom Risk Parameters"]'),
('Master Challenge', 799.00, 100000.00, 'Maximum capital for proven professional traders', '["$100,000 Starting Balance", "5% Daily Drawdown", "10% Overall Drawdown", "1:100 Leverage", "Dedicated Account Manager", "Advanced Analytics", "Custom Risk Parameters", "Priority Payouts"]');

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.account_tiers(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
FOR SELECT USING (auth.uid() = user_id);

-- Anyone can create payments (for guest checkout)
CREATE POLICY "Anyone can create payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Service role can update payments
CREATE POLICY "Service can update payments" ON public.payments
FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();