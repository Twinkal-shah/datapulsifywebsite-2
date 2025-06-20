-- Fix Monthly Subscription Issues
-- Run this script in your Supabase SQL Editor

-- 1. First, update the database function with the new logic
CREATE OR REPLACE FUNCTION update_subscription_from_lemonsqueezy(
  p_email TEXT,
  p_customer_id TEXT,
  p_variant_id TEXT,
  p_payment_status TEXT,
  p_subscription_status TEXT,
  p_subscription_type TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_order_id TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_calculated_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate end date for monthly subscriptions if not provided
  IF p_subscription_type = 'monthly_pro' AND p_end_date IS NULL AND p_start_date IS NOT NULL THEN
    v_calculated_end_date := p_start_date + INTERVAL '30 days';
  ELSE
    v_calculated_end_date := p_end_date;
  END IF;

  UPDATE user_installations
  SET 
    lemonsqueezy_customer_id = p_customer_id,
    lemonsqueezy_subscription_id = COALESCE(p_subscription_id, lemonsqueezy_subscription_id),
    lemonsqueezy_order_id = COALESCE(p_order_id, lemonsqueezy_order_id),
    lemonsqueezy_variant_id = p_variant_id,
    payment_status = p_payment_status,
    subscription_status = p_subscription_status,
    subscription_type = p_subscription_type,
    subscription_start_date = COALESCE(p_start_date, subscription_start_date, NOW()),
    subscription_end_date = COALESCE(v_calculated_end_date, subscription_end_date),
    next_billing_date = p_next_billing_date,
    updated_at = NOW()
  WHERE email = p_email;
  
  -- If no user found, this might be a new customer
  IF NOT FOUND THEN
    -- Calculate end date for new monthly subscriptions
    IF p_subscription_type = 'monthly_pro' AND p_end_date IS NULL THEN
      v_calculated_end_date := COALESCE(p_start_date, NOW()) + INTERVAL '30 days';
    END IF;
    
    INSERT INTO user_installations (
      user_id,
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
      install_date,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      p_email,
      p_customer_id,
      p_subscription_id,
      p_order_id,
      p_variant_id,
      p_payment_status,
      p_subscription_status,
      p_subscription_type,
      COALESCE(p_start_date, NOW()),
      v_calculated_end_date,
      p_next_billing_date,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix existing monthly_pro subscriptions that have null end dates
UPDATE user_installations 
SET 
  subscription_end_date = subscription_start_date + INTERVAL '30 days',
  subscription_status = CASE 
    WHEN payment_status = 'paid' THEN 'active'
    ELSE subscription_status
  END,
  updated_at = NOW()
WHERE subscription_type = 'monthly_pro' 
  AND subscription_end_date IS NULL 
  AND subscription_start_date IS NOT NULL;

-- 3. Fix monthly_pro subscriptions where subscription_status is inactive but payment is paid
UPDATE user_installations 
SET 
  subscription_status = 'active',
  updated_at = NOW()
WHERE subscription_type = 'monthly_pro' 
  AND payment_status = 'paid' 
  AND subscription_status = 'inactive'
  AND (subscription_end_date IS NULL OR subscription_end_date > NOW());

-- 4. Show current subscription status for debugging
SELECT 
  email,
  subscription_type,
  subscription_status,
  payment_status,
  subscription_start_date,
  subscription_end_date,
  CASE 
    WHEN subscription_end_date IS NULL THEN 'No end date'
    WHEN subscription_end_date > NOW() THEN 'Active (future end date)'
    ELSE 'Expired'
  END as calculated_status
FROM user_installations 
WHERE subscription_type IN ('monthly_pro', 'lifetime')
ORDER BY created_at DESC; 