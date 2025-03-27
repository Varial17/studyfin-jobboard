
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

console.log("Create Payment Intent Function Initializing...")

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
    
    console.log(`Creating payment intent for user: ${user_id}`)
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, avatar_url, full_name')
      .eq('id', user_id)
      .single()
      
    if (profileError || !profile) {
      throw new Error(`User profile not found: ${profileError?.message || 'Unknown error'}`)
    }
    
    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase
      .auth.admin.getUserById(user_id)
      
    if (userError || !userData || !userData.user) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`)
    }
    
    const userEmail = userData.user.email
    
    if (!userEmail) {
      throw new Error('User email not found')
    }
    
    // Set the price ID based on environment
    const liveMode = Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_live')
    const priceId = liveMode
      ? 'price_1R74AOA1u9Lm91Tyrg2C0ooM' // Live mode price
      : 'price_1R6dGHA1u9Lm91TyQzUZ2aJo' // Test mode price
      
    console.log(`Using price ID: ${priceId}`)
    
    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: userEmail, // Add the email here
      metadata: {
        user_id: user_id,
        price_id: priceId,
        subscription: true,
      }
    })
    
    console.log(`Payment intent created with ID: ${paymentIntent.id}`)
    
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        customerEmail: userEmail // Send email back to client
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(`Error creating payment intent: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
