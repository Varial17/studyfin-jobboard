import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id || session.client_reference_id;

      if (userId) {
        console.log(`Updating role for user: ${userId}`);
        
        // Update the user's profile to set them as an employer
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: 'employer',
            subscription_id: session.subscription,
            subscription_status: 'active'
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating user profile:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update user profile' }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else if (event.type === 'customer.subscription.deleted' || 
               event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      
      // Find the user profile with this subscription ID
      const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_id', subscription.id)
        .single();
      
      if (findError || !profiles) {
        console.error('Error finding profile with subscription:', findError);
      } else {
        const userId = profiles.id;
        
        // If subscription is canceled or unpaid, remove employer status
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          const { error } = await supabase
            .from('profiles')
            .update({ 
              role: 'applicant',
              subscription_status: subscription.status
            })
            .eq('id', userId);
            
          if (error) {
            console.error('Error updating profile after subscription change:', error);
          }
        } else {
          // Otherwise just update the status
          const { error } = await supabase
            .from('profiles')
            .update({ subscription_status: subscription.status })
            .eq('id', userId);
            
          if (error) {
            console.error('Error updating subscription status:', error);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
