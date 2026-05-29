export function extractVideoId(input) {
  if (!input) return null
  const trimmed = input.trim()
  // Full URL patterns
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = trimmed.match(p)
    if (m) return m[1]
  }
  // Bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return null
}

function levenshtein(a, b) {
  const dp = Array(b.length + 1).fill(0).map((_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const curr = a[i - 1] === b[j - 1]
        ? dp[j - 1]
        : 1 + Math.min(dp[j], dp[j - 1], prev)
      dp[j - 1] = prev
      prev = curr
    }
    dp[b.length] = prev
  }
  return dp[b.length]
}

/**
 * Check if any of the spoken alternatives match the target word.
 * `spoken` can be a single string or an array of alternatives (all are tried).
 */
export function checkPronunciation(spoken, target) {
  const alts = Array.isArray(spoken) ? spoken : [spoken]
  return alts.some(s => _matchesTarget(s, target))
}

function _matchesTarget(spoken, target) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z]/g, '').trim()
  const spokenClean = clean(spoken)
  const targetClean = clean(target)
  if (!spokenClean) return false

  // Exact match or the full spoken string contains the target
  if (spokenClean === targetClean) return true
  if (spokenClean.includes(targetClean)) return true

  // Check each individual spoken word (handles "a cat" → "cat", "I said dog" → "dog")
  const threshold = Math.max(1, Math.floor(targetClean.length * 0.25))
  for (const w of spokenClean.split(/\s+/)) {
    if (w === targetClean) return true
    if (levenshtein(w, targetClean) <= threshold) return true
  }
  return false
}

export function getImageUrl(word) {
  return `https://loremflickr.com/400/300/${encodeURIComponent(word)}`
}

export function scoreToLevel(score) {
  if (score < 300)  return { level: 1, title: 'Beginner',  icon: '🌱', next: 300  }
  if (score < 800)  return { level: 2, title: 'Learner',   icon: '📖', next: 800  }
  if (score < 1600) return { level: 3, title: 'Speaker',   icon: '🗣️', next: 1600 }
  if (score < 3000) return { level: 4, title: 'Explorer',  icon: '🌍', next: 3000 }
  return               { level: 5, title: 'Champion',  icon: '🏆', next: null  }
}
