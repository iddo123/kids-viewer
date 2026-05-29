# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**English Adventure** — a React app that helps kids learn English by watching YouTube videos. It extracts words from the video's captions, then pauses periodically to quiz the child using speech recognition.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview the production build locally
```

No test framework. No linter or formatter configured.

## Architecture

### Challenge Scheduling

`App.jsx` is the core — 500+ lines managing all state. Challenge timing uses **refs, not state**, to avoid re-renders during video playback. Key refs:

- `scheduleRef` — array of `{ time, word }` objects built from the transcript
- `inChallengeRef` — prevents overlapping challenges
- `ytPlayerRef` — direct YouTube IFrame API handle

The scheduler runs on a `setInterval`, polls video time, and fires the next challenge when the player position crosses the scheduled timestamp.

### Vocabulary System

Only words in `src/data/vocabulary.js` can trigger challenges. Each entry requires:

```js
{
  word: "cat",
  emoji: "🐱",
  imageQuery: "cute cat",          // used for LoremFlickr image URL
  translations: {
    he: "חתול", es: "gato", fr: "chat", de: "Katze",
    ar: "قطة", ru: "кошка", zh: "猫", pt: "gato"
  }
}
```

The transcript-to-challenge pipeline: fetch captions → filter stop words → score by frequency + visual concreteness → sliding window (default 60s) → deduplicate (max 15% repeats).

### Transcript Fetching

- **Dev**: Vite middleware intercepts `/api/transcript` in `vite.config.js`, uses YouTube InnerTube API (Android client headers to bypass bot detection)
- **Production**: Netlify Edge Function at `netlify/edge-functions/transcript.js` proxies to Supadata.ai

### State

All app state lives in `App.jsx`. `localStorage` key `kids_viewer_dictionary` stores per-word progress (`timesCorrect`, `timesWrong`, `firstSeen`, `lastSeen`).

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `SUPADATA_API_KEY` | Netlify env / `.env` | Required for production transcript fetching via Supadata.ai |

## Deployment

Netlify. `netlify.toml` wires:
- `/api/transcript` → Edge Function (Deno runtime, `netlify/edge-functions/transcript.js`)
- `/api/search` → Lambda function (`netlify/functions/search.js`)

Node 18 for build. Do not change the edge function runtime — it must stay Deno-compatible.

## Gotchas

- **Refs over state in App.jsx** — challenge timing is intentionally ref-based. Don't refactor to state without understanding the re-render implications on the scheduler loop.
- **Vocabulary gating** — adding a word to the transcript doesn't make it challengeable; it must also exist in `src/data/vocabulary.js` with all 8 translations.
- **YouTube IP blocking** — production transcript fetching goes through Supadata.ai because YouTube blocks cloud datacenter IPs. The dev path works because it runs from the browser (residential IP).
- **No TypeScript** — the project uses plain JS/JSX.
