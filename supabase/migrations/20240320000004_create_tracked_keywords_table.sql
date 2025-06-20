-- Create tracked_keywords table
CREATE TABLE IF NOT EXISTS tracked_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES user_installations(email) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    keyword_type TEXT DEFAULT 'non-branded' CHECK (keyword_type IN ('branded', 'non-branded')),
    keyword_intent TEXT DEFAULT 'unknown' CHECK (keyword_intent IN ('tofu', 'mofu', 'bofu', 'unknown')),
    current_position FLOAT,
    previous_position FLOAT,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, keyword)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tracked_keywords_user_email 
ON tracked_keywords(user_email);

CREATE INDEX IF NOT EXISTS idx_tracked_keywords_active 
ON tracked_keywords(user_email, is_active);

CREATE INDEX IF NOT EXISTS idx_tracked_keywords_type 
ON tracked_keywords(user_email, keyword_type);

CREATE INDEX IF NOT EXISTS idx_tracked_keywords_intent 
ON tracked_keywords(user_email, keyword_intent);

-- Add RLS policies
ALTER TABLE tracked_keywords ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own tracked keywords
CREATE POLICY "Users can view own tracked keywords"
    ON tracked_keywords FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to insert their own tracked keywords
CREATE POLICY "Users can insert own tracked keywords"
    ON tracked_keywords FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to update their own tracked keywords
CREATE POLICY "Users can update own tracked keywords"
    ON tracked_keywords FOR UPDATE
    USING (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to delete their own tracked keywords
CREATE POLICY "Users can delete own tracked keywords"
    ON tracked_keywords FOR DELETE
    USING (user_email = auth.jwt() ->> 'email');

-- Create function to check keyword limit
CREATE OR REPLACE FUNCTION check_keyword_limit()
RETURNS TRIGGER AS $$
DECLARE
    keyword_count INTEGER;
    user_sub_type TEXT;
    keyword_limit INTEGER;
BEGIN
    -- Get user's subscription type
    SELECT subscription_type INTO user_sub_type
    FROM user_installations
    WHERE email = NEW.user_email;

    -- Set keyword limit based on subscription type
    keyword_limit := CASE user_sub_type
        WHEN 'lifetime' THEN 100
        WHEN 'monthly_pro' THEN 1000
        ELSE 10
    END;

    -- Count existing active tracked keywords
    SELECT COUNT(*) INTO keyword_count
    FROM tracked_keywords
    WHERE user_email = NEW.user_email
    AND is_active = true;

    -- Check if adding new keyword would exceed limit
    IF keyword_count >= keyword_limit THEN
        RAISE EXCEPTION 'Keyword limit reached for subscription type %', user_sub_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for keyword limit check
DROP TRIGGER IF EXISTS trigger_check_keyword_limit ON tracked_keywords;

CREATE TRIGGER trigger_check_keyword_limit
BEFORE INSERT ON tracked_keywords
FOR EACH ROW
EXECUTE FUNCTION check_keyword_limit();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_tracked_keywords_updated_at
    BEFORE UPDATE ON tracked_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 