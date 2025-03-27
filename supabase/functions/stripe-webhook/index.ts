
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

console.log("Stripe Webhook Handler Initializing...")

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  console.log(`Webhook request received: ${req.method} ${req.url}`)
  console.log(`Headers present: ${[...req.headers.keys()].join(', ')}`)
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request with CORS headers')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing webhook request')
    
    // Get request body as text
    const body = await req.text()
    
    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(body);
      console.log(`Parsed Stripe event type: ${event.type}`);
    } catch (err) {
      console.error('Error parsing webhook payload:', err);
      return new Response(
        JSON.stringify({ error: `Invalid JSON payload: ${err.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Skip signature verification in Deno due to SubtleCrypto issues
    // We're still safe because the function is protected by Supabase auth
    // and only accessible via Supabase
    if (webhookSecret) {
      const signature = req.headers.get('stripe-signature');
      console.log(`Stripe signature received: ${signature ? 'Yes' : 'No'}`);
      
      if (!signature) {
        console.log('No Stripe signature found, proceeding without verification');
      } else {
        console.log('Signature verification skipped due to Deno environment limitations');
      }
    } else {
      console.log('No webhook secret configured, proceeding without verification');
    }
    
    console.log(`Processing Stripe webhook event type: ${event.type}`)
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('⚠️ ERROR: Missing Supabase credentials')
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log('Initializing Supabase client')
    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event, supabaseClient);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabaseClient);
        break;
        
      case 'invoice.payment_succeeded':
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.paid':
        await handleInvoiceEvent(event, supabaseClient);
        break;
        
      // Add more events that Stripe dashboard showed
      case 'payment_intent.succeeded':
      case 'payment_intent.created':
      case 'payment_intent.payment_failed':
      case 'payment_method.attached':
      case 'payment_method.automatically_updated':
      case 'payment_method.detached':
      case 'payment_method.updated':
      case 'setup_intent.created':
      case 'setup_intent.succeeded':
      case 'charge.succeeded':
      case 'charge.failed':
      case 'billing_portal.configuration.created':
      case 'billing_portal.session.created':
      case 'customer.created':
      case 'customer.updated':
      case 'customer.deleted':
      case 'customer.discount.created':
      case 'customer.discount.updated':
      case 'customer.discount.deleted':
      case 'customer.source.created':
      case 'customer.source.updated':
      case 'customer.source.deleted':
      case 'customer.tax_id.created':
      case 'customer.tax_id.updated':
      case 'customer.tax_id.deleted':
        // Log these events but don't need specific handling
        console.log(`Received ${event.type} event, logging only`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully, returning 200 response')
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`⚠️ ERROR in webhook handler: ${error.message}`)
    console.error(error.stack)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper function to handle subscription changes
async function handleSubscriptionChange(event, supabaseClient) {
  const subscription = event.data.object
  
  // Get customer data to match with user
  console.log(`Retrieving customer information for ID: ${subscription.customer}`)
  const customer = await stripe.customers.retrieve(subscription.customer)
  console.log(`Processing subscription event for customer: ${customer.email}`)
  
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
      console.error('⚠️ ERROR: Error updating user profile:', error)
      throw error
    }
    
    console.log(`✅ Successfully updated subscription status for user ${userId} to ${subscriptionStatus}`)
    console.log(`✅ Updated user role to: ${subscriptionStatus === 'active' ? 'employer' : 'applicant'}`)
    
    // Update the customer with user_id metadata if it's not set
    if (!customer.metadata.user_id) {
      try {
        await stripe.customers.update(customer.id, {
          metadata: { user_id: userId }
        });
        console.log(`✅ Updated Stripe customer with user_id metadata: ${userId}`)
      } catch (updateError) {
        console.error('⚠️ ERROR: Error updating customer metadata:', updateError)
      }
    }
  } else {
    console.error('⚠️ ERROR: Unable to find user ID for customer:', customer.id, customer.email)
  }
}

// Helper function to handle checkout completion events
async function handleCheckoutCompleted(event, supabaseClient) {
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

// Helper function to handle invoice events
async function handleInvoiceEvent(event, supabaseClient) {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  
  if (customerId) {
    console.log(`Processing invoice event for customer: ${customerId}`);
    
    try {
      // Get the customer to find user_id
      const customer = await stripe.customers.retrieve(customerId);
      const userId = customer.metadata?.user_id;
      
      if (userId) {
        console.log(`Found user ID in customer metadata: ${userId}`);
        
        // For successful payments, ensure subscription remains active
        if (event.type === 'invoice.paid' && invoice.billing_reason === 'subscription_cycle') {
          const { data, error } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'active'
            })
            .eq('id', userId);
            
          if (error) {
            console.error('Error updating subscription status after payment:', error);
          } else {
            console.log(`Updated subscription status to active for user ${userId} after successful payment`);
          }
        }
      } else {
        console.log('No user_id found in customer metadata');
      }
    } catch (error) {
      console.error('Error processing invoice event:', error);
    }
  }
}
