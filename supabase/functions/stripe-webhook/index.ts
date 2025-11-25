import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Webhook Request Received ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    
    const signature = req.headers.get('stripe-signature')
    console.log('Stripe signature present:', signature ? 'Yes' : 'No')
    
    const payload = await req.text()
    console.log('Payload length:', payload.length)
    
    if (!payload) {
      console.error('Empty payload received')
      return new Response(
        JSON.stringify({ error: 'Empty payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Parse the event
    let event
    try {
      event = JSON.parse(payload)
      console.log('Event type:', event.type)
      console.log('Event ID:', event.id)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin access
    // This bypasses RLS and doesn't require user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object
        
        console.log('Account updated:', account.id)
        
        // Update seller record
        const { error } = await supabaseClient
          .from('sellers')
          .update({
            stripe_onboarding_completed: account.details_submitted || false,
            stripe_charges_enabled: account.charges_enabled || false,
            stripe_payouts_enabled: account.payouts_enabled || false,
            stripe_account_status: account.requirements?.disabled_reason || 'active',
          })
          .eq('stripe_account_id', account.id)

        if (error) {
          console.error('Error updating seller:', error)
          throw error
        }

        console.log('Seller updated successfully')
        break
      }

      case 'account.application.authorized':
      case 'account.application.deauthorized': {
        const account = event.data.object
        console.log('Account authorization event:', event.type, account.id)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    console.log('=== Webhook processed successfully ===')
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('=== Webhook error ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
