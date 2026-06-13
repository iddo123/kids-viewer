import { describe, it, expect } from 'vitest'
import { splitSyllables } from './syllables'

describe('splitSyllables', () => {
  it('keeps short and single-syllable words whole', () => {
    expect(splitSyllables('cat')).toEqual(['cat'])
    expect(splitSyllables('dog')).toEqual(['dog'])
    expect(splitSyllables('eye')).toEqual(['eye'])
    expect(splitSyllables('sheep')).toEqual(['sheep'])
    expect(splitSyllables('cloud')).toEqual(['cloud'])
  })

  it('drops a silent trailing "e"', () => {
    expect(splitSyllables('cake')).toEqual(['cake'])
    expect(splitSyllables('horse')).toEqual(['horse'])
    expect(splitSyllables('snake')).toEqual(['snake'])
    expect(splitSyllables('close')).toEqual(['close'])
  })

  it('drops a silent "e" followed by an inflectional consonant', () => {
    expect(splitSyllables('grapes')).toEqual(['grapes'])
    expect(splitSyllables('scared')).toEqual(['scared'])
  })

  it('splits two-syllable words', () => {
    expect(splitSyllables('lion')).toEqual(['li', 'on'])
    expect(splitSyllables('monkey')).toEqual(['mon', 'key'])
    expect(splitSyllables('rabbit')).toEqual(['rab', 'bit'])
    expect(splitSyllables('yellow')).toEqual(['yel', 'low'])
    expect(splitSyllables('giraffe')).toEqual(['gi', 'raffe'])
    expect(splitSyllables('penguin')).toEqual(['pen', 'guin'])
    expect(splitSyllables('dolphin')).toEqual(['dol', 'phin'])
    expect(splitSyllables('rainbow')).toEqual(['rain', 'bow'])
    expect(splitSyllables('mountain')).toEqual(['moun', 'tain'])
    expect(splitSyllables('guitar')).toEqual(['gui', 'tar'])
    expect(splitSyllables('zebra')).toEqual(['ze', 'bra'])
    expect(splitSyllables('happy')).toEqual(['hap', 'py'])
    expect(splitSyllables('angry')).toEqual(['an', 'gry'])
  })

  it('splits three-syllable words', () => {
    expect(splitSyllables('elephant')).toEqual(['e', 'le', 'phant'])
    expect(splitSyllables('banana')).toEqual(['ba', 'na', 'na'])
    expect(splitSyllables('butterfly')).toEqual(['but', 'ter', 'fly'])
    expect(splitSyllables('strawberry')).toEqual(['straw', 'ber', 'ry'])
    expect(splitSyllables('potato')).toEqual(['po', 'ta', 'to'])
    expect(splitSyllables('crocodile')).toEqual(['cro', 'co', 'dile'])
    expect(splitSyllables('piano')).toEqual(['pi', 'a', 'no'])
    expect(splitSyllables('family')).toEqual(['fa', 'mi', 'ly'])
  })

  it('splits four-syllable words', () => {
    expect(splitSyllables('watermelon')).toEqual(['wa', 'ter', 'me', 'lon'])
  })

  it('handles each word in a multi-word phrase independently', () => {
    expect(splitSyllables('ice cream')).toEqual(['ice', 'cream'])
  })
})
