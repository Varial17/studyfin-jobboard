
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
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing Stripe signature in headers. Headers received:', Object.fromEntries([...req.headers.entries()]))
      return new Response(
        JSON.stringify({ error: 'Missing Stripe signature', code: 401 }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return new Response(
        JSON.stringify({ error: 'Missing STRIPE_WEBHOOK_SECRET environment variable' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body as text for signature verification
    const body = await req.text()
    
    // Log minimal request information for debugging
    console.log(`Webhook request received: ${req.method}`)
    console.log(`Headers present: ${[...req.headers.keys()].join(', ')}`)
    console.log(`Signature length: ${signature ? signature.length : 'missing'}`)
    
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
        JSON.stringify({ error: 'Webhook signature verification failed', details: err.message }),
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
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object
      
      // Get customer data to match with user
      const customer = await stripe.customers.retrieve(subscription.customer)
      console.log(`Processing subscription created event for customer: ${customer.email}`)
      
      // Set the subscription status and ID
      const subscriptionStatus = subscription.status
      const subscriptionId = subscription.id
      
      // Save customer metadata for debugging
      console.log(`Customer metadata:`, customer.metadata)
      
      // Determine which user ID to use - from metadata or lookup by email
      let userId = customer.metadata?.user_id
      
      if (!userId && customer.email) {
        // If no user_id in metadata, try to find the user by email
        console.log(`No user_id in metadata, looking up by email: ${customer.email}`)
        
        // First try exact match on id field
        const { data: userByIdData, error: userByIdError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', customer.email.split('@')[0])
          .single()
        
        if (!userByIdError && userByIdData) {
          userId = userByIdData.id
          console.log(`Found user by exact id match: ${userId}`)
        } else {
          // If no match on id, try finding by UUID match
          try {
            // Parse the customer email to see if it contains a valid UUID
            const emailParts = customer.email.split('@')
            const possibleUuid = emailParts[0]
            
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(possibleUuid)) {
              const { data: userData, error: userError } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('id', possibleUuid)
                .single()
              
              if (!userError && userData) {
                userId = userData.id
                console.log(`Found user by UUID in email: ${userId}`)
              }
            }
          } catch (error) {
            console.log('Error parsing email for UUID:', error)
          }
        }
      }
      
      if (userId) {
        console.log(`Updating subscription for user: ${userId}, status: ${subscriptionStatus}`)
        
        // Update the user's profile with subscription information and change role to employer
        const { data, error } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            subscription_id: subscriptionId,
            role: subscriptionStatus === 'active' ? 'employer' : 'applicant'
          })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating user profile:', error)
          throw error
        }
        
        console.log(`Successfully updated subscription status for user ${userId} to ${subscriptionStatus}`)
        console.log(`Updated user role to: ${subscriptionStatus === 'active' ? 'employer' : 'applicant'}`)
        
        // Update the customer with user_id metadata if it's not set
        if (!customer.metadata.user_id) {
          try {
            await stripe.customers.update(customer.id, {
              metadata: { user_id: userId }
            });
            console.log(`Updated Stripe customer with user_id metadata: ${userId}`)
          } catch (updateError) {
            console.error('Error updating customer metadata:', updateError)
          }
        }
      } else {
        console.error('Unable to find user ID for customer:', customer.id, customer.email)
      }
    } 
    else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object
      
      // Get customer data to match with user
      const customer = await stripe.customers.retrieve(subscription.customer)
      console.log(`Processing subscription updated event for customer: ${customer.email}`)
      
      // Set the subscription status and ID
      const subscriptionStatus = subscription.status
      const subscriptionId = subscription.id
      
      // Determine which user ID to use - from metadata or lookup by email
      let userId = customer.metadata?.user_id
      
      if (!userId && customer.email) {
        // If no user_id in metadata, try to find the user by email
        const { data: userData, error: userError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', customer.email.split('@')[0])
          .single()
        
        if (userError) {
          console.error('Error finding user by email:', userError)
        } else if (userData) {
          userId = userData.id
          console.log(`Found user by email: ${userId}`)
        }
      }
      
      if (userId) {
        console.log(`Updating subscription for user: ${userId}, status: ${subscriptionStatus}`)
        
        // Update the user's profile with subscription information
        const { data, error } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            subscription_id: subscriptionId,
            role: subscriptionStatus === 'active' ? 'employer' : 'applicant'
          })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating user profile:', error)
          throw error
        }
        
        console.log(`Successfully updated subscription status for user ${userId} to ${subscriptionStatus}`)
        console.log(`Updated user role to: ${subscriptionStatus === 'active' ? 'employer' : 'applicant'}`)
      } else {
        console.error('Unable to find user ID for customer:', customer.id)
      }
    } 
    else if (event.type === 'checkout.session.completed') {
      // Handle checkout completion events
      const session = event.data.object
      
      // Check if it's a subscription checkout
      if (session.mode === 'subscription') {
        console.log('Processing subscription checkout completion:', session.id)
        
        // Get the customer ID and client reference ID
        const customerId = session.customer
        const clientReferenceId = session.client_reference_id
        
        if (customerId && clientReferenceId) {
          console.log(`Processing checkout completion for user ID: ${clientReferenceId}`)
          
          // Retrieve the customer to get their email
          const customer = await stripe.customers.retrieve(customerId)
          
          // Update the user's profile to employer role
          const { data, error } = await supabaseClient
            .from('profiles')
            .update({
              role: 'employer',
              subscription_status: 'active',
              subscription_id: session.subscription
            })
            .eq('id', clientReferenceId)
          
          if (error) {
            console.error('Error updating user profile after checkout:', error)
            throw error
          }
          
          console.log(`Updated user ${clientReferenceId} role to employer after successful checkout`)
          
          // Also store the customer ID with user ID metadata if not already set
          if (customer && !customer.metadata.user_id) {
            await stripe.customers.update(customerId, {
              metadata: { user_id: clientReferenceId }
            })
            console.log(`Updated Stripe customer ${customerId} with user_id metadata`)
          }
        } else {
          console.error('Missing customer ID or client reference ID in checkout session')
          console.log('Session data:', JSON.stringify(session))
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
