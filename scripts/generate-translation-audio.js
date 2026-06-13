// ── Pre-generate translation TTS clips ──────────────────────────────────────
//
// Many browsers (especially desktop Chrome/Edge) don't ship speech-synthesis
// voices for languages like Hebrew, Arabic, Russian, or Chinese, so
// `speechSynthesis.speak()` silently does nothing for those translations
// (see src/utils/tts.js). To make translation audio work everywhere, this
// script pre-renders one short MP3 per vocabulary word/language using the
// (unofficial, free) Google Translate TTS endpoint and writes it to
// public/audio/translations/<lang>/<slug>.mp3, where it's served as a static
// asset and played directly by speakTranslation().
//
// Usage:
//   node scripts/generate-translation-audio.js            # generate everything missing
//   node scripts/generate-translation-audio.js --limit=5  # only the first N words (prototyping)
//
// Safe to re-run: existing files are skipped, so interrupted runs resume.

import { writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAudioBase64 } from 'google-tts-api'
import { vocabulary } from '../src/data/vocabulary.js'
import { slugify } from '../src/utils/tts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR   = path.join(__dirname, '..', 'public', 'audio', 'translations')

// Google Translate TTS language codes for each supported language.
// Mostly the LANG_TTS prefixes from tts.js, but Translate's TTS endpoint wants
// zh-CN for Chinese, "iw" (old ISO code) for Hebrew, and plain "pt" (not "pt-BR").
const GTTS_LANG = {
  he: 'iw', es: 'es', fr: 'fr', de: 'de',
  ar: 'ar', ru: 'ru', zh: 'zh-CN', pt: 'pt',
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit    = limitArg ? Number(limitArg.split('=')[1]) : Infinity
  const entries  = vocabulary.slice(0, limit)

  let generated = 0, skipped = 0, failed = 0

  for (const entry of entries) {
    const slug = slugify(entry.word)

    for (const [lang, gttsLang] of Object.entries(GTTS_LANG)) {
      const text = entry.translations?.[lang]
      if (!text) continue

      const dir  = path.join(OUT_DIR, lang)
      const file = path.join(dir, `${slug}.mp3`)

      if (await fileExists(file)) { skipped++; continue }

      try {
        const base64 = await getAudioBase64(text, { lang: gttsLang, slow: false })
        await mkdir(dir, { recursive: true })
        await writeFile(file, Buffer.from(base64, 'base64'))
        generated++
        console.log(`generated ${lang}/${slug}.mp3  (${text})`)
      } catch (err) {
        failed++
        console.error(`FAILED ${lang}/${slug}.mp3 (${text}) — ${err.message}`)
      }

      await sleep(300) // be polite to the unofficial endpoint
    }
  }

  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed}`)
}

main()
