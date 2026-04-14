// ─── Fetch transcript ─────────────────────────────────────────────────────────
//
// Uses our own server-side proxy (/api/transcript) which:
//  • In development : Vite middleware in vite.config.js
//  • In production  : Netlify serverless function in netlify/functions/transcript.js
//
// The proxy fetches the YouTube watch page, extracts the real caption track URL
// from the embedded player data, and returns JSON3 captions — no CORS issues,
// works for all video types including music videos.

export async function fetchTranscript(videoId) {
  // 1 ── Try directly from the browser (avoids server-side IP/cookie restrictions)
  const directUrls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`,
  ]
  for (const url of directUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const text = await res.text()
      if (text && text.length >= 30) {
        console.log(`[transcript] ✓ ${text.length} chars (direct) for ${videoId}`)
        return text
      }
    } catch { /* try next */ }
  }

  // 2 ── Fallback: server proxy (extracts signed URL from watch page)
  try {
    const res = await fetch(`/api/transcript?v=${videoId}`, {
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${errBody}`)
    }
    const text = await res.text()
    if (!text || text.length < 30) throw new Error('Empty response')
    console.log(`[transcript] ✓ ${text.length} chars (proxy) for ${videoId}`)
    return text
  } catch (e) {
    console.warn(`[transcript] ✗ failed for ${videoId}: ${e.message}`)
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
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) result.push({ word, startMs: ev.tStartMs })
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
    // Variant 1: <text start="seconds"> (fmt=srv3 / old API)
    const reText = /start="([\d.]+)"[^>]*>([^<]+)<\/text>/g
    let m
    while ((m = reText.exec(rawText)) !== null) {
      const startMs = Math.round(parseFloat(m[1]) * 1000)
      const phrase  = decodeXmlEntities(m[2])
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) result.push({ word, startMs })
      }
    }
    // Variant 2: <p t="milliseconds"> (InnerTube fmt=json3 fallback XML)
    const reP = /<p t="(\d+)"[^>]*>([^<]*(?:<s[^>]*>[^<]*<\/s>[^<]*)*)<\/p>/g
    while ((m = reP.exec(rawText)) !== null) {
      const startMs = parseInt(m[1], 10)
      // Inner <s> word tags: <s ac="0">word</s>
      const sWords = []
      const reS = /<s[^>]*>([^<]+)<\/s>/g
      let ms
      while ((ms = reS.exec(m[2])) !== null) sWords.push(ms[1])
      const phrase = decodeXmlEntities(sWords.length ? sWords.join(' ') : m[2].replace(/<[^>]+>/g, ''))
      for (const raw of phrase.split(/\s+/)) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, '')
        if (word.length >= 3) result.push({ word, startMs })
      }
    }
    if (result.length > 0) console.log(`[transcript] parsed ${result.length} tokens (xml)`)
    return result
  }

  console.warn('[transcript] unknown format, raw preview:', rawText.slice(0, 80))
  return []
}

// ─── Stop words ───────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
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
      if (t && t.toLowerCase() !== word.toLowerCase() && !t.includes('NO QUERY')) {
        translation = t
      }
    }
  } catch { /* use English word as fallback */ }

  const entry = { word, emoji: '📖', imageQuery: word, translations: { [langCode]: translation }, isDynamic: true }
  translationCache.set(key, entry)
  return entry
}
