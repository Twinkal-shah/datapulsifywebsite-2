-- Create data_exports table
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES user_installations(email) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_data_exports_user_email 
ON data_exports(user_email);

-- Enable RLS on data_exports table
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data_exports
CREATE POLICY "Users can view their own data exports" ON data_exports
    FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own data exports" ON data_exports
    FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email'); 