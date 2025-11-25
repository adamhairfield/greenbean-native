// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

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

    const { order_id, amount, currency = 'usd' } = await req.json()

    // Fetch order details to calculate seller splits
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            *,
            sellers (*)
          )
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError) throw orderError

    // Group order items by seller and calculate amounts
    const sellerTransfers: any[] = []
    const itemsBySeller = new Map()

    for (const item of order.order_items) {
      const sellerId = item.products?.seller_id
      if (!sellerId) continue // Skip items without sellers (platform products)

      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, {
          seller: item.products.sellers,
          items: [],
          subtotal: 0,
        })
      }

      const sellerData = itemsBySeller.get(sellerId)
      sellerData.items.push(item)
      sellerData.subtotal += item.total_price
    }

    // Calculate transfers for each seller
    for (const [sellerId, data] of itemsBySeller) {
      const platformFeePercentage = data.seller.platform_fee_percentage || 10
      const platformFee = data.subtotal * (platformFeePercentage / 100)
      const sellerAmount = data.subtotal - platformFee

      if (data.seller.stripe_account_id && data.seller.stripe_charges_enabled) {
        sellerTransfers.push({
          seller_id: sellerId,
          stripe_account_id: data.seller.stripe_account_id,
          amount: Math.round(sellerAmount * 100), // Convert to cents
          platform_fee: Math.round(platformFee * 100),
        })
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      transfer_group: order_id,
      metadata: {
        order_id,
        user_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store transfer information for later processing
    // This will be used by a webhook to create actual transfers after payment succeeds
    await supabaseClient
      .from('orders')
      .update({
        payment_intent_id: paymentIntent.id,
        seller_transfers: sellerTransfers,
      })
      .eq('id', order_id)

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
