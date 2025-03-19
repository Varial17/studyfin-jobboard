
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'

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
    const { userId } = await req.json();
    
    // Get environment variables
    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!clientId || !clientSecret) {
      throw new Error('ZOHO credentials are not set');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not set');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the existing tokens
    const { data: credentials, error: fetchError } = await supabase
      .from('zoho_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (credentials && credentials.access_token) {
      try {
        // Attempt to revoke the token
        await fetch('https://accounts.zoho.com/oauth/v2/token/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: credentials.access_token,
          }),
        });
        
        console.log('Revoked Zoho access token');
      } catch (error) {
        console.error('Error revoking Zoho token:', error);
        // Continue even if token revocation fails
      }
    }
    
    // Delete the stored credentials
    const { error: deleteError } = await supabase
      .from('zoho_credentials')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('Successfully deleted Zoho credentials for user');
    
    return new Response(JSON.stringify({ 
      success: true 
    }), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  } catch (error) {
    console.error('Error disconnecting from Zoho:', error);
    
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
