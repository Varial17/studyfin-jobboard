
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { redirectUrl } = await req.json();
    
    // Get environment variables
    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const scope = 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL';
    
    if (!clientId) {
      throw new Error('ZOHO_CLIENT_ID environment variable is not set');
    }
    
    if (!redirectUrl) {
      throw new Error('Redirect URL is required');
    }
    
    // Construct the authorization URL
    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    console.log('Generated Zoho auth URL:', authUrl);
    
    return new Response(JSON.stringify({ 
      success: true,
      authUrl 
    }), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  } catch (error) {
    console.error('Error generating Zoho auth URL:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      message: error.message 
    }), { 
      status: 400, 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  }
})
