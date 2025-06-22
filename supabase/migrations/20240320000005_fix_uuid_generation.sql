-- Fix UUID generation in tracked_keywords table
-- Replace uuid_generate_v4() with gen_random_uuid() which is built-in to PostgreSQL 13+

-- First, drop the existing default
ALTER TABLE tracked_keywords ALTER COLUMN id DROP DEFAULT;

-- Add the new default using gen_random_uuid()
ALTER TABLE tracked_keywords ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also fix any other tables that might have the same issue
-- Update user_installations table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_installations' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE user_installations ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE user_installations ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Update tracked_pages table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_pages' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
    ) THEN
        ALTER TABLE tracked_pages ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE tracked_pages ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Update gsc_data table if it exists
DO $$
BEGIN
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

-- Update keyword_clusters table if it exists
DO $$
BEGIN
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