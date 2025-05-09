-- Add new columns to user_installations table
ALTER TABLE user_installations
ADD COLUMN IF NOT EXISTS document_info TEXT,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifetime_deal_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS license_key TEXT UNIQUE; 