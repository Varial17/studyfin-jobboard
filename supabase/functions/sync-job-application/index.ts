
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
    const { applicationId } = await req.json();
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not set');
    }
    
    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get application details including job and applicant information
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (*),
        profiles:applicant_id (*)
      `)
      .eq('id', applicationId)
      .single();
      
    if (appError) {
      throw appError;
    }
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    // Get employer info and Zoho credentials
    const { data: employerData, error: empError } = await supabase
      .from('zoho_credentials')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('user_id', application.jobs.employer_id)
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
        .eq('user_id', application.jobs.employer_id);
        
      if (updateError) {
        throw updateError;
      }
      
      accessToken = refreshData.access_token;
    }
    
    // Create lead in Zoho CRM
    const applicant = application.profiles;
    const job = application.jobs;
    
    const leadData = {
      data: [
        {
          Last_Name: applicant.full_name || "Job Applicant",
          First_Name: applicant.full_name?.split(' ')[0] || "",
          Email: applicant.email || "",
          Phone: applicant.phone || "",
          Lead_Source: "Job Application",
          Company: "Job Applicant",
          Description: `Applied for: ${job.title} at ${job.company}\n\nCover Letter:\n${application.cover_letter || "No cover letter provided"}`,
        }
      ]
    };
    
    // Send to Zoho CRM
    const zohoResponse = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });
    
    const zohoResult = await zohoResponse.json();
    
    if (!zohoResponse.ok) {
      console.error('Zoho API error:', zohoResult);
      throw new Error('Failed to create lead in Zoho CRM');
    }
    
    console.log('Successfully created lead in Zoho CRM');
    
    // Update application to mark as synced
    const { error: updateAppError } = await supabase
      .from('applications')
      .update({ zoho_synced: true })
      .eq('id', applicationId);
      
    if (updateAppError) {
      throw updateAppError;
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      zohoData: zohoResult
    }), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    });
  } catch (error) {
    console.error('Error syncing application to Zoho:', error);
    
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
