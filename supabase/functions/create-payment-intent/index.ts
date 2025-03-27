
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

console.log("Create Payment Intent Function Initialized")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { user_id } = await req.json()
    
    if (!user_id) {
      throw new Error('user_id is required')
    }
    
    // Get the price ID
    const priceId = Deno.env.get('STRIPE_EMPLOYER_PRICE_ID')
    if (!priceId) {
      throw new Error('STRIPE_EMPLOYER_PRICE_ID is not configured')
    }
    
    console.log(`Creating payment intent for user: ${user_id} with price: ${priceId}`)
    
    // Retrieve the price to get the amount
    const price = await stripe.prices.retrieve(priceId)
    
    if (!price.unit_amount) {
      throw new Error('Price does not have a unit amount')
    }
    
    // Look up existing customer or create a new one
    let customerId
    const customers = await stripe.customers.list({
      email: user_id,
      limit: 1,
    })
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      console.log(`Found existing customer: ${customerId}`)
    } else {
      const customer = await stripe.customers.create({
        email: user_id,
        metadata: { user_id }
      })
      customerId = customer.id
      console.log(`Created new customer: ${customerId}`)
    }
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })
    
    const invoice = subscription.latest_invoice
    
    if (typeof invoice === 'string') {
      throw new Error('Invoice object not expanded properly')
    }
    
    const paymentIntent = invoice.payment_intent
    
    if (typeof paymentIntent === 'string') {
      throw new Error('Payment intent not expanded properly')
    }
    
    console.log(`Created subscription and payment intent: ${paymentIntent.id}`)
    
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
