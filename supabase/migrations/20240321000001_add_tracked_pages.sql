-- Create tracked_pages table
CREATE TABLE IF NOT EXISTS tracked_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES user_installations(email) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_email, url)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracked_pages_user_email 
ON tracked_pages(user_email);

-- Create function to check page limit
CREATE OR REPLACE FUNCTION check_page_limit()
RETURNS TRIGGER AS $$
DECLARE
    page_count INTEGER;
    user_sub_type TEXT;
    page_limit INTEGER;
BEGIN
    -- Get user's subscription type
    SELECT subscription_type INTO user_sub_type
    FROM user_installations
    WHERE email = NEW.user_email;

    -- Set page limit based on subscription type
    page_limit := CASE user_sub_type
        WHEN 'lifetime' THEN 30
        WHEN 'monthly_pro' THEN 100
        ELSE 5
    END;

    -- Count existing active tracked pages
    SELECT COUNT(*) INTO page_count
    FROM tracked_pages
    WHERE user_email = NEW.user_email
    AND is_active = true;

    -- Check if adding new page would exceed limit
    IF page_count >= page_limit THEN
        RAISE EXCEPTION 'Page limit reached for subscription type %', user_sub_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for page limit check
DROP TRIGGER IF EXISTS trigger_check_page_limit ON tracked_pages;

CREATE TRIGGER trigger_check_page_limit
BEFORE INSERT ON tracked_pages
FOR EACH ROW
EXECUTE FUNCTION check_page_limit(); 