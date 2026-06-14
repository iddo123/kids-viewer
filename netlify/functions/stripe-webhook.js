// Receives Stripe webhook events and syncs subscription status into
// Supabase via the service-role key (bypasses RLS).
// Accessible at /api/stripe-webhook (netlify.toml).
const Stripe = require('stripe')
const { supabaseAdmin } = require('./_supabaseAdmin')
const { reportError } = require('./_sentry')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  // Signature verification needs the *raw* body — never JSON.parse first.
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` }
  }

  const supabase = supabaseAdmin()

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        const periodEnd = sub.items.data[0]?.current_period_end ?? sub.current_period_end
        await supabase.from('subscriptions').upsert({
          user_id:                session.client_reference_id,
          stripe_customer_id:     session.customer,
          stripe_subscription_id: sub.id,
          status:                 sub.status,
          price_id:               sub.items.data[0]?.price?.id,
          current_period_end:     periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object
        const periodEnd = sub.items.data[0]?.current_period_end ?? sub.current_period_end
        await supabase.from('subscriptions')
          .update({
            status:             sub.status,
            price_id:           sub.items.data[0]?.price?.id,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    // Report to Sentry — Stripe retries on non-2xx, which won't help with our
    // own bugs, but we still need to know a paid subscription failed to sync.
    console.error('[stripe-webhook]', err)
    await reportError(err)
  }

  return { statusCode: 200, body: 'ok' }
}
