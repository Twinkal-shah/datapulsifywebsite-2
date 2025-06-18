-- Function to get aggregated GSC metrics
CREATE OR REPLACE FUNCTION get_aggregated_gsc_metrics(
    p_user_id UUID,
    p_site_url TEXT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    totalClicks BIGINT,
    totalImpressions BIGINT,
    avgCtr FLOAT,
    avgPosition FLOAT
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(clicks), 0) AS totalClicks,
        COALESCE(SUM(impressions), 0) AS totalImpressions,
        CASE WHEN SUM(impressions) > 0 THEN COALESCE(SUM(clicks)::FLOAT / SUM(impressions), 0) ELSE 0 END AS avgCtr,
        COALESCE(AVG("position"), 0) AS avgPosition
    FROM gsc_data
    WHERE 
        user_id = p_user_id 
        AND site_url = p_site_url
        AND date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function to get top queries by clicks
CREATE OR REPLACE FUNCTION get_top_queries(
    p_user_id UUID,
    p_site_url TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    query TEXT,
    clicks BIGINT,
    impressions BIGINT,
    ctr FLOAT,
    "position" FLOAT
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gsc_data.query,
        COALESCE(SUM(clicks), 0) AS clicks,
        COALESCE(SUM(impressions), 0) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN COALESCE(SUM(clicks)::FLOAT / SUM(impressions), 0) ELSE 0 END AS ctr,
        COALESCE(AVG("position"), 0) AS "position"
    FROM gsc_data
    WHERE 
        user_id = p_user_id 
        AND site_url = p_site_url
        AND date BETWEEN p_start_date AND p_end_date
    GROUP BY query
    ORDER BY clicks DESC
    LIMIT p_limit;
END;
$$;

-- Function to get keyword ranking history
CREATE OR REPLACE FUNCTION get_keyword_ranking_history(
    p_user_id UUID,
    p_site_url TEXT,
    p_query TEXT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    date DATE,
    "position" FLOAT,
    clicks INTEGER,
    impressions INTEGER
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gsc_data.date,
        gsc_data."position",
        gsc_data.clicks,
        gsc_data.impressions
    FROM gsc_data
    WHERE 
        user_id = p_user_id 
        AND site_url = p_site_url
        AND query = p_query
        AND date BETWEEN p_start_date AND p_end_date
    ORDER BY date ASC;
END;
$$; 