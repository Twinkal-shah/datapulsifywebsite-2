-- Add RLS policies to tracked_pages table to fix track button functionality

-- Enable RLS on tracked_pages table
ALTER TABLE tracked_pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tracked_pages
CREATE POLICY "Users can view their own tracked pages" ON tracked_pages
    FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own tracked pages" ON tracked_pages
    FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own tracked pages" ON tracked_pages
    FOR UPDATE
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own tracked pages" ON tracked_pages
    FOR DELETE
    USING (user_email = auth.jwt() ->> 'email'); 