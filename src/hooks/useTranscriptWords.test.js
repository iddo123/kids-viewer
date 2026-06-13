import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTranscriptWords } from './useTranscriptWords'
import { fetchTranscript, parseJson3Transcript } from '../utils/transcript'

vi.mock('../utils/transcript', () => ({
  fetchTranscript: vi.fn(),
  parseJson3Transcript: vi.fn(),
}))

describe('useTranscriptWords', () => {
  beforeEach(() => {
    fetchTranscript.mockReset()
    parseJson3Transcript.mockReset()
  })

  it('starts idle when there is no videoId', () => {
    const { result } = renderHook(() => useTranscriptWords(null))
    expect(result.current.status).toBe('idle')
    expect(result.current.transcriptWords).toEqual([])
  })

  it('transitions to loading then ready with the parsed words', async () => {
    fetchTranscript.mockResolvedValue('raw transcript')
    parseJson3Transcript.mockReturnValue([{ word: 'cat', startMs: 1000 }])
    const { result } = renderHook(() => useTranscriptWords('vid1'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.transcriptWords).toEqual([{ word: 'cat', startMs: 1000 }])
    expect(fetchTranscript).toHaveBeenCalledWith('vid1')
  })

  it('marks unavailable when fetchTranscript returns null', async () => {
    fetchTranscript.mockResolvedValue(null)
    const { result } = renderHook(() => useTranscriptWords('vid2'))
    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    expect(result.current.transcriptWords).toEqual([])
  })

  it('marks unavailable when the parsed transcript is empty', async () => {
    fetchTranscript.mockResolvedValue('raw')
    parseJson3Transcript.mockReturnValue([])
    const { result } = renderHook(() => useTranscriptWords('vid3'))
    await waitFor(() => expect(result.current.status).toBe('unavailable'))
  })

  it('marks unavailable when fetchTranscript rejects', async () => {
    fetchTranscript.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useTranscriptWords('vid4'))
    await waitFor(() => expect(result.current.status).toBe('unavailable'))
  })

  it('does not re-fetch for the same videoId on re-render', async () => {
    fetchTranscript.mockResolvedValue('raw')
    parseJson3Transcript.mockReturnValue([{ word: 'cat', startMs: 1000 }])
    const { result, rerender } = renderHook(({ videoId }) => useTranscriptWords(videoId), {
      initialProps: { videoId: 'vid5' },
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender({ videoId: 'vid5' })
    expect(fetchTranscript).toHaveBeenCalledTimes(1)
  })

  it('resets to idle when videoId becomes falsy', async () => {
    fetchTranscript.mockResolvedValue('raw')
    parseJson3Transcript.mockReturnValue([{ word: 'cat', startMs: 1000 }])
    const { result, rerender } = renderHook(({ videoId }) => useTranscriptWords(videoId), {
      initialProps: { videoId: 'vid6' },
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender({ videoId: null })
    expect(result.current.status).toBe('idle')
    expect(result.current.transcriptWords).toEqual([])
  })
})
