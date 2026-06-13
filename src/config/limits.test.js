import { describe, it, expect } from 'vitest'
import { FREE_VIDEO_LIMIT, shouldShowUpgrade } from './limits'

describe('shouldShowUpgrade', () => {
  it('never shows the prompt to active subscribers', () => {
    expect(shouldShowUpgrade(true, 0)).toBe(false)
    expect(shouldShowUpgrade(true, FREE_VIDEO_LIMIT + 10)).toBe(false)
  })

  it('does not show the prompt to free users under the limit', () => {
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT - 1)).toBe(false)
  })

  it('shows the prompt to free users at or over the limit', () => {
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT)).toBe(true)
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT + 1)).toBe(true)
  })
})
