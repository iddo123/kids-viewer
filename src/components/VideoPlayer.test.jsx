import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import VideoPlayer from './VideoPlayer'

// Minimal YouTube API stub. Must use a regular function (not arrow) so it
// can be called with `new`. VideoPlayer checks window.YT.Player at mount
// time and immediately calls `new Player(...)` when the API is "ready".
beforeEach(() => {
  window.YT = {
    Player: vi.fn(function () {
      this.destroy         = vi.fn()
      this.pauseVideo      = vi.fn()
      this.playVideo       = vi.fn()
      this.getCurrentTime  = vi.fn(() => 0)
      this.getDuration     = vi.fn(() => 0)
      this.getPlayerState  = vi.fn(() => -1)
    }),
  }
})

describe('VideoPlayer — inChallenge class', () => {
  it('adds video-wrapper--challenge when inChallenge is true', () => {
    const { container } = render(
      <VideoPlayer videoId="abc1234567" inChallenge={true} />
    )
    expect(container.querySelector('.video-wrapper')).toHaveClass('video-wrapper--challenge')
  })

  it('does NOT add video-wrapper--challenge when inChallenge is false', () => {
    const { container } = render(
      <VideoPlayer videoId="abc1234567" inChallenge={false} />
    )
    expect(container.querySelector('.video-wrapper')).not.toHaveClass('video-wrapper--challenge')
  })

  it('does NOT add video-wrapper--challenge when inChallenge is omitted', () => {
    const { container } = render(<VideoPlayer videoId="abc1234567" />)
    expect(container.querySelector('.video-wrapper')).not.toHaveClass('video-wrapper--challenge')
  })
})
