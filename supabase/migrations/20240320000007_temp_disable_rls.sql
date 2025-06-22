-- Temporarily disable RLS on tracked_keywords table for testing
-- This is to diagnose the authentication issue

-- Disable RLS temporarily
ALTER TABLE tracked_keywords DISABLE ROW LEVEL SECURITY;

-- Add a comment to remember this is temporary
COMMENT ON TABLE tracked_keywords IS 'RLS temporarily disabled for debugging authentication issues';

-- Also disable RLS on tracked_pages if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tracked_pages') THEN
        ALTER TABLE tracked_pages DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE tracked_pages IS 'RLS temporarily disabled for debugging authentication issues';
    END IF;
END $$; 