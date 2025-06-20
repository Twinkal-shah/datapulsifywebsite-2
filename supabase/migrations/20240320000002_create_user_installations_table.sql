-- Create user_installations table
CREATE TABLE IF NOT EXISTS user_installations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL UNIQUE,
    install_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_type TEXT,
    business_size TEXT,
    subscription_type TEXT DEFAULT 'Free Plan',
    usage_count INTEGER DEFAULT 0,
    last_active_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_user_installations_updated_at
    BEFORE UPDATE ON user_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE user_installations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own installation data
CREATE POLICY "Users can view own installation"
    ON user_installations FOR SELECT
    USING (email = auth.jwt() ->> 'email');

-- Create policy to allow users to update their own installation data
CREATE POLICY "Users can update own installation"
    ON user_installations FOR UPDATE
    USING (email = auth.jwt() ->> 'email');

-- Create indexes
CREATE INDEX idx_user_installations_email ON user_installations(email);
CREATE INDEX idx_user_installations_user_id ON user_installations(user_id); 