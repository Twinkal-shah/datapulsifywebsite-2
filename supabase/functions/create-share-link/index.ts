import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9';
import { corsHeaders } from '../_shared/cors.ts'; // We'll create this shared CORS file next

console.log('Create Share Link Edge Function initializing.');

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

// Validate GSC property URL
function validateGSCPropertyUrl(url: string): boolean {
  if (!url) return false;
  
  // Allow sc-domain: format
  if (url.startsWith('sc-domain:')) {
    const domain = url.replace('sc-domain:', '');
    return domain.includes('.') && domain.length > 3; // Basic domain validation
  }
  
  try {
    // Try to create a URL object to validate the URL format
    const urlObj = new URL(url);
    // Check if it has a valid hostname
    return !!urlObj.hostname && urlObj.hostname.includes('.');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for create-share-link');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received request for create-share-link');
    const { // Ensure these match what the frontend will send
      gscProperty,
      selectedComponents,
      filters,
      gscData // Add GSC data to the request
    } = await req.json();

    console.log('Request payload:', { gscProperty, selectedComponents, filters, gscData });

    if (!gscProperty || !selectedComponents || !filters || !gscData) {
      console.error('Missing required fields in request.');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gscProperty, selectedComponents, filters, and gscData are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the raw GSC property from the request
    console.log('Raw GSC property from request:', gscProperty);

    // Format and validate the GSC property URL
    const formattedGscProperty = formatGSCPropertyUrl(gscProperty);
    console.log('Formatted GSC property:', formattedGscProperty);

    if (!formattedGscProperty || !validateGSCPropertyUrl(formattedGscProperty)) {
      console.error('Invalid GSC property URL:', gscProperty);
      return new Response(
        JSON.stringify({ error: 'Invalid GSC property URL provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = uuidv4(); // Generate a unique token
    console.log(`Generated token: ${token}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase admin client initialized.');

    // Log the data being inserted
    const insertData = {
      token: token,
      gsc_property: formattedGscProperty,
      components: selectedComponents,
      filters: filters,
      gsc_data: gscData // Store GSC data in the database
    };
    console.log('Data being inserted:', insertData);

    const { data, error } = await supabaseAdmin
      .from('shared_reports')
      .insert(insertData)
      .select('token, gsc_property, gsc_data') // Select GSC data to verify
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully inserted shared report. Returned data:', data);

    // Verify the GSC property was stored correctly
    if (!data.gsc_property) {
      console.error('GSC property was not stored correctly:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to store GSC property correctly.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the full shareable URL
    // Ensure you have FRONTEND_URL set in your Supabase project's environment variables for Edge Functions
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8081'; // Default for local dev
    const shareUrl = `${frontendUrl}/share/${data.token}`;
    console.log(`Constructed share URL: ${shareUrl}`);

    return new Response(
      JSON.stringify({ shareUrl: shareUrl, token: data.token }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('Catch-all error in create-share-link function:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'An unexpected error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

console.log('Create Share Link Edge Function setup complete. Waiting for requests...'); 