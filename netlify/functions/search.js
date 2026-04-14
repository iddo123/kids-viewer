// Netlify function — searches YouTube filtered to videos with captions (CC)
// Accessible at /api/search?q=QUERY  (netlify.toml rewrites here)

exports.handler = async (event) => {
  const params = event.queryStringParameters || {}
  const query  = (params.q || '').trim()

  if (!query) {
    return { statusCode: 400, body: 'Missing q parameter' }
  }

  try {
    const results = await searchYouTube(query)
    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=300',
      },
      body: JSON.stringify(results),
    }
  } catch (err) {
    return { statusCode: 502, body: err.message }
  }
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
