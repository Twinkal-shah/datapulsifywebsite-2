-- Create gsc_data table for storing Google Search Console data
CREATE TABLE IF NOT EXISTS gsc_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    site_url TEXT NOT NULL,
    query TEXT NOT NULL,
    page TEXT,
    device TEXT,
    country TEXT,
    date DATE NOT NULL,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr FLOAT DEFAULT 0,
    position FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_gsc_data_updated_at
    BEFORE UPDATE ON gsc_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own GSC data
CREATE POLICY "Users can view own GSC data"
    ON gsc_data FOR SELECT
    USING (user_id = auth.uid());

-- Create policy to allow users to insert their own GSC data
CREATE POLICY "Users can insert own GSC data"
    ON gsc_data FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own GSC data
CREATE POLICY "Users can update own GSC data"
    ON gsc_data FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy to allow users to delete their own GSC data
CREATE POLICY "Users can delete own GSC data"
    ON gsc_data FOR DELETE
    USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_gsc_data_user_id ON gsc_data(user_id);
CREATE INDEX idx_gsc_data_site_url ON gsc_data(site_url);
CREATE INDEX idx_gsc_data_query ON gsc_data(query);
CREATE INDEX idx_gsc_data_date ON gsc_data(date);

-- Create keyword_clusters table for keyword clustering feature
CREATE TABLE IF NOT EXISTS keyword_clusters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    site_url TEXT NOT NULL,
    cluster_name TEXT NOT NULL,
    keywords JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_keyword_clusters_updated_at
    BEFORE UPDATE ON keyword_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE keyword_clusters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own keyword clusters
CREATE POLICY "Users can view own keyword clusters"
    ON keyword_clusters FOR SELECT
    USING (user_id = auth.uid());

-- Create policy to allow users to insert their own keyword clusters
CREATE POLICY "Users can insert own keyword clusters"
    ON keyword_clusters FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own keyword clusters
CREATE POLICY "Users can update own keyword clusters"
    ON keyword_clusters FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy to allow users to delete their own keyword clusters
CREATE POLICY "Users can delete own keyword clusters"
    ON keyword_clusters FOR DELETE
    USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_keyword_clusters_user_id ON keyword_clusters(user_id);
CREATE INDEX idx_keyword_clusters_site_url ON keyword_clusters(site_url); 