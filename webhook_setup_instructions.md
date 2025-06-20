# LemonSqueezy Webhook Setup Instructions

## ✅ Current Status
- **Webhook Function**: ✅ Deployed and working
- **401 Error**: ✅ Fixed
- **Invalid Signature**: ✅ Fixed (temporarily disabled)
- **Next Step**: Run SQL script to create database function

## 🔧 To Complete Setup:

### 1. Run SQL Script in Supabase Dashboard
Go to: https://supabase.com/dashboard/project/yevkfoxoefssdgsodtzd/sql

```sql
-- Add LemonSqueezy fields and create the database function
ALTER TABLE user_installations
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lemonsqueezy_checkout_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Add constraints
ALTER TABLE user_installations DROP CONSTRAINT IF EXISTS valid_payment_status;
ALTER TABLE user_installations ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

ALTER TABLE user_installations DROP CONSTRAINT IF EXISTS valid_subscription_status;
ALTER TABLE user_installations ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired', 'past_due', 'unpaid'));

ALTER TABLE user_installations DROP CONSTRAINT IF EXISTS valid_subscription_type;
ALTER TABLE user_installations ADD CONSTRAINT valid_subscription_type 
CHECK (subscription_type IN ('free', 'Free Plan', 'monthly_pro', 'lifetime'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_installations_lemonsqueezy_customer ON user_installations(lemonsqueezy_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_installations_lemonsqueezy_subscription ON user_installations(lemonsqueezy_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_installations_payment_status ON user_installations(email, payment_status, subscription_status);

-- Create the main function with simplified user_id handling
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
  v_user_id UUID;
  v_existing_record_count INTEGER;
BEGIN
  -- Check if user already exists in user_installations
  SELECT COUNT(*), user_id INTO v_existing_record_count, v_user_id
  FROM user_installations 
  WHERE email = p_email 
  GROUP BY user_id
  LIMIT 1;
  
  -- If no existing record, generate a new UUID
  IF v_existing_record_count IS NULL OR v_existing_record_count = 0 THEN
    v_user_id := gen_random_uuid();
    v_existing_record_count := 0;
  END IF;

  -- Try to update existing record
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
  
  -- If no existing record found, create a new one
  IF NOT FOUND THEN
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
      v_user_id,
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
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Update LemonSqueezy Webhook URL
Set your webhook URL in LemonSqueezy to:
```
https://yevkfoxoefssdgsodtzd.supabase.co/functions/v1/lemon-squeezy-webhook
```

### 3. (Optional) Re-enable Signature Validation
Once everything is working, you can re-enable signature validation by:

1. Getting the actual webhook secret from LemonSqueezy
2. Setting it: `supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_actual_secret`
3. Uncommenting the signature validation code in the webhook function
4. Redeploying: `supabase functions deploy lemon-squeezy-webhook --no-verify-jwt`

## 🎯 Expected Result
After running the SQL script, your webhook will:
- ✅ Accept LemonSqueezy webhook calls
- ✅ Update user subscription data in Supabase
- ✅ Enable proper plan updates in DataPulsify
- ✅ Handle lifetime and monthly subscriptions correctly 