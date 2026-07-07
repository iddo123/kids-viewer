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

  it('never gates while the subscription status is still loading', () => {
    // A subscribed user whose status has not yet resolved must not be blocked.
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT, true)).toBe(false)
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT + 5, true)).toBe(false)
  })

  it('gates an over-limit free user once loading has finished', () => {
    expect(shouldShowUpgrade(false, FREE_VIDEO_LIMIT, false)).toBe(true)
  })
})
