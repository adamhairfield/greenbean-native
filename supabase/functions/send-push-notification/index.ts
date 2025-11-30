// Supabase Edge Function to send push notifications via Expo
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { user_id, title, body, data } = await req.json()

    if (!user_id || !title || !body) {
      throw new Error('Missing required fields: user_id, title, body')
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id)

    if (tokensError) {
      throw new Error('Failed to fetch push tokens')
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', user_id)
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens to send to' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Prepare push notification messages
    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    }))

    // Send push notifications via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Expo push error:', result)
      throw new Error('Failed to send push notification')
    }

    console.log('Push notifications sent:', result)

    return new Response(
      JSON.stringify({
        success: true,
        sentTo: tokens.length,
        result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
