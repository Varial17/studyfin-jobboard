
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
  console.log("sync-all-users-to-zoho function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { employerId } = requestBody;
    
    if (!employerId) {
      console.error("Error: Employer ID is required");
      throw new Error('Employer ID is required');
    }
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Error: Supabase credentials are not set");
      throw new Error('Supabase credentials are not set');
    }
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 10)}...`);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get employer's Zoho credentials
    console.log(`Fetching Zoho credentials for employer: ${employerId}`);
    const { data: employerData, error: empError } = await supabase
      .from('zoho_credentials')
      .select('*')
      .eq('user_id', employerId)
      .single();
      
    if (empError) {
      console.error("Error fetching Zoho credentials:", empError);
      throw empError;
    }
    
    if (!employerData || !employerData.access_token) {
      console.error("Error: Employer not connected to Zoho CRM");
      throw new Error('Employer not connected to Zoho CRM');
    }
    
    console.log("Successfully fetched Zoho credentials");
    
    // Check if token needs refresh
    let accessToken = employerData.access_token;
    const now = new Date();
    const tokenExpires = new Date(employerData.expires_at);
    
    if (tokenExpires <= now) {
      console.log('Refreshing Zoho access token');
      
      const clientId = Deno.env.get('ZOHO_CLIENT_ID');
      const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        console.error("Error: Zoho API credentials not found in environment");
        throw new Error('Zoho API credentials not found');
      }
      
      console.log(`Refreshing token with client ID: ${clientId.substring(0, 5)}...`);
      
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
        console.error("Error refreshing token:", refreshData);
        throw new Error('Failed to refresh Zoho access token');
      }
      
      console.log("Successfully refreshed Zoho access token");
      
      // Update token in database
      const { error: updateError } = await supabase
        .from('zoho_credentials')
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('user_id', employerId);
        
      if (updateError) {
        console.error("Error updating token in database:", updateError);
        throw updateError;
      }
      
      accessToken = refreshData.access_token;
      console.log("Updated token in database");
    }
    
    // Get all profiles with role=applicant
    console.log("Fetching applicants from database");
    const { data: applicants, error: applicantsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'applicant');
    
    if (applicantsError) {
      console.error("Error fetching applicants:", applicantsError);
      throw applicantsError;
    }
    
    console.log(`Found ${applicants?.length || 0} applicants to sync`);
    
    if (!applicants || applicants.length === 0) {
      console.log("No applicants found to sync");
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
    console.log("Preparing leads data for Zoho CRM");
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
    
    console.log(`Sending ${leads.length} leads to Zoho CRM in batches of ${batchSize}`);
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} with ${batch.length} leads`);
      
      try {
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
        
        console.log(`Successfully processed batch ${i/batchSize + 1}`);
        results.push(zohoResult);
      } catch (error) {
        console.error(`Error in batch ${i/batchSize + 1}:`, error);
        throw error;
      }
      
      // Small delay to avoid rate limits
      if (i + batchSize < leads.length) {
        console.log("Adding delay between batches to avoid rate limits");
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

