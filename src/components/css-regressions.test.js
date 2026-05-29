import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const challengeCss = readFileSync(resolve(process.cwd(), 'src/components/WordChallenge.css'), 'utf-8')
const videoCss     = readFileSync(resolve(process.cwd(), 'src/components/VideoPlayer.css'), 'utf-8')

// Match a CSS property inside a named rule, tolerating any whitespace/newlines.
function ruleContains(css, selector, property, value) {
  const selectorIdx = css.indexOf(selector)
  if (selectorIdx === -1) return false
  const blockStart = css.indexOf('{', selectorIdx)
  const blockEnd   = css.indexOf('}', blockStart)
  if (blockStart === -1 || blockEnd === -1) return false
  const block = css.slice(blockStart + 1, blockEnd)
  return new RegExp(`${property}\\s*:\\s*${value}`).test(block)
}

describe('CSS regressions — critical visual values', () => {
  // This test exists because rotating the phone caused the YouTube iframe
  // to float above the challenge overlay (z-index was too low at 100).
  it('challenge-overlay z-index is ≥ 9000 so it covers the YouTube iframe on mobile', () => {
    const idx = challengeCss.indexOf('.challenge-overlay')
    const blockStart = challengeCss.indexOf('{', idx)
    const blockEnd   = challengeCss.indexOf('}', blockStart)
    const block = challengeCss.slice(blockStart + 1, blockEnd)
    const match = block.match(/z-index\s*:\s*(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match[1])).toBeGreaterThanOrEqual(9000)
  })

  // This test exists because after a rotation/resize the iframe can escape
  // the stacking context. pointer-events:none stops it capturing touch events.
  it('video-wrapper--challenge has pointer-events: none', () => {
    expect(ruleContains(videoCss, '.video-wrapper--challenge', 'pointer-events', 'none')).toBe(true)
  })

  it('video-wrapper--challenge has z-index: 0 to stay below the fixed overlay', () => {
    expect(ruleContains(videoCss, '.video-wrapper--challenge', 'z-index', '0')).toBe(true)
  })
})
