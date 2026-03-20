/**
 * Fetch an existing transcript for a podcast episode via the RSS feed's
 * <podcast:transcript> tags (Podcasting 2.0 namespace).
 *
 * Supported transcript formats: VTT, SRT, JSON (Podcastindex), HTML (Changelog-style).
 *
 * Usage:
 *   bun run scripts/fetch-transcript.ts <podcast-slug> [episode-id]
 *   bun run scripts/fetch-transcript.ts <podcast-slug> [episode-id] --list
 *
 * Options:
 *   --list          List available transcripts for the episode without downloading
 *   --out <file>    Write segments JSON to file (default: stdout)
 *
 * Examples:
 *   bun run scripts/fetch-transcript.ts changelog-friends
 *   bun run scripts/fetch-transcript.ts changelog-friends 125
 *   bun run scripts/fetch-transcript.ts silicon-carne --list
 */

import { parseArgs } from "util";
import { resolve, join } from "path";
import { readFileSync, existsSync, writeFileSync } from "fs";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    list: { type: "boolean", default: false },
    out: { type: "string" },
  },
  allowPositionals: true,
});

const [podcastSlug, episodeId] = positionals;

if (!podcastSlug) {
  console.error(
    "Usage: bun run scripts/fetch-transcript.ts <podcast-slug> [episode-id] [--list] [--out file]",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load podcast info.json to get RSS URL
// ---------------------------------------------------------------------------

const infoPath = resolve(
  import.meta.dir,
  "../src/data/podcasts",
  podcastSlug,
  "info.json",
);

if (!existsSync(infoPath)) {
  console.error(`Podcast not found: ${infoPath}`);
  process.exit(1);
}

const info = JSON.parse(readFileSync(infoPath, "utf-8"));
const rssUrl: string | undefined = info.links?.rss;

if (!rssUrl) {
  console.error(
    `No RSS URL found in ${infoPath}. Add "rss": "<url>" to the links object.`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch and parse RSS feed
// ---------------------------------------------------------------------------

console.error(`Fetching RSS: ${rssUrl}`);
const rssText = await fetch(rssUrl).then((r) => r.text());

interface TranscriptRef {
  url: string;
  type: string;
  language?: string;
}

interface RssEpisode {
  title: string;
  guid: string;
  link: string;
  pubDate: string;
  episodeNumber?: string;
  transcripts: TranscriptRef[];
  enclosureUrl?: string;
}

function parseRss(xml: string): RssEpisode[] {
  const items: RssEpisode[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const [, body] of itemMatches) {
    const title = decode(body.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "");
    const guid = decode(body.match(/<guid[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/guid>/)?.[1] ?? "");
    const link = decode(body.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] ?? "");
    const pubDate = body.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const episodeNumber = body.match(/<itunes:episode>(.*?)<\/itunes:episode>/)?.[1];
    const enclosureUrl = body.match(/<enclosure[^>]+url="([^"]+)"/)?.[1];

    const transcripts: TranscriptRef[] = [];
    const transcriptMatches = body.matchAll(
      /<podcast:transcript\s+((?:[^>]|(?<="))*?)(?:\/>|><\/podcast:transcript>)/g,
    );
    for (const [, attrs] of transcriptMatches) {
      const url = attrs.match(/url="([^"]+)"/)?.[1];
      const type = attrs.match(/type="([^"]+)"/)?.[1] ?? "unknown";
      const language = attrs.match(/language="([^"]+)"/)?.[1];
      if (url) transcripts.push({ url, type, language });
    }

    items.push({ title, guid, link, pubDate, episodeNumber, transcripts, enclosureUrl });
  }

  return items;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const episodes = parseRss(rssText);
console.error(`Found ${episodes.length} episodes in feed`);

// ---------------------------------------------------------------------------
// Find the target episode
// ---------------------------------------------------------------------------

let episode: RssEpisode | undefined;

if (episodeId) {
  // Try matching by: itunes:episode number, link URL segment, guid, partial title
  episode =
    episodes.find((e) => e.episodeNumber === episodeId) ??
    episodes.find((e) => e.link.split("/").pop() === episodeId) ??
    episodes.find((e) => e.link.includes(`/${episodeId}`)) ??
    episodes.find((e) => e.guid.includes(episodeId)) ??
    episodes.find((e) =>
      e.title.toLowerCase().includes(episodeId.toLowerCase()),
    );
} else {
  // Default to the most recent episode
  episode = episodes[0];
}

if (!episode) {
  console.error(`Episode not found. Available episodes (latest 10):`);
  for (const e of episodes.slice(0, 10)) {
    console.error(
      `  [${e.episodeNumber ?? "?"}] ${e.title} (${e.pubDate.slice(0, 16)})`,
    );
  }
  process.exit(1);
}

console.error(`Episode: ${episode.title}`);

// ---------------------------------------------------------------------------
// --list mode
// ---------------------------------------------------------------------------

if (values.list) {
  if (episode.transcripts.length === 0) {
    console.log("No <podcast:transcript> tags found for this episode.");
  } else {
    console.log(`Transcripts available (${episode.transcripts.length}):`);
    for (const t of episode.transcripts) {
      console.log(`  [${t.type}${t.language ? ` ${t.language}` : ""}] ${t.url}`);
    }
  }
  process.exit(0);
}

if (episode.transcripts.length === 0) {
  console.error("No <podcast:transcript> tags found for this episode.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Download transcript — prefer JSON > VTT > SRT > HTML
// ---------------------------------------------------------------------------

const priority = [
  "application/json",
  "text/vtt",
  "application/x-subrip",
  "text/srt",
  "text/html",
];

const sorted = [...episode.transcripts].sort((a, b) => {
  const ai = priority.indexOf(a.type);
  const bi = priority.indexOf(b.type);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
});

const chosen = sorted[0];
console.error(`Downloading transcript [${chosen.type}]: ${chosen.url}`);
const transcriptText = await fetch(chosen.url).then((r) => r.text());

// ---------------------------------------------------------------------------
// Parse transcript into segments
// ---------------------------------------------------------------------------

interface Segment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

function timeToSeconds(ts: string): number {
  // Handles HH:MM:SS.mmm, MM:SS.mmm, HH:MM:SS,mmm (SRT)
  const clean = ts.replace(",", ".");
  const parts = clean.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function parseVtt(text: string): Segment[] {
  const segments: Segment[] = [];
  // Strip WEBVTT header and NOTE blocks
  const body = text.replace(/^WEBVTT.*?\n\n/s, "").replace(/NOTE[\s\S]*?\n\n/g, "");
  const blocks = body.split(/\n\n+/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    // Find the timestamp line (may be preceded by a cue identifier)
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);
    const start = timeToSeconds(startStr);
    const end = timeToSeconds(endStr);

    // Text lines — check for <v Speaker> tag
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    let speaker = "SPEAKER_00";
    const rawText = textLines.join(" ");

    const voiceMatch = rawText.match(/^<v ([^>]+)>(.*)/s);
    if (voiceMatch) {
      speaker = voiceMatch[1].trim();
      const cleaned = voiceMatch[2].replace(/<[^>]+>/g, "").trim();
      if (cleaned) segments.push({ start, end, speaker, text: cleaned });
    } else {
      const cleaned = rawText.replace(/<[^>]+>/g, "").trim();
      if (cleaned) segments.push({ start, end, speaker, text: cleaned });
    }
  }

  return segments;
}

function parseSrt(text: string): Segment[] {
  // SRT is very similar to VTT without the header
  return parseVtt("WEBVTT\n\n" + text.replace(/(\d+)\r?\n(\d{2}:\d{2}:\d{2})/g, "$2"));
}

function parseJson(text: string): Segment[] {
  // Podcastindex JSON transcript format
  // https://github.com/Podcastindex-org/podcast-namespace/blob/main/transcripts/transcripts.md
  const data = JSON.parse(text);
  const segs: Segment[] = [];

  const items: { speaker?: string; startTime: number; endTime?: number; body: string }[] =
    data.segments ?? data.transcripts ?? [];

  for (const item of items) {
    if (!item.body?.trim()) continue;
    segs.push({
      start: item.startTime,
      end: item.endTime ?? item.startTime + 5,
      speaker: item.speaker ?? "SPEAKER_00",
      text: item.body.trim(),
    });
  }

  return segs;
}

function parseHtml(text: string): Segment[] {
  // Changelog-style: <cite>Speaker:</cite><p>[HH:MM] text</p>
  const segments: Segment[] = [];
  let currentSpeaker = "SPEAKER_00";
  let currentStart = 0;

  const citeMatches = text.matchAll(
    /<cite>([^<]+):<\/cite>\s*<p>([\s\S]*?)<\/p>/g,
  );

  for (const [, speaker, rawText] of citeMatches) {
    currentSpeaker = speaker.trim();

    // Extract inline timestamp like [00:01] or \[02:03\]
    const tsMatch = rawText.match(/\\\[(\d{2}:\d{2})\\\]|^\[(\d{2}:\d{2})\]/);
    if (tsMatch) {
      currentStart = timeToSeconds(tsMatch[1] ?? tsMatch[2]);
    }

    // Strip HTML entities and tags
    const cleaned = rawText
      .replace(/\\\[[\d:]+\\\]/g, "")
      .replace(/\[[\d:]+\]/g, "")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (cleaned) {
      segments.push({
        start: currentStart,
        end: currentStart, // end unknown from HTML
        speaker: currentSpeaker,
        text: cleaned,
      });
    }
  }

  // Fill in end times from next segment's start
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].end === segments[i].start && segments[i + 1].start > segments[i].start) {
      segments[i].end = segments[i + 1].start;
    }
  }

  return segments;
}

let segments: Segment[];

switch (chosen.type) {
  case "text/vtt":
    segments = parseVtt(transcriptText);
    break;
  case "text/srt":
  case "application/x-subrip":
    segments = parseSrt(transcriptText);
    break;
  case "application/json":
    segments = parseJson(transcriptText);
    break;
  case "text/html":
    segments = parseHtml(transcriptText);
    break;
  default:
    console.error(`Unsupported transcript type: ${chosen.type}`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Merge consecutive same-speaker segments
// ---------------------------------------------------------------------------

const merged: Segment[] = [];
for (const seg of segments) {
  if (merged.length && merged[merged.length - 1].speaker === seg.speaker) {
    const prev = merged[merged.length - 1];
    prev.text = prev.text.trimEnd() + " " + seg.text.trimStart();
    prev.end = seg.end;
  } else {
    merged.push({ ...seg });
  }
}

console.error(
  `Parsed ${segments.length} segments → ${merged.length} after merging`,
);

// Print unique speaker names found
const speakers = [...new Set(merged.map((s) => s.speaker))].filter(
  (s) => s !== "SPEAKER_00",
);
if (speakers.length > 0) {
  console.error(`Speakers found: ${speakers.join(", ")}`);
  console.error(
    `Tip: replace speaker names with people slugs before adding to episode JSON`,
  );
} else {
  console.error(
    `No speaker info in transcript — all attributed to SPEAKER_00`,
  );
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const out = JSON.stringify(merged, null, 2);

if (values.out) {
  writeFileSync(values.out, out);
  console.error(`Written to ${values.out}`);
} else {
  process.stdout.write(out + "\n");
}
