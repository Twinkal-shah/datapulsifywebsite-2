import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Get Shared Report Config Edge Function initializing.');

// Utility function to format GSC property URL
function formatGSCPropertyUrl(gscProperty: string): string {
  if (!gscProperty) return '';
  
  // If it's already in sc-domain: format, return as is
  if (gscProperty.startsWith('sc-domain:')) {
    return gscProperty;
  }
  
  // Remove any trailing slashes
  const cleanProperty = gscProperty.replace(/\/+$/, '');
  
  // If it already starts with http:// or https://, return as is
  if (/^https?:\/\//i.test(cleanProperty)) {
    return cleanProperty;
  }
  
  // Add https:// prefix
  return `https://${cleanProperty}`;
}

Deno.serve(async (req) => {
  // Always add CORS headers to all responses
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for get-shared-report-config');
    return new Response('ok', { headers: responseHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.pathname.split('/').pop();

    console.log(`Received request for get-shared-report-config with token: ${token}`);

    if (!token) {
      console.error('Token missing from request URL.');
      return new Response(
        JSON.stringify({ error: 'Token is required in the URL path.' }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Create a public Supabase client using the anon key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use anon key instead of service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Enable RLS bypass for this specific query
    const { data, error } = await supabase
      .from('shared_reports')
      .select('gsc_property, components, filters, created_at, gsc_data')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Supabase select error:', error);
      return new Response(
        JSON.stringify({ error: 'Report not found or has expired.' }),
        { status: 404, headers: responseHeaders }
      );
    }

    if (!data) {
      console.log(`No shared report found for token: ${token}`);
      return new Response(
        JSON.stringify({ error: 'Shared report not found or has expired.' }),
        { status: 404, headers: responseHeaders }
      );
    }

    console.log('Raw data from database:', data);
    console.log('GSC data from database:', data.gsc_data);

    // Format the GSC property URL
    const formattedGscProperty = formatGSCPropertyUrl(data.gsc_property);

    // Transform the data to match the frontend interface
    const transformedData = {
      gscProperty: formattedGscProperty,
      components: data.components,
      filters: data.filters,
      created_at: data.created_at,
      gscData: data.gsc_data
    };

    console.log('Transformed data being sent to frontend:', transformedData);

    return new Response(
      JSON.stringify(transformedData),
      { status: 200, headers: responseHeaders }
    );

  } catch (e) {
    console.error('Error in get-shared-report-config:', e);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500, headers: responseHeaders }
    );
  }
});

console.log('Get Shared Report Config Edge Function setup complete. Waiting for requests...'); 