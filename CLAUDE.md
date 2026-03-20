# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, Next.js core-web-vitals + typescript)

## Architecture

Next.js 16 App Router site deployed on Vercel. Statically generated — all pages use `generateStaticParams`. Styled with Tailwind CSS v4 and Geist Mono font. No database; all content is JSON files on disk.

### Data layer

`src/lib/data.ts` — all data access functions. Reads JSON from `src/data/` at build time using `fs`.

- **Podcasts**: `src/data/podcasts/<slug>/info.json` (title, description, language, hosts, links)
- **Episodes**: `src/data/podcasts/<slug>/episodes/<id>.json` (title, description, links, speakers, segments with diarized transcript)
- **People**: `src/data/people/<slug>.json` (name, links)
- **Images**: `public/podcasts/<slug>/logo.{png,jpg,webp}` and `public/people/<slug>.{png,jpg,webp}`

Hosts and speakers reference people by slug. Episodes reference speakers by slug. The `speakers` array on episodes includes all participants (hosts appear because they're listed per-episode, not inherited from podcast).

### Routes

- `/` — lists all podcasts and people
- `/podcasts/[slug]` — podcast detail with episode list
- `/podcasts/[slug]/episodes/[id]` — episode detail with transcript viewer
- `/people/[slug]` — person detail with all episode appearances

### Components

- `src/app/components/transcript.tsx` — client component ("use client") with search/filter over diarized segments
- `src/app/components/breadcrumbs.tsx` — server component, breadcrumb nav using `~` as home

### Scripts

- `scripts/diarize.ts` — run with `bun run scripts/diarize.ts <audio> <transcription.json>`. Uses pyannote.ai API (`PYANNOTE_API_KEY` env var) to assign speakers to transcript segments.
- `scripts/download-logo.ts` — run with `bun run scripts/download-logo.ts <apple-podcasts-url> <podcast-slug>`. Downloads the podcast artwork from Apple Podcasts to `public/podcasts/<slug>/logo.jpg`.
- `scripts/transcribe-remote.ts` — run with `bun run scripts/transcribe-remote.ts <audio_file> [-m model] [-l language] [-n num_speakers] [-o output_dir]`. Uploads audio to the VPS pipeline (`internal.podcastsdatabase.com`), polls until transcription + diarization completes, downloads the result. Requires `PIPELINE_URL` and `PIPELINE_PASSWORD` in `.env.local`.
- `scripts/transcribe-fly.ts` — run with `bun run scripts/transcribe-fly.ts <url> [url2 ...] [-n num_speakers] [-o output_dir] [--max-concurrent 3]`. Spins up ephemeral Fly.io machines that download audio via yt-dlp, transcribe with faster-whisper, diarize with pyannote, and return merged results. Supports parallel processing. Requires `FLY_API_TOKEN` and `PYANNOTE_API_KEY` in `.env.local`. Docker image in `fly/`.
- `scripts/find-podcast.ts` — run with `bun run scripts/find-podcast.ts <query> [-l language] [-n limit] [--apple <itunesId>] [--init <slug>]`. Searches the local Podcast Index database (`.cache/podcastindex.db`, ~4.6M podcasts) to find a podcast's RSS feed URL, Apple ID, episode count, and metadata. `--init <slug>` scaffolds a `src/data/podcasts/<slug>/info.json`. Requires the DB to be downloaded first (see below).

### Podcast Index database

`.cache/podcastindex.db` — local copy of the Podcast Index database (~4.6GB SQLite, gitignored). Contains ~4.6M podcast feeds with RSS URLs, Apple IDs, languages, categories, episode counts. Used by `scripts/find-podcast.ts`. To refresh: download from `https://public.podcastindex.org/podcastindex_feeds.db.tgz` and extract to `.cache/podcastindex.db`.

### Utilities

- `src/lib/apple-podcasts.ts` — `parseAppleId()`, `lookupPodcast()`, `downloadArtwork()` functions for fetching podcast metadata and artwork from the iTunes Lookup API.

### Path alias

`@/*` maps to project root (e.g., `@/src/lib/data`).

## Process: adding an episode

1. Grab the episode mp3, title, description, links (YouTube, Spotify, Apple), and speaker slugs
2. Transcribe and diarize — three options:
   - **Fly.io (preferred for batch)**: `bun run scripts/transcribe-fly.ts <url1> [url2 ...] -n <num_speakers> --max-concurrent 3` — spins up parallel Fly machines, each downloads via yt-dlp, transcribes, diarizes, and returns results. Best for processing many episodes at once.
   - **VPS**: `bun run scripts/transcribe-remote.ts <audio> -n <num_speakers> -l <language>` — uploads to VPS, runs Whisper + pyannote, downloads merged result. Outputs `*_diarized.json`, `*_diarized.txt`, and `*_episode.json`.
   - **Local**: Transcribe with `scripts/transcribe.py`, then diarize with `bun run scripts/diarize.ts <audio> <transcription.json> -n <num_speakers>`
3. Merge consecutive same-speaker segments into single turns (Whisper produces sentence-level fragments; the final JSON should have one segment per speaker turn, matching natural conversation flow)
4. Review the diarized output — fix misheard words, proper nouns, and speaker names. Replace SPEAKER_XX labels with people slugs. Keep filler words (um, like, you know) as-is; transcripts should sound natural
5. Check and fix segmentation/diarization issues — check every segment boundary for text that belongs to the adjacent speaker. Common patterns:
   - Sentence fragments split across boundaries (e.g. segment ends "hopefully people get" and next starts "the picture" — the sentence should be whole)
   - A speaker's answer attributed to the previous speaker's segment (e.g. Gonto asks "did you understand what they do?" and Hank's reply "So I did already understand" stays in Gonto's segment)
   - Trailing words from the previous speaker's thought landing at the start of the next segment (e.g. "storefront of your website" completing "the most important..." from the prior segment)
   - Brief agreements/transitions ("exactly", "that's true", "for somebody to be on my team") attached to the wrong speaker
   Move the misattributed text to the correct segment. Do not adjust timestamps (we don't have exact boundaries). Capitalize the first word of a segment when it becomes a new sentence start.
6. Assemble the final `src/data/podcasts/<slug>/episodes/<id>.json` with title, description, links, speakers, and segments
7. Create any missing people entries in `src/data/people/<slug>.json` if new guests appear
8. Clean up: remove intermediate files (raw mp3, transcription JSON, diarized output) — only the final episode JSON and any new people/image files should be committed. Run `npm run build` and `npm run lint` to verify

## Conventions

- Vercel redirects non-www to www (`vercel.json`)
- Light/dark theme via `prefers-color-scheme` CSS media query
- Links use `Record<string, string>` (label → URL) throughout all data types
- Episode IDs are numeric strings, sorted descending (newest first)
