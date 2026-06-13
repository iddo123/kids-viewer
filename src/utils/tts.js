// ── Shared TTS utilities ──────────────────────────────────────────────────────

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export const LANG_TTS = {
  he: 'he-IL', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
  ar: 'ar-SA', ru: 'ru-RU', zh: 'zh-CN', pt: 'pt-BR',
}

/**
 * Speak `text` in `lang` and resolve when done.
 *
 * Chrome bug: calling speak() immediately after the previous utterance's
 * onend fires can silently drop the utterance.  The fix is to give the
 * synthesis engine a short breather (setTimeout 0) before queueing.
 */
export function speakAndWait(text, lang, rate = 0.85) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return }

    setTimeout(() => {
      // On desktop Chrome the voice list loads asynchronously. If voices are
      // already loaded and none match the requested language (common for
      // languages like Hebrew, Arabic on Windows), skip the utterance
      // immediately rather than waiting for the 3–6 s hard-timeout.
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0 && lang !== 'en-US') {
        const prefix   = lang.split('-')[0]
        const hasVoice = voices.some(v => v.lang === lang || v.lang.startsWith(prefix))
        if (!hasVoice) {
          console.log(`[tts] no voice installed for ${lang} — skipping translation audio`)
          resolve()
          return
        }
      }

      const utt = new SpeechSynthesisUtterance(text)
      utt.lang  = lang
      utt.rate  = rate

      let finished = false
      const done = () => { if (!finished) { finished = true; resolve() } }

      utt.onend   = done
      utt.onerror = (e) => {
        console.warn(`[tts] error speaking "${text}" (${lang}):`, e.error)
        done()
      }

      window.speechSynthesis.speak(utt)

      // Hard fallback — browsers that never fire onend
      setTimeout(done, Math.max(3000, text.length * 200))
    }, 50)
  })
}

export function cancelSpeech() {
  try { window.speechSynthesis?.cancel() } catch {}
  if (currentAudio) {
    try { currentAudio.pause() } catch {}
    currentAudio = null
  }
}

// ── Pre-generated translation audio ───────────────────────────────────────────
//
// Many browsers (especially desktop Chrome/Edge) don't ship speech-synthesis
// voices for languages like Hebrew, Arabic, Russian, or Chinese, so the
// hasVoice check above silently skips the translation. As a fallback, the
// build can pre-render short MP3 clips (see scripts/generate-translation-audio.js)
// into public/audio/translations/<lang>/<slug>.mp3.

/** Turn a vocabulary word into a filename-safe slug, e.g. "ice cream" -> "ice-cream". */
export function slugify(word) {
  return word.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function translationAudioUrl(word, lang) {
  return `/audio/translations/${lang}/${slugify(word)}.mp3`
}

let currentAudio = null

/**
 * Play the pre-generated translation clip for `word` in `lang`, resolving when
 * it finishes. Falls back to speakAndWait(text, ttsLocale) — the browser's
 * speech synthesis — if the clip is missing (e.g. a word added before audio
 * regeneration) or fails to play.
 */
export function speakTranslation(word, lang, text, ttsLocale, rate = 0.85) {
  return new Promise(resolve => {
    if (typeof Audio === 'undefined') { speakAndWait(text, ttsLocale, rate).then(resolve); return }

    const audio = new Audio(translationAudioUrl(word, lang))
    currentAudio = audio

    const fallback = () => {
      if (currentAudio === audio) currentAudio = null
      speakAndWait(text, ttsLocale, rate).then(resolve)
    }
    const done = () => {
      if (currentAudio === audio) currentAudio = null
      resolve()
    }

    audio.onended = done
    audio.onerror = fallback

    let playResult
    try { playResult = audio.play() } catch { fallback(); return }
    if (playResult && typeof playResult.catch === 'function') playResult.catch(fallback)
  })
}

export function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 1000
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}
