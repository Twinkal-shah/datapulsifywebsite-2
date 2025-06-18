-- Add gsc_data column to shared_reports table
ALTER TABLE shared_reports
ADD COLUMN IF NOT EXISTS gsc_data JSONB;

-- Update RLS policy to allow reading gsc_data
CREATE POLICY "Allow public read access to shared_reports gsc_data" ON shared_reports
    FOR SELECT
    USING (true);

-- Grant necessary permissions
GRANT SELECT ON shared_reports TO anon, authenticated; 