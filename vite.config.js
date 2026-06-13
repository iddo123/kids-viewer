import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// ── Dev middleware: handles /api/transcript locally ───────────────────────────
// In production this route is served by netlify/functions/transcript.js
// In development Vite intercepts it here so you don't need `netlify dev`

// Uses YouTube InnerTube API (Android client) to get caption track URLs —
// this approach works server-side unlike the web-scraping methods.
async function fetchCaptions(videoId) {
  const ANDROID_VERSION = '20.10.38'
  const INNERTUBE_URL   = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'

  // 1 ── InnerTube player API (Android client bypasses bot detection) ──────────
  const playerRes = await fetch(INNERTUBE_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':   `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`,
    },
    body: JSON.stringify({
      context: { client: { clientName: 'ANDROID', clientVersion: ANDROID_VERSION } },
      videoId,
    }),
  })
  if (!playerRes.ok) throw new Error(`InnerTube HTTP ${playerRes.status}`)
  const player = await playerRes.json()

  // 2 ── Pick caption track ────────────────────────────────────────────────────
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) throw new Error('No caption tracks found')

  const track =
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.languageCode?.startsWith('en')) ||
    tracks[0]
  if (!track?.baseUrl) throw new Error('No baseUrl in caption track')

  // 3 ── Fetch the caption XML/JSON ────────────────────────────────────────────
  const sep      = track.baseUrl.includes('?') ? '&' : '?'
  const url      = `${track.baseUrl}${sep}fmt=json3`
  const capRes   = await fetch(url)
  if (!capRes.ok) throw new Error(`Caption fetch HTTP ${capRes.status}`)
  const text = await capRes.text()
  if (!text || text.length < 30) throw new Error(`Empty caption response (${text.length} chars)`)
  return text
}

// sp=EgIoAQ%3D%3D is YouTube's protobuf filter for "Subtitles/CC"
async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIoAQ%3D%3D`
  const res = await fetch(url, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie':          'CONSENT=YES+1; SOCS=CAI',
    },
  })
  if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`)
  const html = await res.text()

  // Extract ytInitialData using bracket counting (same technique as transcript.js)
  const marker = 'var ytInitialData = '
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) throw new Error('ytInitialData not found')

  const jsonStart = markerIdx + marker.length
  let depth = 0, i = jsonStart, end = -1
  for (; i < html.length; i++) {
    const c = html[i]
    if (c === '"') {
      i++
      while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue }
        if (html[i] === '"')  break
        i++
      }
    } else if (c === '{') { depth++
    } else if (c === '}') { if (--depth === 0) { end = i; break } }
  }
  if (end === -1) throw new Error('Failed to parse ytInitialData')

  const data = JSON.parse(html.slice(jsonStart, end + 1))

  // Navigate to search result items
  const sections =
    data?.contents
      ?.twoColumnSearchResultsRenderer
      ?.primaryContents
      ?.sectionListRenderer
      ?.contents ?? []

  const videos = []
  for (const section of sections) {
    const contents = section?.itemSectionRenderer?.contents ?? []
    for (const item of contents) {
      const v = item.videoRenderer
      if (!v?.videoId) continue
      videos.push({
        id:       v.videoId,
        title:    v.title?.runs?.[0]?.text    ?? '',
        channel:  v.ownerText?.runs?.[0]?.text ?? '',
        duration: v.lengthText?.simpleText     ?? '',
      })
      if (videos.length >= 12) break
    }
    if (videos.length >= 12) break
  }

  return videos
}

const transcriptPlugin = {
  name: 'transcript-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/api/transcript', async (req, res) => {
      try {
        const qs      = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''
        const params  = new URLSearchParams(qs)
        const videoId = params.get('v') || params.get('videoId')

        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Invalid or missing video ID')
          return
        }

        const body = await fetchCaptions(videoId)
        res.writeHead(200, {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control':               'public, max-age=3600',
        })
        res.end(body)
      } catch (err) {
        console.error('[transcript-proxy]', err.message)
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end(err.message)
      }
    })
  },
}

const suggestPlugin = {
  name: 'suggest-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/api/suggest', async (req, res) => {
      try {
        const qs    = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''
        const query = new URLSearchParams(qs).get('q')?.trim() || ''
        if (!query) { res.writeHead(400); res.end('Missing q'); return }
        const upstream = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`
        )
        if (!upstream.ok) throw new Error(`Suggest HTTP ${upstream.status}`)
        const data = await upstream.json()
        res.writeHead(200, {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control':               'public, max-age=60',
        })
        res.end(JSON.stringify(data[1] || []))
      } catch (err) {
        console.error('[suggest-proxy]', err.message)
        res.writeHead(502)
        res.end(err.message)
      }
    })
  },
}

const searchPlugin = {
  name: 'search-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/api/search', async (req, res) => {
      try {
        const qs    = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''
        const query = new URLSearchParams(qs).get('q')?.trim() || ''

        if (!query) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Missing q parameter')
          return
        }

        const results = await searchYouTube(query)   // reuse the same function defined above
        res.writeHead(200, {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control':               'public, max-age=300',
        })
        res.end(JSON.stringify(results))
      } catch (err) {
        console.error('[search-proxy]', err.message)
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end(err.message)
      }
    })
  },
}

// ── Dev middleware: mirrors netlify/functions/create-checkout-session.js ──────
function checkoutSessionPlugin(env) {
  return {
    name: 'checkout-session-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/create-checkout-session', async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return }
        try {
          const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
          const stripe   = new Stripe(env.STRIPE_SECRET_KEY)

          const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
          const { data: authData, error: authError } = await supabase.auth.getUser(token)
          if (authError || !authData.user) { res.writeHead(401); res.end('Unauthorized'); return }
          const user = authData.user

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

          const session = await stripe.checkout.sessions.create({
            mode:                'subscription',
            customer:            customerId,
            client_reference_id: user.id,
            line_items:          [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
            success_url:         `${env.PUBLIC_SITE_URL}/?checkout=success`,
            cancel_url:          `${env.PUBLIC_SITE_URL}/?checkout=cancel`,
          })

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ url: session.url }))
        } catch (err) {
          console.error('[checkout-session-proxy]', err.message)
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end(err.message)
        }
      })
    },
  }
}

// ── Dev middleware: mirrors netlify/functions/create-portal-session.js ────────
function portalSessionPlugin(env) {
  return {
    name: 'portal-session-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/create-portal-session', async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return }
        try {
          const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
          const stripe   = new Stripe(env.STRIPE_SECRET_KEY)

          const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
          const { data: authData, error: authError } = await supabase.auth.getUser(token)
          if (authError || !authData.user) { res.writeHead(401); res.end('Unauthorized'); return }
          const user = authData.user

          const { data } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()

          if (!data?.stripe_customer_id) {
            res.writeHead(400); res.end('No billing account found for this user'); return
          }

          const session = await stripe.billingPortal.sessions.create({
            customer:   data.stripe_customer_id,
            return_url: `${env.PUBLIC_SITE_URL}/`,
          })

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ url: session.url }))
        } catch (err) {
          console.error('[portal-session-proxy]', err.message)
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end(err.message)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(), basicSsl(), transcriptPlugin, suggestPlugin, searchPlugin,
      checkoutSessionPlugin(env), portalSessionPlugin(env),
    ],
  }
})
