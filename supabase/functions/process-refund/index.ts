// Supabase Edge Function to process Stripe refunds
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
    // Create client with user auth for verification
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

    // Create admin client for database updates (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { order_id, amount, reason } = await req.json()

    if (!order_id || !amount) {
      throw new Error('Missing required fields: order_id and amount')
    }

    // Get the order to verify ownership and get payment intent ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('stripe_payment_intent_id, total, payment_status, customer_id, special_instructions')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    if (!order.stripe_payment_intent_id) {
      throw new Error('No payment intent found for this order')
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Order has not been paid')
    }

    // Validate refund amount
    const refundAmount = parseFloat(amount)
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw new Error('Invalid refund amount')
    }

    if (refundAmount > order.total) {
      throw new Error('Refund amount cannot exceed order total')
    }

    console.log('Processing refund for order:', order_id)
    console.log('Payment Intent:', order.stripe_payment_intent_id)
    console.log('Refund amount:', refundAmount)

    // Create the refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        order_id,
        refund_reason: reason || 'No reason provided',
        refunded_by: user.id,
      },
    })

    console.log('Stripe refund created:', refund.id)

    // Determine if this is a full or partial refund
    const isFullRefund = refundAmount >= order.total

    // Update the order in the database using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: isFullRefund ? 'refunded' : 'paid',
        special_instructions: order.special_instructions 
          ? `${order.special_instructions}\n\n[REFUND: $${refundAmount.toFixed(2)}] ${reason || 'Refund processed'}`
          : `[REFUND: $${refundAmount.toFixed(2)}] ${reason || 'Refund processed'}`,
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      throw new Error('Refund processed but failed to update order')
    }

    // Create notification for customer (respecting preferences)
    const notificationTitle = isFullRefund ? 'Full Refund Processed' : 'Partial Refund Processed'
    const notificationMessage = `Your refund of $${refundAmount.toFixed(2)} has been processed and will appear in your account within 5-10 business days.${reason ? `\n\nReason: ${reason}` : ''}`
    
    // Check user's notification preferences
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('refund_processed, push_enabled')
      .eq('user_id', order.customer_id)
      .single()

    // Only send if user wants refund notifications (default to true if no prefs)
    const shouldNotify = !prefs || prefs.refund_processed !== false

    if (shouldNotify) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: order.customer_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'refund',
          related_id: order_id,
        })

      if (notificationError) {
        console.error('Failed to create notification:', notificationError)
      }

      // Send push notification if enabled
      if (!prefs || prefs.push_enabled !== false) {
        try {
          const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              user_id: order.customer_id,
              title: notificationTitle,
              body: notificationMessage,
              data: {
                type: 'refund',
                orderId: order_id,
              },
            }),
          })

          if (!pushResponse.ok) {
            console.error('Failed to send push notification')
          }
        } catch (pushError) {
          console.error('Error sending push notification:', pushError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        isFullRefund,
        status: refund.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Refund error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
