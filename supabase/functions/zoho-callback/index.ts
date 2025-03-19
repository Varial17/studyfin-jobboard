
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
    const { code, redirectUrl, userId } = await req.json();
    
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
    
    if (!code || !redirectUrl || !userId) {
      throw new Error('Missing required parameters');
    }
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUrl,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Error exchanging code for token:', tokenData);
      throw new Error(tokenData.error || 'Failed to exchange authorization code');
    }
    
    console.log('Successfully obtained Zoho tokens');
    
    // Store tokens in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: existingData, error: fetchError } = await supabase
      .from('zoho_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    const zohoData = {
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    };
    
    let storeError;
    
    if (existingData) {
      // Update existing record
      const { error } = await supabase
        .from('zoho_credentials')
        .update(zohoData)
        .eq('user_id', userId);
        
      storeError = error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('zoho_credentials')
        .insert(zohoData);
        
      storeError = error;
    }
    
    if (storeError) {
      throw storeError;
    }
    
    console.log('Successfully stored Zoho credentials for user');
    
    return new Response(JSON.stringify({ 
      success: true 
    }), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  } catch (error) {
    console.error('Error processing Zoho callback:', error);
    
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
