// Supabase Edge Function to send notifications (in-app and push)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { user_id, title, message, type, related_order_id, preference_key } = await req.json()

    if (!user_id || !title || !message || !type) {
      throw new Error('Missing required fields')
    }

    // Check user's notification preferences
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // If preference_key is provided, check if user wants this type of notification
    if (preference_key && prefs && !prefs[preference_key]) {
      console.log(`User ${user_id} has disabled ${preference_key} notifications`)
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user preference' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create in-app notification
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        related_order_id,
      })

    if (notificationError) {
      console.error('Failed to create notification:', notificationError)
    }

    // Send push notification if enabled
    if (prefs?.push_enabled !== false) {
      try {
        const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            user_id,
            title,
            body: message,
            data: { type, orderId: related_order_id },
          }),
        })

        if (!pushResponse.ok) {
          console.error('Failed to send push notification')
        }
      } catch (pushError) {
        console.error('Error sending push notification:', pushError)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
