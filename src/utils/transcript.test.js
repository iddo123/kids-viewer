import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  parseJson3Transcript,
  pickWordFromTranscript,
  fetchTranscript,
  fetchDynamicWordEntry,
  STOP_WORDS,
} from './transcript'

// ── parseJson3Transcript ───────────────────────────────────────────────────────

describe('parseJson3Transcript', () => {
  it('returns [] for null / undefined / empty string', () => {
    expect(parseJson3Transcript(null)).toEqual([])
    expect(parseJson3Transcript(undefined)).toEqual([])
    expect(parseJson3Transcript('')).toEqual([])
  })

  it('parses JSON3 format into {word, startMs} tokens', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 1000, segs: [{ utf8: 'Hello world' }] },
        { tStartMs: 3000, segs: [{ utf8: 'cat' }] },
      ],
    })
    const result = parseJson3Transcript(raw)
    expect(result).toContainEqual({ word: 'hello', startMs: 1000 })
    expect(result).toContainEqual({ word: 'world', startMs: 1000 })
    expect(result).toContainEqual({ word: 'cat', startMs: 3000 })
  })

  it('skips words shorter than 3 characters', () => {
    const raw = JSON.stringify({
      events: [{ tStartMs: 1000, segs: [{ utf8: 'a cat is on it' }] }],
    })
    const words = parseJson3Transcript(raw).map(r => r.word)
    expect(words).not.toContain('a')
    expect(words).not.toContain('is')
    expect(words).not.toContain('on')
    expect(words).not.toContain('it')
    expect(words).toContain('cat')
  })

  it('lowercases and strips punctuation', () => {
    const raw = JSON.stringify({
      events: [{ tStartMs: 1000, segs: [{ utf8: "Hello, World! It's great." }] }],
    })
    const words = parseJson3Transcript(raw).map(r => r.word)
    expect(words).toContain('hello')
    expect(words).toContain('world')
    expect(words).toContain('its')
  })

  it('skips events missing tStartMs', () => {
    const raw = JSON.stringify({
      events: [
        { segs: [{ utf8: 'cat' }] },            // no tStartMs → skip
        { tStartMs: 2000, segs: [{ utf8: 'dog' }] },
      ],
    })
    const result = parseJson3Transcript(raw)
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('dog')
  })

  it('parses XML <text start="seconds"> format', () => {
    const raw = `<transcript>
      <text start="1.5">Hello world</text>
      <text start="3.0">cat</text>
    </transcript>`
    const result = parseJson3Transcript(raw)
    expect(result).toContainEqual({ word: 'hello', startMs: 1500 })
    expect(result).toContainEqual({ word: 'cat', startMs: 3000 })
  })

  it('decodes XML entities in XML format', () => {
    const raw = `<transcript><text start="1.0">cat &amp; dog</text></transcript>`
    const words = parseJson3Transcript(raw).map(r => r.word)
    expect(words).toContain('cat')
    expect(words).toContain('dog')
  })

  it('returns [] for unknown format', () => {
    expect(parseJson3Transcript('some random text')).toEqual([])
  })

  it('returns [] for invalid JSON that starts with {', () => {
    expect(parseJson3Transcript('{invalid json}')).toEqual([])
  })
})

// ── STOP_WORDS ─────────────────────────────────────────────────────────────────

describe('STOP_WORDS', () => {
  it('contains common function words', () => {
    for (const w of ['the', 'a', 'and', 'is', 'in', 'it']) {
      expect(STOP_WORDS.has(w), `expected "${w}" to be a stop word`).toBe(true)
    }
  })

  it('does not contain typical content / vocabulary words', () => {
    for (const w of ['cat', 'dog', 'elephant', 'run', 'dance']) {
      expect(STOP_WORDS.has(w), `expected "${w}" not to be a stop word`).toBe(false)
    }
  })
})

// ── pickWordFromTranscript ─────────────────────────────────────────────────────

