
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    // If there's no path in the URL, assume it's the main create-checkout endpoint
    const endpoint = path || "create-checkout";
    
    console.log(`Stripe function called with endpoint: ${endpoint}`);
    
    // Parse the request body
    const { user_id, return_url } = await req.json();
    
    console.log(`Request data: user_id=${user_id}, return_url=${return_url}`);

    if (!user_id) {
      throw new Error("user_id is required");
    }

    if (endpoint === "create-checkout") {
      // Create a checkout session for a new subscription
      const priceId = Deno.env.get("STRIPE_EMPLOYER_PRICE_ID");
      if (!priceId) {
        throw new Error("STRIPE_EMPLOYER_PRICE_ID is not set");
      }
      
      console.log(`Creating checkout session with price ID: ${priceId}`);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${return_url}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${return_url}?success=false`,
        client_reference_id: user_id,
      });

      console.log(`Checkout session created: ${session.id}`);

      return new Response(JSON.stringify({ id: session.id, url: session.url }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } 
    else if (endpoint === "customer-portal") {
      // First, find the customer associated with the user
      const { data: customers } = await stripe.customers.list({
        email: user_id,
        limit: 1,
      });
      
      let customer = customers[0];
      
      // Create a customer if they don't exist
      if (!customer) {
        throw new Error("Customer not found. User needs to create a subscription first.");
      }

      console.log(`Found customer: ${customer.id}`);

      // Create a billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: return_url,
      });

      console.log(`Created billing portal session: ${session.url}`);

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    else if (endpoint === "webhook") {
      // Handle webhook events from Stripe
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        throw new Error("Missing stripe-signature header");
      }

      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not set");
      }

      const body = await req.text();
      let event;

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }

      // Handle the event based on its type
      console.log(`Processing webhook event: ${event.type}`);

      const { data: { object } } = event;
      const clientReferenceId = object.client_reference_id;

      // Handle subscription related events
      if (event.type === 'checkout.session.completed') {
        if (object.mode === 'subscription') {
          const subscriptionId = object.subscription;
          console.log(`User ${clientReferenceId} created subscription: ${subscriptionId}`);
          
          // Update the user's profile with subscription info in Supabase
          const supabaseAdminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          
          if (!supabaseAdminKey || !supabaseUrl) {
            throw new Error("Supabase admin credentials not configured");
          }
          
          const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${clientReferenceId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAdminKey}`,
              'apikey': supabaseAdminKey
            },
            body: JSON.stringify({
              role: 'employer',
              subscription_id: subscriptionId,
              subscription_status: 'active'
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update user profile: ${await response.text()}`);
          }
          
          console.log(`Updated profile for user ${clientReferenceId} with subscription ${subscriptionId}`);
        }
      } 
      else if (event.type === 'customer.subscription.updated') {
        const subscriptionId = object.id;
        const status = object.status;
        
        // Find the user with this subscription ID and update their status
        const supabaseAdminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        
        if (!supabaseAdminKey || !supabaseUrl) {
          throw new Error("Supabase admin credentials not configured");
        }
        
        // First, find the user with this subscription ID
        const getUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?subscription_id=eq.${subscriptionId}`, {
          headers: {
            'Authorization': `Bearer ${supabaseAdminKey}`,
            'apikey': supabaseAdminKey
          }
        });
        
        if (!getUserResponse.ok) {
          throw new Error(`Failed to find user with subscription ${subscriptionId}`);
        }
        
        const users = await getUserResponse.json();
        if (users.length > 0) {
          const userId = users[0].id;
          
          // Update the user's subscription status
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAdminKey}`,
              'apikey': supabaseAdminKey
            },
            body: JSON.stringify({
              subscription_status: status
            })
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update subscription status: ${await updateResponse.text()}`);
          }
          
          console.log(`Updated subscription status to ${status} for user ${userId}`);
        }
      } 
      else if (event.type === 'customer.subscription.deleted') {
        const subscriptionId = object.id;
        
        // Find the user with this subscription ID and update their status
        const supabaseAdminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        
        if (!supabaseAdminKey || !supabaseUrl) {
          throw new Error("Supabase admin credentials not configured");
        }
        
        // First, find the user with this subscription ID
        const getUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?subscription_id=eq.${subscriptionId}`, {
          headers: {
            'Authorization': `Bearer ${supabaseAdminKey}`,
            'apikey': supabaseAdminKey
          }
        });
        
        if (!getUserResponse.ok) {
          throw new Error(`Failed to find user with subscription ${subscriptionId}`);
        }
        
        const users = await getUserResponse.json();
        if (users.length > 0) {
          const userId = users[0].id;
          
          // Update the user's profile - set subscription to inactive and role back to applicant
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAdminKey}`,
              'apikey': supabaseAdminKey
            },
            body: JSON.stringify({
              role: 'applicant',
              subscription_status: 'inactive'
            })
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update user profile after subscription canceled: ${await updateResponse.text()}`);
          }
          
          console.log(`Set user ${userId} back to applicant role after subscription canceled`);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in stripe-subscription function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
