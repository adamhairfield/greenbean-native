// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { order_id, amount, currency = 'usd', items } = await req.json()

    // For now, we'll create a simple payment intent without seller splits
    // Seller splits will be calculated by webhook after order is created
    console.log('Creating payment intent for amount:', amount)
    console.log('Order ID (may be temporary):', order_id)

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount: ' + amount)
    }

    const amountInCents = Math.round(amount * 100)
    console.log('Creating payment intent:', { amount, amountInCents, currency, order_id })

    // Create payment intent using Fetch API
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: currency,
        'transfer_group': order_id,
        'metadata[order_id]': order_id,
        'metadata[user_id]': user.id,
        'automatic_payment_methods[enabled]': 'true',
      }),
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text()
      console.error('Stripe API error:', errorData)
      throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorData}`)
    }

    const paymentIntent = await stripeResponse.json()
    console.log('Payment intent created:', paymentIntent.id)

    // Note: Seller transfers will be calculated by webhook after order is created
    // For now, we just create the payment intent

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
