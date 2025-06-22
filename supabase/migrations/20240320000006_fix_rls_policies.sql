-- Fix RLS policies for tracked_keywords table
-- The issue is that auth.jwt() ->> 'email' might not work if the user isn't properly authenticated
-- Let's also add auth.uid() as an alternative

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can insert own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can update own tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Users can delete own tracked keywords" ON tracked_keywords;

-- Create new policies that work with both user_email and auth.uid()
-- For SELECT - allow users to see their own keywords by email or user_id
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

-- Also fix tracked_pages policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tracked_pages') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own tracked pages" ON tracked_pages;
        DROP POLICY IF EXISTS "Users can insert their own tracked pages" ON tracked_pages;
        DROP POLICY IF EXISTS "Users can update their own tracked pages" ON tracked_pages;
        DROP POLICY IF EXISTS "Users can delete their own tracked pages" ON tracked_pages;

        -- Create new policies
        CREATE POLICY "Users can view their own tracked pages"
            ON tracked_pages FOR SELECT
            USING (
                user_email = auth.jwt() ->> 'email' OR
                user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
                user_email = auth.email()
            );

        CREATE POLICY "Users can insert their own tracked pages"
            ON tracked_pages FOR INSERT
            WITH CHECK (
                user_email = auth.jwt() ->> 'email' OR
                user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
                user_email = auth.email()
            );

        CREATE POLICY "Users can update their own tracked pages"
            ON tracked_pages FOR UPDATE
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

        CREATE POLICY "Users can delete their own tracked pages"
            ON tracked_pages FOR DELETE
            USING (
                user_email = auth.jwt() ->> 'email' OR
                user_email = (SELECT email FROM user_installations WHERE user_id = auth.uid()) OR
                user_email = auth.email()
            );
    END IF;
END $$; 