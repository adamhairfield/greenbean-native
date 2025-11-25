import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''

// Helper function to call Stripe API directly
async function createStripeAccount(businessName: string, businessEmail: string) {
  const response = await fetch('https://api.stripe.com/v1/accounts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      type: 'express',
      country: 'US',
      email: businessEmail,
      'capabilities[card_payments][requested]': 'true',
      'capabilities[transfers][requested]': 'true',
      'business_type': 'individual',
      'business_profile[name]': businessName,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create Stripe account')
  }

  return await response.json()
}

async function createAccountLink(accountId: string, appUrl: string) {
  const response = await fetch('https://api.stripe.com/v1/account_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      account: accountId,
      refresh_url: `${appUrl}/seller/onboarding/refresh`,
      return_url: `${appUrl}/seller/onboarding/complete`,
      type: 'account_onboarding',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create account link')
  }

  return await response.json()
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log environment check
    console.log('Checking Stripe key:', Deno.env.get('STRIPE_SECRET_KEY') ? 'Set ✓' : 'Missing ✗')
    
    // Check for authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header:', authHeader ? 'Present ✓' : 'Missing ✗')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 401, message: 'Missing authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      console.log('User not found from token')
      throw new Error('Not authenticated')
    }
    
    console.log('Authenticated user:', user.id)

    const { user_id, business_name, business_email, business_phone, business_address } = await req.json()
    
    console.log('Creating Connect account for:', business_name)

    // Verify user is creating account for themselves or is admin
    if (user_id !== user.id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'master'].includes(profile.role)) {
        throw new Error('Unauthorized')
      }
    }

    // Create Stripe Connect account
    const account = await createStripeAccount(business_name, business_email)

    // Create account link for onboarding
    const appUrl = Deno.env.get('APP_URL') || 'https://greenbean.app'
    const accountLink = await createAccountLink(account.id, appUrl)

    // Update existing seller record with Stripe account info
    const { error: sellerError } = await supabaseClient
      .from('sellers')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
      })
      .eq('user_id', user_id)

    if (sellerError) {
      console.error('Error updating seller:', sellerError)
      throw sellerError
    }

    return new Response(
      JSON.stringify({
        accountId: account.id,
        onboardingUrl: accountLink.url,
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
