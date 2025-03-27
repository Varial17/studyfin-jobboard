
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

console.log("Create Checkout Session Function Initializing...")

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    
    if (!user_id) {
      throw new Error('User ID is required')
    }
    
    console.log(`Creating checkout session for user: ${user_id}`)
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16; custom_checkout_beta=v1',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get user email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()
      
    if (profileError || !profile) {
      throw new Error(`User profile not found: ${profileError?.message || 'Unknown error'}`)
    }
    
    // Generate a unique idempotency key
    const idempotencyKey = crypto.randomUUID()
    
    // Set the price ID based on environment
    const liveMode = Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_live')
    const priceId = liveMode
      ? 'price_1R74AOA1u9Lm91Tyrg2C0ooM' // Live mode price
      : 'price_1R6dGHA1u9Lm91TyQzUZ2aJo' // Test mode price
      
    console.log(`Using price ID: ${priceId}`)
    
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      ui_mode: 'custom',
      client_reference_id: user_id,
      success_url: `${req.headers.get('origin') || 'https://jobs.studyfin.com.au'}/settings?success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://jobs.studyfin.com.au'}/settings?canceled=true`,
    }, {
      idempotencyKey
    })
    
    console.log(`Checkout session created with ID: ${session.id}`)
    
    return new Response(
      JSON.stringify({ 
        checkoutSessionClientSecret: session.client_secret
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(`Error creating checkout session: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