describe('pickWordFromTranscript', () => {
  const make = (word, ms) => ({ word, startMs: ms })
  const repeat = (word, ms, n) => Array.from({ length: n }, () => make(word, ms))

  it('returns null for empty / null transcript', () => {
    expect(pickWordFromTranscript([], 0, new Map(), new Set())).toBeNull()
    expect(pickWordFromTranscript(null, 0, new Map(), new Set())).toBeNull()
  })

  it('returns null when every candidate is a stop word', () => {
    const words = [make('the', 1000), make('and', 2000)]
    expect(pickWordFromTranscript(words, 0, new Map(), new Set())).toBeNull()
  })

  it('picks the most frequent content word', () => {
    const words = [...repeat('elephant', 1000, 4), ...repeat('tiger', 2000, 1)]
    expect(pickWordFromTranscript(words, 0, new Map(), new Set())).toBe('elephant')
  })

  it('skips words already taught', () => {
    const words = [...repeat('cat', 1000, 3), ...repeat('dog', 2000, 2)]
    const taught = new Set(['cat'])
    expect(pickWordFromTranscript(words, 0, new Map(), taught)).toBe('dog')
  })

  it('returns null when all candidates are taught', () => {
    const words = repeat('cat', 1000, 3)
    expect(pickWordFromTranscript(words, 0, new Map(), new Set(['cat']))).toBeNull()
  })

  it('prefers vocab-map words over equally-frequent unknowns', () => {
    const words = [...repeat('elephant', 1000, 3), ...repeat('zorgblat', 1000, 3)]
    const vocabMap = new Map([['elephant', { word: 'elephant' }]])
    expect(pickWordFromTranscript(words, 0, vocabMap, new Set())).toBe('elephant')
  })

  it('falls back to the most-frequent word when none is in vocab', () => {
    const words = [...repeat('zorgblat', 1000, 3), ...repeat('fleebork', 1000, 1)]
    expect(pickWordFromTranscript(words, 0, new Map(), new Set())).toBe('zorgblat')
  })

  it('skips words shorter than 3 characters', () => {
    const words = [make('hi', 1000), ...repeat('cat', 2000, 2)]
    expect(pickWordFromTranscript(words, 0, new Map(), new Set())).toBe('cat')
  })
})

// ── fetchTranscript ────────────────────────────────────────────────────────────

function makeYtPage(captionUrl) {
  const player = {
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ baseUrl: captionUrl, languageCode: 'en' }],
      },
    },
  }
  return `var ytInitialPlayerResponse = ${JSON.stringify(player)};`
}

const VALID_CAPTION = '{"events":[{"tStartMs":1000,"segs":[{"utf8":"hello world"}]}]}'

describe('fetchTranscript', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns transcript when page proxy + caption fetch both succeed', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => makeYtPage('https://cap.example.com/t') })
      .mockResolvedValueOnce({ ok: true, text: async () => VALID_CAPTION }),
    )
    expect(await fetchTranscript('vid123')).toBe(VALID_CAPTION)
  })

  it('tries second proxy when first proxy returns non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, text: async () => makeYtPage('https://cap.example.com/t') })
      .mockResolvedValueOnce({ ok: true, text: async () => VALID_CAPTION }),
    )
    expect(await fetchTranscript('vid123')).toBe(VALID_CAPTION)
  })

  it('falls back to server proxy when page proxies have no caption tracks', async () => {
    const noCapPage = 'var ytInitialPlayerResponse = {"captions":{}};'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => noCapPage })
      .mockResolvedValueOnce({ ok: true, text: async () => noCapPage })
      .mockResolvedValueOnce({ ok: true, text: async () => VALID_CAPTION }),
    )
    expect(await fetchTranscript('vid123')).toBe(VALID_CAPTION)
  })

  it('returns null when all methods fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    expect(await fetchTranscript('vid123')).toBeNull()
  })

  it('returns null when server proxy returns non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'Not found' }),
    )
    expect(await fetchTranscript('vid123')).toBeNull()
  })
})

// ── fetchDynamicWordEntry ────────────────────────────────────────────────────

describe('fetchDynamicWordEntry', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns a translated entry when the API succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: 'gato' } }),
    }))
    const entry = await fetchDynamicWordEntry('catdyn1', 'es')
    expect(entry).toEqual({
      word: 'catdyn1',
      emoji: '📖',
      imageQuery: 'catdyn1',
      translations: { es: 'gato' },
      isDynamic: true,
    })
  })

  it('falls back to the English word when the translation matches the input', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: 'dogdyn2' } }),
    }))
    const entry = await fetchDynamicWordEntry('dogdyn2', 'es')
    expect(entry.translations.es).toBe('dogdyn2')
  })

  it('falls back to the English word when the response contains a "NO QUERY" marker', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: 'NO QUERY SPECIFIED' } }),
    }))
    const entry = await fetchDynamicWordEntry('birddyn3', 'fr')
    expect(entry.translations.fr).toBe('birddyn3')
  })

  it('falls back to the English word when the response contains a "#" marker', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: '#error#' } }),
    }))
    const entry = await fetchDynamicWordEntry('fishdyn4', 'de')
    expect(entry.translations.de).toBe('fishdyn4')
  })

  it('falls back to the English word when the API response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const entry = await fetchDynamicWordEntry('owldyn5', 'de')
    expect(entry.translations.de).toBe('owldyn5')
  })

  it('falls back to the English word when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const entry = await fetchDynamicWordEntry('foxdyn6', 'ru')
    expect(entry.translations.ru).toBe('foxdyn6')
  })

  it('caches results so a repeat call does not re-fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: 'oiseau' } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const first = await fetchDynamicWordEntry('birddyn7', 'fr')
    const second = await fetchDynamicWordEntry('birddyn7', 'fr')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
  })
})
