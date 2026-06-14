// Creates a Stripe Customer Portal session so a parent can manage/cancel
// their subscription. Accessible at /api/create-portal-session (netlify.toml).
const Stripe = require('stripe')
const { supabaseAdmin, getUserFromAuthHeader } = require('./_supabaseAdmin')
const { reportError } = require('./_sentry')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const supabase = supabaseAdmin()
  const user = await getUserFromAuthHeader(event, supabase)
  if (!user) return { statusCode: 401, body: 'Unauthorized' }

  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data?.stripe_customer_id) {
      return { statusCode: 400, body: 'No billing account found for this user' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   data.stripe_customer_id,
      return_url: `${process.env.PUBLIC_SITE_URL}/`,
    })

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body:       JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    await reportError(err)
    return { statusCode: 500, body: err.message }
  }
}
