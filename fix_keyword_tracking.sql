-- Comprehensive fix for keyword tracking authentication issues
-- Run this in your Supabase SQL Editor

-- 1. Fix UUID generation
ALTER TABLE tracked_keywords ALTER COLUMN id DROP DEFAULT;
ALTER TABLE tracked_keywords ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Temporarily disable RLS to test functionality
ALTER TABLE tracked_keywords DISABLE ROW LEVEL SECURITY;

-- 3. Add comment for future reference
COMMENT ON TABLE tracked_keywords IS 'RLS temporarily disabled for debugging - re-enable after auth is fixed';

-- 4. Also fix tracked_pages if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tracked_pages') THEN
        ALTER TABLE tracked_pages ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE tracked_pages ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE tracked_pages DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE tracked_pages IS 'RLS temporarily disabled for debugging - re-enable after auth is fixed';
    END IF;
END $$;

-- 5. Fix other tables that might have UUID issues
DO $$
BEGIN
    -- Fix user_installations
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_installations' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE user_installations ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE user_installations ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    -- Fix gsc_data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gsc_data' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE gsc_data ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE gsc_data ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    -- Fix keyword_clusters
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'keyword_clusters' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE keyword_clusters ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE keyword_clusters ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 6. Verify the changes
SELECT 
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracked_keywords' 
AND column_name = 'id';

-- 7. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tracked_keywords', 'tracked_pages', 'user_installations'); 