import { describe, it, expect } from 'vitest'
import { buildChallengeSchedule } from './App'

// Words known to exist in vocabulary.js (used so VOCAB_SET accepts them)
const w = (word, sec) => ({ word, startMs: sec * 1000 })
const noLevel = () => 0   // every word is new

describe('buildChallengeSchedule', () => {
  it('returns [] for an empty transcript', () => {
    expect(buildChallengeSchedule([], noLevel)).toEqual([])
  })

  it('schedules a challenge for a vocab word that appears in the transcript', () => {
    const words = [w('cat', 10), w('cat', 80), w('the', 90), w('cat', 700)]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule.length).toBeGreaterThan(0)
    expect(schedule.every(s => s.word === 'cat')).toBe(true)
  })

  it('does not schedule non-vocabulary words', () => {
    const words = [w('xyzzy', 10), w('dog', 80), w('dog', 700)]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule.every(s => s.word !== 'xyzzy')).toBe(true)
  })

  it('does not schedule stop words', () => {
    const words = [w('the', 10), w('and', 80), w('cat', 150), w('cat', 700)]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule.every(s => !['the', 'and'].includes(s.word))).toBe(true)
  })

  it('does not schedule mastered words (level >= 3)', () => {
    const mastered = (word) => word === 'cat' ? 3 : 0
    const words = [w('cat', 10), w('dog', 80), w('dog', 700)]
    const schedule = buildChallengeSchedule(words, mastered, 0, 60)
    expect(schedule.every(s => s.word !== 'cat')).toBe(true)
  })

  it('respects minGapSec between consecutive challenges', () => {
    // Place cat every 10s â€” only one per 60s gap should be scheduled
    const words = Array.from({ length: 15 }, (_, i) => w('cat', i * 10 + 10))
    words.push(w('cat', 700))
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].timeSec - schedule[i - 1].timeSec).toBeGreaterThanOrEqual(60)
    }
  })

  it('schedule is sorted by timeSec', () => {
    const words = [
      w('cat', 10), w('dog', 80), w('fish', 150),
      w('bird', 220), w('cow', 290), w('cat', 700),
    ]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].timeSec).toBeGreaterThanOrEqual(schedule[i - 1].timeSec)
    }
  })

  it('challenge timeSec is 2s after the word appears in the transcript', () => {
    const words = [w('cat', 10), w('cat', 700)]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule[0].timeSec).toBe(12)   // 10 + 2 (no durations → legacy timing)
  })

  it('all schedule entries have word, timeSec and fired=false', () => {
    const words = [w('cat', 10), w('cat', 700)]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    for (const entry of schedule) {
      expect(typeof entry.word).toBe('string')
      expect(typeof entry.timeSec).toBe('number')
      expect(entry.fired).toBe(false)
    }
  })

  it('caps a single word to â‰¤15% of the pre-filter entry count', () => {
    // 9 windows each containing only 'cat' â†’ pre-cap sorted.length = 9 > 5
    // maxPerWord = max(1, round(9 Ã— 0.15)) = max(1, 1) = 1
    const words = Array.from({ length: 9 }, (_, i) => w('cat', i * 70 + 10))
    words.push(w('cat', 700))   // extends total duration to ~700 s
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    const catCount = schedule.filter(s => s.word === 'cat').length
    expect(catCount).toBeLessThanOrEqual(2)
  })

  it('startAfterSec skips challenges before that time', () => {
    const words = [w('cat', 10), w('cat', 80), w('cat', 700)]
    const full   = buildChallengeSchedule(words, noLevel, 0, 60)
    const skipped = buildChallengeSchedule(words, noLevel, 50, 60)
    expect(skipped.every(s => s.timeSec >= 50)).toBe(true)
    expect(skipped.length).toBeLessThanOrEqual(full.length)
  })
})

// ── Quiet-slot fire timing (requires caption durations) ──────────────────────
// When caption lines carry durations, a challenge fires during the first ≥1 s
// silence within a minute of the word, instead of 2 s after it.
describe('buildChallengeSchedule — quiet-slot timing', () => {
  // word token carrying a caption-line duration (seconds)
  const wd = (word, sec, durSec) => ({ word, startMs: Math.round(sec * 1000), durMs: Math.round(durSec * 1000) })

  it('fires in the first ≥1s silence after the word', () => {
    const words = [
      wd('cat', 10, 2),     // 10–12s
      wd('the', 12.3, 0.5), // 12.3–12.8s  (gap 0.3s — too short)
      wd('and', 13, 3),     // 13–16s      (gap 0.2s — too short)
      wd('the', 20, 1),     // 20s         (gap 16→20 = 4s ≥1s silence)
      wd('cat', 80, 1),     // keeps the video long enough for the window
    ]
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule[0].word).toBe('cat')
    expect(schedule[0].timeSec).toBe(16)  // silence starts at 16s, not 12s (legacy)
  })

  it('waits for the caption line to end when speech is continuous for a minute', () => {
    const words = [wd('cat', 10, 2)]      // 10–12s
    // back-to-back 3s lines (no gaps) from 12s out past the 1-minute mark
    for (let s = 12; s <= 90; s += 3) words.push(wd('the', s, 3))
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule[0].word).toBe('cat')
    // limit = 70s; the line spanning that mark is [69,72] → fire at its end, 72s
    expect(schedule[0].timeSec).toBe(72)
  })

  it('still uses 2s-after-word timing when no durations are present', () => {
    const words = [w('cat', 10), w('cat', 700)]   // plain {word,startMs}
    const schedule = buildChallengeSchedule(words, noLevel, 0, 60)
    expect(schedule[0].timeSec).toBe(12)
  })
})
