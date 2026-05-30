// Proxies YouTube search suggestions — avoids CORS restrictions in the browser
exports.handler = async (event) => {
  const query = ((event.queryStringParameters || {}).q || '').trim()
  if (!query) return { statusCode: 400, body: 'Missing q parameter' }

  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`
    )
    if (!res.ok) throw new Error(`Suggest HTTP ${res.status}`)
    const data = await res.json()
    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=60',
      },
      body: JSON.stringify(data[1] || []),
    }
  } catch (err) {
    return { statusCode: 502, body: err.message }
  }
}
