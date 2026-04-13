// Netlify function — fetches YouTube captions by scraping ytInitialPlayerResponse
// Accessible at /api/transcript?v=VIDEO_ID  (netlify.toml rewrites here)

exports.handler = async (event) => {
  const params  = event.queryStringParameters || {}
  const videoId = params.v || params.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return { statusCode: 400, body: 'Invalid or missing video ID' }
  }

  try {
    const body = await fetchCaptions(videoId)
    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=3600',
      },
      body,
    }
  } catch (err) {
    return { statusCode: 502, body: err.message }
  }
}

async function fetchCaptions(videoId) {
  // 1 ── Fetch watch page with realistic browser headers ──────────────────────
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie':          'CONSENT=YES+1; SOCS=CAI',
    },
  })
  if (!watchRes.ok) throw new Error(`YouTube page HTTP ${watchRes.status}`)
  const html = await watchRes.text()

  // 2 ── Extract ytInitialPlayerResponse via bracket counting ─────────────────
  const match = html.match(/ytInitialPlayerResponse\s*=\s*\{/)
  if (!match) throw new Error('ytInitialPlayerResponse not found in page HTML')

  const jsonStart = match.index + match[0].length - 1
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
    } else if (c === '{') {
      depth++
    } else if (c === '}') {
      if (--depth === 0) { end = i; break }
    }
  }

  if (end === -1) throw new Error('Failed to parse ytInitialPlayerResponse JSON')
  const player = JSON.parse(html.slice(jsonStart, end + 1))

  // 3 ── Get caption track URL ─────────────────────────────────────────────────
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) throw new Error('No caption tracks in player response')

  const track =
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.languageCode?.startsWith('en')) ||
    tracks[0]

  if (!track?.baseUrl) throw new Error('No baseUrl in caption track')

  // 4 ── Fetch captions in JSON3 format ────────────────────────────────────────
  const sep        = track.baseUrl.includes('?') ? '&' : '?'
  const captionRes = await fetch(`${track.baseUrl}${sep}fmt=json3`)
  if (!captionRes.ok) throw new Error(`Caption fetch HTTP ${captionRes.status}`)

  return captionRes.text()
}
