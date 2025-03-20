
// Follow us: https://twitter.com/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  // This is necessary to use the Fetch API rather than relying on the Node http package
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

console.log("Stripe Edge Function Initialized")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestUrl = new URL(req.url)
    const path = requestUrl.pathname.split('/').pop()

    console.log(`Request received: ${req.method} ${path}`)

    // Customer Portal endpoint
    if (path === 'customer-portal') {
      return await handleCustomerPortal(req)
    }

    // Main subscription endpoint (default)
    const { user_id, return_url } = await req.json()

    if (!user_id) {
      throw new Error('user_id is required')
    }

    if (!return_url) {
      throw new Error('return_url is required')
    }

    // Get the price ID from environment variables
    const priceId = Deno.env.get('STRIPE_EMPLOYER_PRICE_ID')
    if (!priceId) {
      throw new Error('STRIPE_EMPLOYER_PRICE_ID is not configured in environment variables')
    }

    console.log(`Creating checkout session for user: ${user_id}, priceId: ${priceId}`)

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${return_url}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?success=false`,
      client_reference_id: user_id,
      customer_email: user_id, // Using email as identifier
    })

    console.log(`Checkout session created: ${session.id}`)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error(`Error in Stripe checkout: ${error.message}`)
    console.error(error)
    
    // Create a more descriptive error response
    let errorMessage = error.message
    let statusCode = 500
    
    if (error.message.includes('No such price')) {
      errorMessage = 'Invalid Stripe price ID. Make sure you are using the correct test/live price ID matching your API key mode.'
      statusCode = 400
    } else if (error.message.includes('API key')) {
      errorMessage = 'Invalid Stripe API key. Check if your API key is valid and matches the expected mode (test/live).'
      statusCode = 401
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.stack || 'No additional details available'
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

async function handleCustomerPortal(req) {
  try {
    const { user_id, return_url } = await req.json()
    
    if (!user_id) {
      throw new Error('user_id is required')
    }
    
    if (!return_url) {
      throw new Error('return_url is required')
    }
    
    console.log(`Looking up customer for user: ${user_id}`)
    
    // Look up the Stripe customer ID by email (user_id)
    const customers = await stripe.customers.list({
      email: user_id,
      limit: 1,
    })
    
    if (!customers.data.length) {
      throw new Error('No customer found with the provided email')
    }
    
    const customerId = customers.data[0].id
    console.log(`Found customer: ${customerId}`)
    
    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url,
    })
    
    console.log(`Customer portal session created: ${session.id}`)
    
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error(`Error in customer portal: ${error.message}`)
    console.error(error)
    
    let errorMessage = error.message
    let statusCode = 500
    
    if (error.message.includes('No customer found')) {
      errorMessage = 'No subscription found for this user. You need to subscribe first before managing subscriptions.'
      statusCode = 404
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.stack || 'No additional details available'
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
