import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Sentry from '@sentry/node'
import { reportError } from '../_sentry'

vi.mock('@sentry/node', () => ({
  init:             vi.fn(),
  captureException: vi.fn(),
  flush:            vi.fn().mockResolvedValue(true),
}))

// Tests run in order — they exercise the shared module's `initialized`
// flag, which is set once across the whole process lifetime (matches
// the real Lambda container behavior these functions run in).
describe('_sentry', () => {
  const originalDsn     = process.env.SENTRY_DSN
  const originalContext = process.env.CONTEXT

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.SENTRY_DSN = originalDsn
    process.env.CONTEXT    = originalContext
  })

  it('does nothing when SENTRY_DSN is unset', async () => {
    delete process.env.SENTRY_DSN

    await reportError(new Error('boom'))

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.flush).not.toHaveBeenCalled()
  })

  it('initializes, captures, and flushes on first call once SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    process.env.CONTEXT    = 'production'
    const err = new Error('boom')

    await reportError(err)

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn:            'https://example@sentry.io/1',
      environment:    'production',
      sendDefaultPii: false,
    }))
    expect(Sentry.captureException).toHaveBeenCalledWith(err)
    expect(Sentry.flush).toHaveBeenCalledWith(2000)
  })

  it('does not re-initialize on subsequent calls', async () => {
    await reportError(new Error('another'))

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    expect(Sentry.flush).toHaveBeenCalledTimes(1)
  })
})
