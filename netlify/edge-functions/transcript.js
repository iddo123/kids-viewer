// Netlify Edge Function — runs on Cloudflare (not AWS Lambda)
// Fetches YouTube captions by scraping the watch page.
// Accessible at /api/transcript?v=VIDEO_ID

export default async function handler(request) {
  const url    = new URL(request.url)
  const videoId = url.searchParams.get('v') || url.searchParams.get('videoId')

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response('Invalid or missing video ID', { status: 400 })
  }

  try {
    const body = await fetchCaptions(videoId)
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error(`[transcript-edge] failed for ${videoId}:`, err.message)
    return new Response(err.message, {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}

async function fetchCaptions(videoId) {
  // ── Step 1: Fetch the YouTube watch page ──────────────────────────────────
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie':          'CONSENT=YES+cb; SOCS=CAI',
    },
  })
  if (!pageRes.ok) throw new Error(`YouTube page HTTP ${pageRes.status}`)
  const html = await pageRes.text()

  // ── Step 2: Extract ytInitialPlayerResponse ───────────────────────────────
  const marker    = 'var ytInitialPlayerResponse = '
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) throw new Error('ytInitialPlayerResponse not found in page')

  // Bracket-count to find the end of the JSON object
  const jsonStart = markerIdx + marker.length
  let depth = 0, i = jsonStart, end = -1
  for (; i < html.length; i++) {
    const c = html[i]
    if (c === '"') {
      i++
      while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue }
        if (html[i] === '"') break
        i++
      }
    } else if (c === '{') { depth++
    } else if (c === '}') { if (--depth === 0) { end = i; break } }
  }
  if (end === -1) throw new Error('Failed to parse ytInitialPlayerResponse JSON')

  const player = JSON.parse(html.slice(jsonStart, end + 1))

  // ── Step 3: Find an English caption track ─────────────────────────────────
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) throw new Error('No caption tracks found')

  const track =
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.languageCode?.startsWith('en')) ||
    tracks[0]
  if (!track?.baseUrl) throw new Error('No baseUrl in caption track')

  // ── Step 4: Fetch the caption JSON ────────────────────────────────────────
  const sep    = track.baseUrl.includes('?') ? '&' : '?'
  const capRes = await fetch(`${track.baseUrl}${sep}fmt=json3`)
  if (!capRes.ok) throw new Error(`Caption fetch HTTP ${capRes.status}`)
  const text = await capRes.text()
  if (!text || text.length < 30) throw new Error('Empty caption response')
  return text
}
