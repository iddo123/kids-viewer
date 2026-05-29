import { describe, it, expect } from 'vitest'
import { extractVideoId, checkPronunciation, scoreToLevel } from './helpers.js'

describe('extractVideoId', () => {
  it('parses a standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses a youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses an embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses a Shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('accepts a bare 11-character video ID', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for an empty string', () => {
    expect(extractVideoId('')).toBeNull()
  })

  it('returns null for a non-YouTube URL', () => {
    expect(extractVideoId('https://example.com/watch?v=abc123')).toBeNull()
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(extractVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ')
  })
})

describe('checkPronunciation', () => {
  it('accepts an exact match', () => {
    expect(checkPronunciation('cat', 'cat')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(checkPronunciation('Cat', 'cat')).toBe(true)
  })

  it('accepts "a cat" when target is "cat"', () => {
    expect(checkPronunciation('a cat', 'cat')).toBe(true)
  })

  it('accepts "I said dog" when target is "dog"', () => {
    expect(checkPronunciation('I said dog', 'dog')).toBe(true)
  })

  it('accepts a near-match within 40% edit distance (elefant → elephant)', () => {
    expect(checkPronunciation('elefant', 'elephant')).toBe(true)
  })

  it('rejects a clearly wrong word', () => {
    expect(checkPronunciation('banana', 'cat')).toBe(false)
  })

  it('accepts accent-driven ending drift via prefix check (duc → duck)', () => {
    expect(checkPronunciation('duc', 'duck')).toBe(true)
  })

  it('accepts accent vowel shift via edit distance (dak → duck)', () => {
    expect(checkPronunciation('dak', 'duck')).toBe(true)
  })

  it('accepts any matching alternative from an array', () => {
    expect(checkPronunciation(['wrong', 'cat', 'nope'], 'cat')).toBe(true)
  })

  it('rejects when no alternative matches', () => {
    expect(checkPronunciation(['wrong', 'nope'], 'cat')).toBe(false)
  })

  it('rejects an empty spoken string', () => {
    expect(checkPronunciation('', 'cat')).toBe(false)
  })
})

describe('scoreToLevel', () => {
  it('returns Beginner for score 0', () => {
    expect(scoreToLevel(0).title).toBe('Beginner')
  })

  it('returns Learner at the 300 threshold', () => {
    expect(scoreToLevel(300).title).toBe('Learner')
  })

  it('returns Speaker at the 800 threshold', () => {
    expect(scoreToLevel(800).title).toBe('Speaker')
  })

  it('returns Explorer at the 1600 threshold', () => {
    expect(scoreToLevel(1600).title).toBe('Explorer')
  })

  it('returns Champion at the 3000 threshold', () => {
    expect(scoreToLevel(3000).title).toBe('Champion')
  })

  it('Champion has no next threshold', () => {
    expect(scoreToLevel(9999).next).toBeNull()
  })
})
