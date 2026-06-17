import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { vocabulary, LANGUAGES, CATEGORIES, getChallengeOptions } from './vocabulary'
import { slugify } from '../utils/tts'

const LANG_CODES = LANGUAGES.map(l => l.code)

describe('vocabulary data integrity', () => {
  it('has entries', () => {
    expect(vocabulary.length).toBeGreaterThan(0)
  })

  it('every entry has word, emoji, imageQuery and translations', () => {
    for (const entry of vocabulary) {
      expect(entry.word,        `${entry.word}: missing word`).toBeTruthy()
      expect(entry.emoji,       `${entry.word}: missing emoji`).toBeTruthy()
      expect(entry.imageQuery,  `${entry.word}: missing imageQuery`).toBeTruthy()
      expect(entry.translations,`${entry.word}: missing translations`).toBeTruthy()
    }
  })

  it('every entry has a translation for all 8 supported languages', () => {
    for (const entry of vocabulary) {
      for (const code of LANG_CODES) {
        expect(
          entry.translations[code],
          `"${entry.word}" is missing the "${code}" translation`,
        ).toBeTruthy()
      }
    }
  })

  it('no two entries share the same word', () => {
    const words = vocabulary.map(e => e.word)
    const unique = new Set(words)
    expect(unique.size).toBe(words.length)
  })

  it('all word values are non-empty lowercase strings', () => {
    for (const entry of vocabulary) {
      expect(typeof entry.word).toBe('string')
      expect(entry.word.length).toBeGreaterThan(0)
      expect(entry.word).toBe(entry.word.toLowerCase())
    }
  })

  it('no translation value is an empty string', () => {
    for (const entry of vocabulary) {
      for (const code of LANG_CODES) {
        const t = entry.translations[code]
        expect(
          typeof t === 'string' && t.trim().length > 0,
          `"${entry.word}" has an empty "${code}" translation`,
        ).toBe(true)
      }
    }
  })

  it('LANGUAGES list has exactly 8 entries matching the 8 translation keys', () => {
    expect(LANG_CODES).toHaveLength(8)
    expect(LANG_CODES).toContain('he')
    expect(LANG_CODES).toContain('es')
    expect(LANG_CODES).toContain('fr')
    expect(LANG_CODES).toContain('de')
    expect(LANG_CODES).toContain('ar')
    expect(LANG_CODES).toContain('ru')
    expect(LANG_CODES).toContain('zh')
    expect(LANG_CODES).toContain('pt')
  })

  it('contains key anchor words from expected categories', () => {
    const words = new Set(vocabulary.map(e => e.word))
    // Animals
    expect(words.has('cat')).toBe(true)
    expect(words.has('dog')).toBe(true)
    expect(words.has('elephant')).toBe(true)
    // Food
    expect(words.has('apple')).toBe(true)
    expect(words.has('banana')).toBe(true)
    // Colors
    expect(words.has('red')).toBe(true)
    expect(words.has('blue')).toBe(true)
    // Actions
    expect(words.has('run')).toBe(true)
    expect(words.has('jump')).toBe(true)
  })
})

describe('getChallengeOptions', () => {
  const words = new Set(vocabulary.map(e => e.word))

  it('returns the target plus two distractors (3 options)', () => {
    const opts = getChallengeOptions('truck')
    expect(opts).toHaveLength(3)
    expect(opts.some(o => o.word === 'truck')).toBe(true)
  })

  it('every option has a distinct emoji so choices are distinguishable', () => {
    for (const word of ['truck', 'cat', 'apple', 'red', 'happy']) {
      const emojis = getChallengeOptions(word).map(o => o.emoji)
      expect(new Set(emojis).size, `${word} produced a duplicate emoji`).toBe(emojis.length)
    }
  })

  it('prefers distractors from the same category', () => {
    const transport = new Set(CATEGORIES.transport)
    // Run several times since selection is randomised
    for (let i = 0; i < 25; i++) {
      const opts = getChallengeOptions('truck')
      for (const o of opts) expect(transport.has(o.word)).toBe(true)
    }
  })

  it('falls back to random words when a category is too small for 3 options', () => {
    // "weather" only has 2 words, so the 3rd option must come from elsewhere
    const opts = getChallengeOptions('hot')
    expect(opts).toHaveLength(3)
    expect(opts.every(o => words.has(o.word))).toBe(true)
  })

  it('returns an empty array for an unknown word', () => {
    expect(getChallengeOptions('notarealword')).toEqual([])
  })

  it('every category word exists in the vocabulary', () => {
    for (const [cat, list] of Object.entries(CATEGORIES)) {
      for (const w of list) {
        expect(words.has(w), `${cat} lists "${w}" which is not in the vocabulary`).toBe(true)
      }
    }
  })
})

describe('translation audio assets', () => {
  it('every vocabulary word has a pre-generated MP3 for all 8 languages', () => {
    const missing = []
    for (const entry of vocabulary) {
      for (const code of LANG_CODES) {
        const file = resolve(process.cwd(), 'public', 'audio', 'translations', code, `${slugify(entry.word)}.mp3`)
        if (!existsSync(file)) missing.push(`${entry.word} (${code})`)
      }
    }
    expect(missing, `missing audio files: ${missing.join(', ')}`).toEqual([])
  })
})
