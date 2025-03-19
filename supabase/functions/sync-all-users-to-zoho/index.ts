
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
    const { employerId } = await req.json();
    
    if (!employerId) {
      throw new Error('Employer ID is required');
    }
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not set');
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get employer's Zoho credentials
    const { data: employerData, error: empError } = await supabase
      .from('zoho_credentials')
      .select('*')
      .eq('user_id', employerId)
      .single();
      
    if (empError) {
      throw empError;
    }
    
    if (!employerData || !employerData.access_token) {
      throw new Error('Employer not connected to Zoho CRM');
    }
    
    // Check if token needs refresh
    let accessToken = employerData.access_token;
    const now = new Date();
    const tokenExpires = new Date(employerData.expires_at);
    
    if (tokenExpires <= now) {
      console.log('Refreshing Zoho access token');
      
      const clientId = Deno.env.get('ZOHO_CLIENT_ID');
      const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
      
      const refreshResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: employerData.refresh_token,
        }),
      });
      
      const refreshData = await refreshResponse.json();
      
      if (!refreshResponse.ok || !refreshData.access_token) {
        throw new Error('Failed to refresh Zoho access token');
      }
      
      // Update token in database
      const { error: updateError } = await supabase
        .from('zoho_credentials')
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('user_id', employerId);
        
      if (updateError) {
        throw updateError;
      }
      
      accessToken = refreshData.access_token;
    }
    
    // Get all profiles with role=applicant
    const { data: applicants, error: applicantsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'applicant');
    
    if (applicantsError) {
      throw applicantsError;
    }
    
    if (!applicants || applicants.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No applicants found to sync',
        count: 0
      }), { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      });
    }
    
    // Prepare leads data
    const leads = applicants.map(applicant => ({
      Last_Name: applicant.full_name || "Job Applicant",
      First_Name: applicant.full_name?.split(' ')[0] || "",
      Email: applicant.email || "",
      Phone: applicant.phone_number || "",
      Lead_Source: "Job Platform Import",
      Company: applicant.university || "Job Applicant",
      Description: `Imported applicant profile\n\nUniversity: ${applicant.university || 'N/A'}\nField of Study: ${applicant.field_of_study || 'N/A'}\nLocation: ${applicant.location || 'N/A'}`,
    }));
    
    // Send to Zoho CRM in batches of 100 (Zoho limit)
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      const zohoResponse = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: batch }),
      });
      
      const zohoResult = await zohoResponse.json();
      
      if (!zohoResponse.ok) {
        console.error('Zoho API error:', zohoResult);
        throw new Error(`Failed to create leads in Zoho CRM: ${JSON.stringify(zohoResult)}`);
      }
      
      results.push(zohoResult);
      
      // Small delay to avoid rate limits
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully synced ${leads.length} applicants to Zoho CRM`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully synced ${leads.length} applicants to Zoho CRM`,
      count: leads.length,
      results
    }), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  } catch (error) {
    console.error('Error syncing users to Zoho:', error);
    
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
