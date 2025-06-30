-- Complete fix for keyword tracking authentication and tab switching issues
-- Run this in your Supabase SQL Editor

-- 1. Fix UUID generation for all tables
ALTER TABLE tracked_keywords ALTER COLUMN id DROP DEFAULT;
ALTER TABLE tracked_keywords ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Re-enable RLS (it was temporarily disabled for debugging)
ALTER TABLE tracked_keywords ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can insert own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can update own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can delete own tracked keywords" ON tracked_keywords;

-- 4. Create robust RLS policies that handle multiple authentication methods
-- This handles tab switching and various auth scenarios

-- For SELECT - allow users to see their own keywords
CREATE POLICY "Users can view own tracked keywords"
    ON tracked_keywords FOR SELECT
    USING (
        user_email = auth.jwt() ->> 'email' OR
        user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
        user_email = auth.email()
    );

-- For INSERT - allow users to insert their own keywords
CREATE POLICY "Users can insert own tracked keywords"
    ON tracked_keywords FOR INSERT
    WITH CHECK (
        user_email = auth.jwt() ->> 'email' OR
        user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
        user_email = auth.email()
    );

-- For UPDATE - allow users to update their own keywords
CREATE POLICY "Users can update own tracked keywords"
    ON tracked_keywords FOR UPDATE
    USING (
        user_email = auth.jwt() ->> 'email' OR
        user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
        user_email = auth.email()
    )
    WITH CHECK (
        user_email = auth.jwt() ->> 'email' OR
        user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
        user_email = auth.email()
    );

-- For DELETE - allow users to delete their own keywords
CREATE POLICY "Users can delete own tracked keywords"
    ON tracked_keywords FOR DELETE
    USING (
        user_email = auth.jwt() ->> 'email' OR
        user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
        user_email = auth.email()
    );

-- 5. Fix other tables that might have UUID issues
DO $$
BEGIN
    -- Fix tracked_pages if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tracked_pages') THEN
        ALTER TABLE tracked_pages ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE tracked_pages ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE tracked_pages ENABLE ROW LEVEL SECURITY;
    END IF;

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
END $$;

-- 6. Update table comments to reflect the fix
COMMENT ON TABLE tracked_keywords IS 'Keyword tracking table with proper RLS policies for tab switching support - Fixed';

-- 7. Verify the changes
SELECT 
    'tracked_keywords' as table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracked_keywords' 
AND column_name = 'id';

-- 8. Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE tablename IN ('tracked_keywords', 'tracked_pages', 'user_installations')
AND schemaname = 'public';

-- 9. List RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tracked_keywords'
ORDER BY tablename, policyname; 