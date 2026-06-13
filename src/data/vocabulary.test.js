import { describe, it, expect } from 'vitest'
import { vocabulary, LANGUAGES } from './vocabulary'

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
