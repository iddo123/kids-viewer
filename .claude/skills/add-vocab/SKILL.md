---
name: add-vocab
description: Add one or more words to the curated vocabulary in src/data/vocabulary.js. Each word needs an emoji, imageQuery, and translations in all 8 supported languages (he, es, fr, de, ar, ru, zh, pt). Use this to expand the challenge word pool.
disable-model-invocation: false
---

The user wants to add new word(s) to the vocabulary list at `src/data/vocabulary.js`.

## Steps

1. **Read `src/data/vocabulary.js`** to understand the current structure and see existing entries for reference.

2. **For each word the user wants to add**, gather:
   - `word` — the English word (lowercase)
   - `emoji` — a single relevant emoji
   - `imageQuery` — a 1-3 word phrase that returns a clear, child-friendly image (used in LoremFlickr URL)
   - `translations` — translations in all 8 languages: `he`, `es`, `fr`, `de`, `ar`, `ru`, `zh`, `pt`

3. **Check for duplicates** — search the file for the word before adding.

4. **Add the entry** to the correct category array (Animals, Food, Colors, Body Parts, Actions, Nature, Home) or create a new category if none fits. Keep entries sorted alphabetically within each category.

5. **Verify the entry** looks like:
   ```js
   {
     word: "butterfly",
     emoji: "🦋",
     imageQuery: "butterfly",
     translations: {
       he: "פרפר",
       es: "mariposa",
       fr: "papillon",
       de: "Schmetterling",
       ar: "فراشة",
       ru: "бабочка",
       zh: "蝴蝶",
       pt: "borboleta"
     }
   }
   ```

6. **Generate translation audio**: run `npm run gen-tts` to pre-render the MP3 clips for the new word(s) into `public/audio/translations/<lang>/<slug>.mp3` (used by `speakTranslation` in `src/utils/tts.js`). The script is resumable — it skips files that already exist, so it's safe to run after every vocabulary change.

7. **Remind the user**: the word will only appear in challenges if it also occurs in the YouTube video's transcript. The vocabulary list is a gate, not a guarantee.

If the user provides the word but not all translations, look up the correct translations yourself before writing the entry. Do not guess — use your knowledge of the language, and flag any you are uncertain about.
