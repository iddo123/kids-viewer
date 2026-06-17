// ─── Fetch transcript ─────────────────────────────────────────────────────────
//
// Uses our own server-side proxy (/api/transcript) which:
//  • In development : Vite middleware in vite.config.js
//  • In production  : Netlify serverless function in netlify/functions/transcript.js
//
// The proxy fetches the YouTube watch page, extracts the real caption track URL
// from the embedded player data, and returns JSON3 captions — no CORS issues,
// works for all video types including music videos.

// Extract ytInitialPlayerResponse JSON from a YouTube watch-page HTML string.
// Returns the caption baseUrl (signed, can be fetched from any IP) or null.
function extractCaptionUrl(html) {
  const marker    = 'var ytInitialPlayerResponse = '
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) return null

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
  if (end === -1) return null

  let player
  try { player = JSON.parse(html.slice(jsonStart, end + 1)) } catch { return null }

  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) return null

  const track =
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.languageCode?.startsWith('en')) ||
    tracks[0]
  return track?.baseUrl ?? null
}

export async function fetchTranscript(videoId) {
  // ── Strategy: fetch the YouTube watch page via a CORS proxy (proxy's servers
  //   get the page HTML), extract the signed caption baseUrl, then fetch THAT
  //   URL directly from the user's browser (residential IP, no cloud block).
  //   YouTube caption CDN URLs use ip=0.0.0.0 (no IP binding) so they work
  //   regardless of which IP fetched the watch page.

  const watchUrl  = `https://www.youtube.com/watch?v=${videoId}`
  const pageProxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ]

  for (const proxy of pageProxies) {
    try {
      const res = await fetch(proxy(watchUrl), { signal: AbortSignal.timeout(12000) })
      if (!res.ok) { console.warn(`[transcript] page proxy ${proxy(watchUrl).slice(0,40)} → ${res.status}`); continue }
      const html = await res.text()
      const captionUrl = extractCaptionUrl(html)
      if (!captionUrl) { console.warn('[transcript] no caption tracks in proxied page'); continue }

      // Fetch the signed caption URL directly from the browser
      const sep    = captionUrl.includes('?') ? '&' : '?'
      const capRes = await fetch(`${captionUrl}${sep}fmt=json3`, { signal: AbortSignal.timeout(8000) })
      if (!capRes.ok) { console.warn(`[transcript] caption fetch → ${capRes.status}`); continue }
      const text = await capRes.text()
      if (text && text.length >= 30 && text.includes('"events"')) {
        console.log(`[transcript] ✓ ${text.length} chars (proxy-page+direct-cap) for ${videoId}`)
        return text
      }
    } catch (e) { console.warn('[transcript] proxy-page attempt failed:', e.message) }
  }

  // Fallback: server-side proxy (edge function on Cloudflare)
  try {
    const res = await fetch(`/api/transcript?v=${videoId}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${errBody}`)
    }
    const text = await res.text()
    if (!text || text.length < 30) throw new Error('Empty response')
    console.log(`[transcript] ✓ ${text.length} chars (server-proxy) for ${videoId}`)
    return text
  } catch (e) {
    console.warn(`[transcript] ✗ all methods failed for ${videoId}: ${e.message}`)
    return null
  }
}

function decodeXmlEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '').trim()
}

// ─── Parser ───────────────────────────────────────────────────────────────────
export function parseJson3Transcript(rawText) {
  if (!rawText) return []

  // JSON3 format (fmt=json3): {"events":[{"tStartMs":0,"segs":[{"utf8":"text"}]}]}
  if (rawText.trimStart().startsWith('{')) {
    let data
    try { data = JSON.parse(rawText) } catch { return [] }
    const events = data?.events ?? []
    const result = []
    for (const ev of events) {
      if (!ev.segs || !ev.tStartMs) continue
      const phrase = ev.segs.map(s => s.utf8 ?? '').join('').trim()
      // dDurationMs lets us know when a caption line *ends* (for silence detection)
      const durMs = typeof ev.dDurationMs === 'number' ? ev.dDurationMs : undefined
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) {
          result.push(durMs != null ? { word, startMs: ev.tStartMs, durMs } : { word, startMs: ev.tStartMs })
        }
      }
    }
    console.log(`[transcript] parsed ${result.length} tokens (json3)`)
    return result
  }

  // XML format — two variants:
  //   <transcript><text start="0.12">Hello</text></transcript>
  //   <timedtext><body><p t="9560">Hello</p></body></timedtext>
  if (rawText.includes('<transcript>') || rawText.includes('<timedtext')) {
    const result = []
    // Variant 1: <text start="seconds" dur="seconds"> (fmt=srv3 / old API)
    const reText = /start="([\d.]+)"(?:[^>]*?\bdur="([\d.]+)")?[^>]*>([^<]+)<\/text>/g
    let m
    while ((m = reText.exec(rawText)) !== null) {
      const startMs = Math.round(parseFloat(m[1]) * 1000)
      const durMs   = m[2] != null ? Math.round(parseFloat(m[2]) * 1000) : undefined
      const phrase  = decodeXmlEntities(m[3])
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) result.push(durMs != null ? { word, startMs, durMs } : { word, startMs })
      }
    }
    // Variant 2: <p t="milliseconds" d="milliseconds"> (InnerTube fmt=json3 fallback XML)
    const reP = /<p t="(\d+)"(?:[^>]*?\bd="(\d+)")?[^>]*>([^<]*(?:<s[^>]*>[^<]*<\/s>[^<]*)*)<\/p>/g
    while ((m = reP.exec(rawText)) !== null) {
      const startMs = parseInt(m[1], 10)
      const durMs   = m[2] != null ? parseInt(m[2], 10) : undefined
      // Inner <s> word tags: <s ac="0">word</s>
      const sWords = []
      const reS = /<s[^>]*>([^<]+)<\/s>/g
      let ms
      while ((ms = reS.exec(m[3])) !== null) sWords.push(ms[1])
      const phrase = decodeXmlEntities(sWords.length ? sWords.join(' ') : m[3].replace(/<[^>]+>/g, ''))
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) result.push(durMs != null ? { word, startMs, durMs } : { word, startMs })
      }
    }
    if (result.length > 0) console.log(`[transcript] parsed ${result.length} tokens (xml)`)
    return result
  }

  console.warn('[transcript] unknown format, raw preview:', rawText.slice(0, 80))
  return []
}

