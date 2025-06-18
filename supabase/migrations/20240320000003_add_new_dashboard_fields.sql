-- Add new columns to user_installations table
ALTER TABLE user_installations
ADD COLUMN IF NOT EXISTS document_info TEXT,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifetime_deal_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS license_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS keyword_count INTEGER DEFAULT 0;

-- Add check constraint for subscription_type
ALTER TABLE user_installations
DROP CONSTRAINT IF EXISTS valid_subscription_type;

ALTER TABLE user_installations
ADD CONSTRAINT valid_subscription_type 
CHECK (subscription_type IN ('free', 'monthly_pro', 'lifetime'));

-- Create index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_user_installations_subscription 
ON user_installations(email, subscription_type, lifetime_deal_status);

-- Create function to update keyword count
CREATE OR REPLACE FUNCTION update_keyword_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_installations
    SET keyword_count = keyword_count + 1
    WHERE email = NEW.user_email;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_installations
    SET keyword_count = keyword_count - 1
    WHERE email = OLD.user_email;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for keyword count updates
DROP TRIGGER IF EXISTS trigger_update_keyword_count ON tracked_keywords;

CREATE TRIGGER trigger_update_keyword_count
AFTER INSERT OR DELETE ON tracked_keywords
FOR EACH ROW
EXECUTE FUNCTION update_keyword_count(); 