// ── Syllable splitting ────────────────────────────────────────────────────────
//
// Heuristic English syllabifier used to "sound out" challenge words one chunk
// at a time. It's not phonetically perfect — English spelling is too
// irregular for that without a pronunciation dictionary — but it produces
// reasonable chunks for the short, concrete words in the vocabulary list.

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

// Adjacent vowel pairs that represent a single sound and stay together
// (e.g. the "ai" in "rain", the "oo" in "moon").
const VOWEL_DIGRAPHS = new Set([
  'ai', 'ay', 'ea', 'ee', 'oa', 'oo', 'ou', 'ow', 'oi', 'oy',
  'au', 'aw', 'ie', 'ue', 'ui', 'ey', 'oe',
])

// Consonant clusters that can start an English syllable, so the whole
// cluster moves to the following syllable (maximal-onset principle).
const ONSETS_2 = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
  'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
  'ph', 'th', 'sh', 'ch', 'wh', 'gh', 'wr', 'kn', 'gn', 'qu',
])
const ONSETS_3 = new Set(['scr', 'spl', 'spr', 'str', 'squ', 'thr', 'shr', 'chr', 'phr'])

function isVowel(ch, idx) {
  return VOWELS.has(ch) || (ch === 'y' && idx > 0)
}

/**
 * Split a word (or short phrase) into syllable-sized chunks for "sound it
 * out" playback. Words of 3 letters or fewer are always a single chunk.
 */
export function splitSyllables(word) {
  return word.split(/\s+/).filter(Boolean).flatMap(splitToken)
}

function splitToken(token) {
  const lower = token.toLowerCase()
  const n = lower.length
  if (n <= 3) return [token]

  // 1. Find vowel-group nuclei, merging recognised digraphs.
  const groups = []
  let i = 0
  while (i < n) {
    if (isVowel(lower[i], i)) {
      let j = i + 1
      if (j < n && isVowel(lower[j], j) && VOWEL_DIGRAPHS.has(lower[i] + lower[j])) j++
      groups.push([i, j])
      i = j
    } else {
      i++
    }
  }

  // 2. Drop a trailing silent "e" (cake, horse, grapes, scared…) so it
  // doesn't count as its own syllable nucleus.
  if (groups.length > 1) {
    const last = groups[groups.length - 1]
    const isSingleE          = last[1] - last[0] === 1 && lower[last[0]] === 'e'
    const precededByConsonant = !isVowel(lower[last[0] - 1], last[0] - 1)
    const trailingConsonants  = n - last[1]
    if (isSingleE && precededByConsonant && trailingConsonants <= 1) groups.pop()
  }

  if (groups.length <= 1) return [token]

  // 3. Pick a split point between each pair of adjacent nuclei.
  const cuts = [0]
  for (let g = 0; g < groups.length - 1; g++) {
    const gapStart = groups[g][1]
    const gapEnd   = groups[g + 1][0]
    const gapLen   = gapEnd - gapStart
    const cluster  = lower.slice(gapStart, gapEnd)

    let cut
    if (gapLen <= 1) {
      cut = gapStart                                     // V.CV — consonant joins the next syllable
    } else if (ONSETS_3.has(cluster) || (gapLen === 2 && ONSETS_2.has(cluster))) {
      cut = gapStart                                      // whole onset cluster moves on
    } else if (gapLen === 3 && ONSETS_2.has(cluster.slice(1))) {
      cut = gapStart + 1                                  // VC.CCV
    } else {
      cut = gapStart + 1                                  // VC.CV — first consonant closes the syllable
    }
    cuts.push(cut)
  }
  cuts.push(n)

  const syllables = []
  for (let k = 0; k < cuts.length - 1; k++) syllables.push(token.slice(cuts[k], cuts[k + 1]))
  return syllables
}
