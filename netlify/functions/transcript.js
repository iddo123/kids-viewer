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

  // 3 ── Fetch the caption JSON ────────────────────────────────────────────────
  const sep    = track.baseUrl.includes('?') ? '&' : '?'
  const url    = `${track.baseUrl}${sep}fmt=json3`
  const capRes = await fetch(url)
  if (!capRes.ok) throw new Error(`Caption fetch HTTP ${capRes.status}`)
  const text = await capRes.text()
  if (!text || text.length < 30) throw new Error(`Empty caption response (${text.length} chars)`)
  return text
}
