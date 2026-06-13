// Creates a Stripe Checkout session (subscription mode) for the signed-in
// parent account. Accessible at /api/create-checkout-session (netlify.toml).
const Stripe = require('stripe')
const { supabaseAdmin, getUserFromAuthHeader } = require('./_supabaseAdmin')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const supabase = supabaseAdmin()
  const user = await getUserFromAuthHeader(event, supabase)
  if (!user) return { statusCode: 401, body: 'Unauthorized' }

  try {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existing?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    const site = process.env.PUBLIC_SITE_URL
    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      customer:            customerId,
      client_reference_id: user.id,
      line_items:          [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url:         `${site}/?checkout=success`,
      cancel_url:          `${site}/?checkout=cancel`,
    })

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body:       JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    return { statusCode: 500, body: err.message }
  }
}
