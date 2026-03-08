/**
 * Download a podcast logo from Apple Podcasts.
 *
 * Usage:
 *   bun run scripts/download-logo.ts <apple-podcasts-url> <podcast-slug>
 *
 * Example:
 *   bun run scripts/download-logo.ts https://podcasts.apple.com/us/podcast/fracture/id1862204027 fracture
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  parseAppleId,
  lookupPodcast,
  downloadArtwork,
} from "../src/lib/apple-podcasts";

const [url, slug] = process.argv.slice(2);

if (!url || !slug) {
  console.error(
    "Usage: bun run scripts/download-logo.ts <apple-podcasts-url> <podcast-slug>",
  );
  process.exit(1);
}

const appleId = parseAppleId(url);
console.log(`Looking up Apple Podcasts ID ${appleId}...`);

const result = await lookupPodcast(appleId);
console.log(`Found: ${result.collectionName}`);

const { data, ext } = await downloadArtwork(result.artworkUrl600);
const dir = join("public", "podcasts", slug);
mkdirSync(dir, { recursive: true });
const dest = join(dir, `logo.${ext}`);
writeFileSync(dest, data);
console.log(`Saved ${data.length} bytes → ${dest}`);
