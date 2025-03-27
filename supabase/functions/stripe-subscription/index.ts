// Follow us: https://twitter.com/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Initialize Stripe with more detailed error logging
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  console.error("ERROR: STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

console.log("Stripe Edge Function Initialized")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate Stripe Key is present
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables. Please add it to your Supabase Edge Function secrets.');
    }

    const requestUrl = new URL(req.url)
    const path = requestUrl.pathname.split('/').pop()

    console.log(`Request received: ${req.method} ${path}`)
    console.log(`Request URL: ${req.url}`)

    // Customer Portal endpoint
    if (path === 'customer-portal') {
      return await handleCustomerPortal(req)
    }

    // Main subscription endpoint (default)
    const { user_id, return_url, user_email, coupon_id } = await req.json()
    
    const userEmail = user_email || user_id; // Use user_email if provided, otherwise use user_id as email

    console.log(`Request data: user_id=${user_id}, user_email=${userEmail}, return_url=${return_url}, coupon_id=${coupon_id || 'none'}`)

    if (!user_id) {
      throw new Error('user_id is required')
    }

    if (!return_url) {
      throw new Error('return_url is required')
    }

    // Get the price ID from environment variables
    const priceId = "price_1R74AOA1u9Lm91Tyrg2C0ooM"
    
    console.log(`Using price ID: ${priceId}`)

    try {
      // Check API key mode (test or live)
      const keyMode = stripeKey.startsWith('sk_test') ? 'test' : 'live';
      console.log(`API key mode: ${keyMode}`);
      
      // Check price ID mode (test or live)
      const priceMode = priceId.startsWith('price_test') ? 'test' : (priceId.startsWith('price_') ? 'live' : 'invalid');
      console.log(`Price ID mode: ${priceMode}`);
      
      // Warn if modes don't match or if price ID format is invalid
      if (priceMode === 'invalid') {
        throw new Error(`Invalid price ID format: ${priceId}. Price IDs should start with 'price_' not 'prod_'. Please check your STRIPE_EMPLOYER_PRICE_ID environment variable.`);
      }
      
      if (priceMode !== 'invalid' && keyMode !== priceMode) {
        console.warn(`WARNING: API key mode (${keyMode}) doesn't match Price ID mode (${priceMode}). This will cause errors.`);
      }
      
      // Look up existing customer or create a new one with metadata
      let customerId;
      let customerHasMaxSubscriptions = false;
      
      try {
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          // Update customer with user_id in metadata if not already set
          if (!customers.data[0].metadata.user_id) {
            await stripe.customers.update(customerId, {
              metadata: { user_id: user_id }
            });
          }
          
          // Check if customer already has a subscription with this price
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            price: priceId,
            status: 'active',
            limit: 1
          });
          
          if (subscriptions.data.length > 0) {
            return new Response(
              JSON.stringify({
                error: "You already have an active subscription for this product."
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                }
              }
            );
          }
        } else {
          // Create new customer with user_id in metadata
          try {
            const customer = await stripe.customers.create({
              email: userEmail,
              metadata: { user_id: user_id }
            });
            customerId = customer.id;
          } catch (createCustomerError) {
            console.error(`Error creating customer: ${JSON.stringify(createCustomerError)}`);
            throw createCustomerError;
          }
        }
      } catch (customerError) {
        if (customerError.code === 'customer_max_subscriptions') {
          customerHasMaxSubscriptions = true;
          console.warn(`Customer ${userEmail} has reached the maximum number of subscriptions.`);
        } else {
          console.error(`Error retrieving/creating customer: ${JSON.stringify(customerError)}`);
          throw customerError;
        }
      }
      
      if (customerHasMaxSubscriptions) {
        return new Response(
          JSON.stringify({
            error: "You have reached the maximum number of subscriptions allowed. Please contact support."
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // Create checkout session options
      const sessionOptions = {
        customer: customerId,
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
        allow_promotion_codes: true, // Enable using promotion codes in the checkout
      };

      // If a specific coupon ID is provided, apply it automatically
      if (coupon_id) {
        console.log(`Applying coupon: ${coupon_id}`)
        try {
          // Verify the coupon exists and is valid
          const coupon = await stripe.coupons.retrieve(coupon_id);
          if (coupon) {
            sessionOptions.discounts = [
              {
                coupon: coupon_id,
              },
            ];
          }
        } catch (couponError) {
          console.warn(`Warning: Invalid coupon ID provided: ${coupon_id}. Proceeding without coupon.`);
          // Continue without applying the coupon if it's invalid
        }
      }
      
      // Create a checkout session
      const session = await stripe.checkout.sessions.create(sessionOptions);

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
    } catch (stripeError) {
      console.error(`Stripe API Error: ${JSON.stringify(stripeError)}`)
      
      // Handle customer max subscriptions error specifically
      if (stripeError.code === 'customer_max_subscriptions') {
        return new Response(
          JSON.stringify({
            error: "You have reached the maximum number of subscriptions allowed. Please contact support."
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }
      
      // Price ID format validation
      if (priceId && !priceId.startsWith('price_')) {
        throw new Error(`Invalid price ID format: ${priceId}. Price IDs should start with 'price_' not 'prod_'. Please check your STRIPE_EMPLOYER_PRICE_ID environment variable.`);
      }
      
      // Mode mismatch handling
      const keyMode = stripeKey.startsWith('sk_test') ? 'test' : 'live';
      const priceMode = priceId && priceId.startsWith('price_test') ? 'test' : 'live';
      
      if (keyMode !== priceMode) {
        throw new Error(`Stripe mode mismatch: Your API key is in ${keyMode} mode but your price ID is in ${priceMode} mode. They must match.`);
      }
      
      // Provide a more specific error for API key issues
      if (stripeError.message && stripeError.message.includes('API key')) {
        throw new Error(`Invalid Stripe API key. Make sure you're using the correct ${keyMode} API key for your Stripe account.`);
      }
      
      // For price ID issues
      if (stripeError.message && stripeError.message.includes('No such price')) {
        throw new Error(`Invalid price ID: ${priceId}. Make sure you're using a price ID that exists in your Stripe ${keyMode} mode account.`);
      }
      
      throw new Error(`Stripe API Error: ${stripeError.message || 'Unknown Stripe error'}.`);
    }
  } catch (error) {
    console.error(`Error in Stripe checkout: ${error.message}`);
    console.error(error);
    
    // Create a more descriptive error response
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('No such price')) {
      errorMessage = 'Invalid Stripe price ID. Make sure you are using the correct test/live price ID matching your API key mode.';
      statusCode = 400;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Invalid Stripe API key. Check if your API key is valid and matches the expected mode (test/live).';
      statusCode = 401;
    } else if (error.message.includes('Stripe API Error')) {
      // Keep original error message for Stripe API errors
      statusCode = 400;
    } else if (error.message.includes('mode mismatch')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('Invalid price ID format')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('customer_max_subscriptions') || error.message.includes('already has 500 active subscription')) {
      errorMessage = "You have reached the maximum number of subscriptions allowed. Please contact support.";
      statusCode = 400;
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
