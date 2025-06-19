-- Add LemonSqueezy fields to user_installations table
ALTER TABLE user_installations
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lemonsqueezy_checkout_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Add check constraint for payment_status
ALTER TABLE user_installations
DROP CONSTRAINT IF EXISTS valid_payment_status;

ALTER TABLE user_installations
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- Add check constraint for subscription_status
ALTER TABLE user_installations
DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE user_installations
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired', 'past_due', 'unpaid'));

-- Update existing subscription_type constraint to include new values
ALTER TABLE user_installations
DROP CONSTRAINT IF EXISTS valid_subscription_type;

ALTER TABLE user_installations
ADD CONSTRAINT valid_subscription_type 
CHECK (subscription_type IN ('free', 'Free Plan', 'monthly_pro', 'lifetime'));

-- Create indexes for faster LemonSqueezy queries
CREATE INDEX IF NOT EXISTS idx_user_installations_lemonsqueezy_customer 
ON user_installations(lemonsqueezy_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_installations_lemonsqueezy_subscription 
ON user_installations(lemonsqueezy_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_installations_payment_status 
ON user_installations(email, payment_status, subscription_status);

-- Create function to update subscription status based on LemonSqueezy data
CREATE OR REPLACE FUNCTION update_subscription_from_lemonsqueezy(
  p_email TEXT,
  p_customer_id TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_order_id TEXT DEFAULT NULL,
  p_variant_id TEXT,
  p_payment_status TEXT,
  p_subscription_status TEXT,
  p_subscription_type TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_installations
  SET 
    lemonsqueezy_customer_id = p_customer_id,
    lemonsqueezy_subscription_id = COALESCE(p_subscription_id, lemonsqueezy_subscription_id),
    lemonsqueezy_order_id = COALESCE(p_order_id, lemonsqueezy_order_id),
    lemonsqueezy_variant_id = p_variant_id,
    payment_status = p_payment_status,
    subscription_status = p_subscription_status,
    subscription_type = p_subscription_type,
    subscription_start_date = COALESCE(p_start_date, subscription_start_date),
    subscription_end_date = COALESCE(p_end_date, subscription_end_date),
    next_billing_date = p_next_billing_date,
    updated_at = NOW()
  WHERE email = p_email;
  
  -- If no user found, this might be a new customer
  IF NOT FOUND THEN
    INSERT INTO user_installations (
      email,
      lemonsqueezy_customer_id,
      lemonsqueezy_subscription_id,
      lemonsqueezy_order_id,
      lemonsqueezy_variant_id,
      payment_status,
      subscription_status,
      subscription_type,
      subscription_start_date,
      subscription_end_date,
      next_billing_date,
      created_at,
      updated_at
    ) VALUES (
      p_email,
      p_customer_id,
      p_subscription_id,
      p_order_id,
      p_variant_id,
      p_payment_status,
      p_subscription_status,
      p_subscription_type,
      COALESCE(p_start_date, NOW()),
      p_end_date,
      p_next_billing_date,
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get subscription details for a user
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_email TEXT)
RETURNS TABLE (
  subscription_type TEXT,
  subscription_status TEXT,
  payment_status TEXT,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_subscription_id TEXT,
  lifetime_deal_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.subscription_type,
    ui.subscription_status,
    ui.payment_status,
    ui.subscription_start_date,
    ui.subscription_end_date,
    ui.next_billing_date,
    ui.lemonsqueezy_customer_id,
    ui.lemonsqueezy_subscription_id,
    ui.lifetime_deal_status
  FROM user_installations ui
  WHERE ui.email = p_email;
END;
$$ LANGUAGE plpgsql; 