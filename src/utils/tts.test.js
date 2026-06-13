import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sleep, LANG_TTS, cancelSpeech, slugify, translationAudioUrl, speakTranslation } from './tts'
import { LANGUAGES } from '../data/vocabulary'

// ── LANG_TTS ───────────────────────────────────────────────────────────────────

describe('LANG_TTS', () => {
  it('has a locale for every language in the LANGUAGES list', () => {
    for (const { code } of LANGUAGES) {
      expect(LANG_TTS[code], `Missing TTS locale for language "${code}"`).toBeTruthy()
    }
  })

  it('every locale is a valid BCP-47 tag (contains a hyphen)', () => {
    for (const [code, locale] of Object.entries(LANG_TTS)) {
      expect(locale, `"${code}" locale "${locale}" is not BCP-47`).toMatch(/-/)
    }
  })
})

// ── sleep ──────────────────────────────────────────────────────────────────────

describe('sleep', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves after the requested delay', async () => {
    let resolved = false
    const p = sleep(200).then(() => { resolved = true })
    expect(resolved).toBe(false)
    vi.advanceTimersByTime(200)
    await p
    expect(resolved).toBe(true)
  })

  it('does not resolve before the delay elapses', async () => {
    let resolved = false
    sleep(500).then(() => { resolved = true })
    vi.advanceTimersByTime(499)
    await Promise.resolve()
    expect(resolved).toBe(false)
  })
})

// ── cancelSpeech ───────────────────────────────────────────────────────────────

describe('cancelSpeech', () => {
  it('calls speechSynthesis.cancel() when available', () => {
    const cancel = vi.fn()
    window.speechSynthesis = { cancel }
    cancelSpeech()
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('does not throw when speechSynthesis is absent', () => {
    const orig = window.speechSynthesis
    delete window.speechSynthesis
    expect(() => cancelSpeech()).not.toThrow()
    if (orig) window.speechSynthesis = orig
  })

  it('does not throw when speechSynthesis.cancel throws internally', () => {
    window.speechSynthesis = { cancel: () => { throw new Error('boom') } }
    expect(() => cancelSpeech()).not.toThrow()
  })
})

// ── slugify ────────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases simple words unchanged', () => {
    expect(slugify('cat')).toBe('cat')
  })

  it('replaces spaces and punctuation with a single hyphen', () => {
    expect(slugify('Ice Cream')).toBe('ice-cream')
    expect(slugify('  Butter-Fly!! ')).toBe('butter-fly')
  })
})

// ── translationAudioUrl ────────────────────────────────────────────────────────

describe('translationAudioUrl', () => {
  it('builds a static asset path from the word and language', () => {
    expect(translationAudioUrl('ice cream', 'he')).toBe('/audio/translations/he/ice-cream.mp3')
  })
})

// ── speakTranslation ───────────────────────────────────────────────────────────

describe('speakTranslation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.speechSynthesis
  })

  it('resolves once the pre-generated clip finishes playing', async () => {
    let captured
    vi.stubGlobal('Audio', class {
      constructor(src) { this.src = src; captured = this }
      play() { return Promise.resolve() }
    })

    const p = speakTranslation('cat', 'he', 'חתול', 'he-IL')
    expect(captured.src).toBe('/audio/translations/he/cat.mp3')
    captured.onended()
    await p
  })

  it('falls back to speechSynthesis (and still resolves) when the clip errors', async () => {
    let captured
    vi.stubGlobal('Audio', class {
      constructor(src) { this.src = src; captured = this }
      play() { return Promise.resolve() }
    })
    // No speechSynthesis installed → speakAndWait's fallback resolves immediately
    delete window.speechSynthesis

    const p = speakTranslation('cat', 'he', 'חתול', 'he-IL')
    captured.onerror(new Error('404'))
    await p
  })

  it('cancelSpeech pauses an in-flight translation clip', () => {
    const pause = vi.fn()
    vi.stubGlobal('Audio', class {
      constructor(src) { this.src = src }
      play() { return Promise.resolve() }
      pause() { pause() }
    })

    speakTranslation('cat', 'he', 'חתול', 'he-IL')
    cancelSpeech()
    expect(pause).toHaveBeenCalledOnce()
  })

  it('falls straight through to speechSynthesis when Audio is unavailable', async () => {
    vi.stubGlobal('Audio', undefined)
    delete window.speechSynthesis

    await speakTranslation('cat', 'he', 'חתול', 'he-IL')
  })
})
