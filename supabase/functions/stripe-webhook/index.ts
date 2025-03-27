
// Follow us: https://twitter.com/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

console.log("Stripe Webhook Handler Initialized")

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      throw new Error('Missing Stripe signature')
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    }

    // Get request body as text for signature verification
    const body = await req.text()
    
    // Verify webhook signature and extract the event
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Stripe webhook received: ${event.type}`)
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Handle specific event types
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object
      
      // Get customer data to match with user
      const customer = await stripe.customers.retrieve(subscription.customer)
      
      // Find matching user by email
      const email = customer.email
      
      if (email) {
        console.log(`Processing subscription event for customer: ${email}`)
        
        // Set the subscription status based on the event type
        let subscriptionStatus
        
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
            subscriptionStatus = subscription.status
            break
          case 'customer.subscription.deleted':
            subscriptionStatus = 'canceled'
            break
          default:
            subscriptionStatus = null
        }
        
        if (subscriptionStatus) {
          // Update the user's profile with subscription information
          const { data, error } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: subscriptionStatus,
              subscription_id: subscription.id,
              role: subscriptionStatus === 'active' ? 'employer' : 'applicant'
            })
            .eq('id', customer.metadata.user_id || '')
            .is('id', 'not.null')
          
          if (error) {
            console.error('Error updating user profile:', error)
            throw error
          }
          
          console.log(`Updated subscription status for user: ${subscriptionStatus}`)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`Error in webhook handler: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