// ─── Stop words ───────────────────────────────────────────────────────────────
export const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','shall','should','may','might','must','can',
  'could','not','no','nor','yet','both','either','neither','so','as','than',
  'then','there','here','just','also','well','now','still','even','back',
  'about','after','before','between','during','into','onto','over','under',
  'through','up','out','off','down','away','again','already','when','where',
  'why','how','what','which','who','whom','whose','that','this','these','those',
  'each','every','all','any','few','more','most','other','some','such',
  'own','same','too','very','just','only','its','his','her','our','your',
  'their','my','we','us','they','them','he','she','it','you',
  'get','got','say','said','see','saw','know','knew','think','thought',
  'come','came','go','went','make','made','take','took','give','gave',
  'look','looked','want','wanted','let','put','seem','seemed','tell','told',
  'ask','asked','keep','kept','call','called','feel','felt','become','became',
  'something','anything','everything','nothing','someone','anyone','everyone',
  'yeah','yes','okay','right','like','really','actually','little','much',
  'many','bit','lot','thing','things','way','good','new','first','last',
  'long','big','high','old','great','one','two','three','four','five',
  'because','while','although','since','unless','until','though','whether',
  'gonna','wanna','gotta','kinda','sorta','alright','um','uh','ah','oh',
  'hey','hi','bye','hmm','doo','dee','laa','tra','yay','wow',
])

// ─── Word picker ──────────────────────────────────────────────────────────────
// Picks the most interesting untaught word from the ENTIRE transcript.
// High frequency = central theme of the video = most educational for a kid.
export function pickWordFromTranscript(transcriptWords, _currentTimeSec, vocabMap, taughtWords) {
  if (!transcriptWords || transcriptWords.length === 0) return null

  // All content words from the full transcript (no time window)
  const candidates = transcriptWords.filter(
    t => !STOP_WORDS.has(t.word) &&
         t.word.length >= 3 &&
         !taughtWords.has(t.word)
  )

  if (candidates.length === 0) {
    console.log('[picker] no candidates in transcript')
    return null
  }

  // Count frequency — most repeated word = most central to the video's topic
  const freq = {}
  for (const { word } of candidates) freq[word] = (freq[word] || 0) + 1

  // Unique words sorted by frequency desc
  const ranked = [...new Set(candidates.map(t => t.word))].sort((a, b) => freq[b] - freq[a])
  console.log('[picker] top candidates:', ranked.slice(0, 5))

  // Priority 1: vocab-database match (pre-translated, has image)
  const vocabHit = ranked.find(w => vocabMap.has(w))
  if (vocabHit) {
    console.log(`[picker] ✓ vocab hit: "${vocabHit}"`)
    return vocabHit
  }

  // Priority 2: most frequent content word in the transcript
  console.log(`[picker] ✓ dynamic word: "${ranked[0]}"`)
  return ranked[0]
}

// ─── Dynamic word entry (translation + image) ────────────────────────────────
const translationCache = new Map()

export async function fetchDynamicWordEntry(word, langCode) {
  const key = `${word}:${langCode}`
  if (translationCache.has(key)) return translationCache.get(key)

  let translation = word
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${langCode}`
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      const t = data?.responseData?.translatedText
      // Reject if: empty, same as source, API error strings, or contains '#' (MyMemory garbage marker)
      if (t &&
          t.toLowerCase() !== word.toLowerCase() &&
          !t.includes('NO QUERY') &&
          !t.includes('#') &&
          t.trim().length > 0) {
        translation = t
      }
    }
  } catch { /* use English word as fallback */ }

  const entry = { word, emoji: '📖', imageQuery: word, translations: { [langCode]: translation }, isDynamic: true }
  translationCache.set(key, entry)
  return entry
}
