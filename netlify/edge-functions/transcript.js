// Netlify Edge Function — fetches YouTube captions via Supadata.ai API
// Accessible at /api/transcript?v=VIDEO_ID

export default async function handler(request) {
  const url     = new URL(request.url)
  const videoId = url.searchParams.get('v') || url.searchParams.get('videoId')

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response('Invalid or missing video ID', { status: 400 })
  }

  const apiKey = Deno.env.get('SUPADATA_API_KEY')
  if (!apiKey) {
    return new Response('SUPADATA_API_KEY not configured', { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
      {
        headers: { 'x-api-key': apiKey },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Supadata ${res.status}: ${body}`)
    }

    const data = await res.json()

    if (!data.content || !data.content.length) {
      throw new Error('No transcript content returned')
    }

    // Convert Supadata format → JSON3 format our parser already understands:
    // { events: [{ tStartMs, segs: [{ utf8 }] }] }
    const json3 = {
      events: data.content.map(item => ({
        tStartMs:     item.offset,
        dDurationMs:  item.duration,
        segs:         [{ utf8: item.text }],
      })),
    }

    return new Response(JSON.stringify(json3), {
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
