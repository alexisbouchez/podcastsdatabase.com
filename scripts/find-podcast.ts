/**
 * Search the Podcast Index database for podcasts.
 *
 * Usage:
 *   bun run scripts/find-podcast.ts <query> [options]
 *
 * Options:
 *   -l, --language <lang>    Filter by language (e.g. fr, en)
 *   -n, --limit <n>          Max results (default: 10)
 *   --apple <id>             Look up by Apple Podcasts ID
 *   --init <slug>            Scaffold a podcast info.json for the top result
 *
 * Examples:
 *   bun run scripts/find-podcast.ts "génération do it yourself"
 *   bun run scripts/find-podcast.ts "joe rogan" -l en -n 5
 *   bun run scripts/find-podcast.ts --apple 1462576116
 *   bun run scripts/find-podcast.ts "lex fridman" --init lex-fridman-podcast
 */

import { Database } from "bun:sqlite";
import { parseArgs } from "util";
import { resolve, join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

const DB_PATH = resolve(import.meta.dir, "../.cache/podcastindex.db");

if (!existsSync(DB_PATH)) {
  console.error(`Podcast Index database not found at ${DB_PATH}`);
  console.error(
    "Download it from: https://public.podcastindex.org/podcastindex_feeds.db.tgz",
  );
  console.error("Then extract to .cache/podcastindex.db");
  process.exit(1);
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    language: { type: "string", short: "l" },
    limit: { type: "string", short: "n", default: "10" },
    apple: { type: "string" },
    init: { type: "string" },
  },
  allowPositionals: true,
});

const query = positionals.join(" ").trim();
const language = values.language;
const limit = parseInt(values.limit!);
const appleId = values.apple ? parseInt(values.apple) : null;
const initSlug = values.init;

if (!query && !appleId) {
  console.error(
    "Usage: bun run scripts/find-podcast.ts <query> [-l language] [-n limit] [--init slug]",
  );
  console.error(
    "       bun run scripts/find-podcast.ts --apple <itunesId>",
  );
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

interface Row {
  id: number;
  title: string;
  url: string;
  link: string;
  language: string;
  episodeCount: number;
  popularityScore: number;
  itunesId: number;
  imageUrl: string;
  description: string;
  category1: string;
  category2: string;
  newestItemPubdate: number;
  dead: number;
}

let rows: Row[];

if (appleId) {
  rows = db
    .query<Row, [number]>(
      `SELECT id, title, url, link, language, episodeCount, popularityScore,
              itunesId, imageUrl, description, category1, category2,
              newestItemPubdate, dead
       FROM podcasts WHERE itunesId = ? LIMIT 1`,
    )
    .all(appleId);
} else {
  const conditions: string[] = ["title LIKE ?"];
  const params: (string | number)[] = [`%${query}%`];

  if (language) {
    conditions.push("language = ?");
    params.push(language);
  }

  params.push(limit);

  rows = db
    .query<Row, (string | number)[]>(
      `SELECT id, title, url, link, language, episodeCount, popularityScore,
              itunesId, imageUrl, description, category1, category2,
              newestItemPubdate, dead
       FROM podcasts
       WHERE ${conditions.join(" AND ")}
       ORDER BY popularityScore DESC, episodeCount DESC
       LIMIT ?`,
    )
    .all(...params);
}

if (rows.length === 0) {
  console.log("No results found.");
  process.exit(0);
}

for (const row of rows) {
  const categories = [row.category1, row.category2]
    .filter(Boolean)
    .join(", ");
  const date = row.newestItemPubdate
    ? new Date(row.newestItemPubdate * 1000).toISOString().slice(0, 10)
    : "unknown";

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Title:      ${row.title}`);
  console.log(`Language:   ${row.language || "(none)"}`);
  console.log(`RSS:        ${row.url}`);
  if (row.link) console.log(`Website:    ${row.link}`);
  if (row.itunesId) console.log(`Apple ID:   ${row.itunesId}`);
  console.log(`Episodes:   ${row.episodeCount}  |  Last: ${date}`);
  if (categories) console.log(`Categories: ${categories}`);
  if (row.description)
    console.log(`Description: ${row.description.slice(0, 120).replace(/\n/g, " ")}…`);
  if (row.dead) console.log(`⚠ dead`);
}
console.log(`\n${"─".repeat(60)}`);
console.log(`${rows.length} result(s)`);

// --init: scaffold a podcast info.json from the top result
if (initSlug) {
  const top = rows[0];
  const podcastDir = resolve(
    import.meta.dir,
    "../src/data/podcasts",
    initSlug,
  );
  const episodesDir = join(podcastDir, "episodes");
  const infoPath = join(podcastDir, "info.json");

  if (existsSync(infoPath)) {
    console.error(`\n⚠ ${infoPath} already exists — skipping init.`);
    process.exit(0);
  }

  mkdirSync(episodesDir, { recursive: true });

  const links: Record<string, string> = {};
  if (top.url) links["rss"] = top.url;
  if (top.link) links["website"] = top.link;
  if (top.itunesId)
    links["apple"] = `https://podcasts.apple.com/podcast/id${top.itunesId}`;

  const info = {
    title: top.title,
    description: top.description || "",
    language: top.language || "en",
    hosts: [],
    links,
  };

  writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n");
  console.log(`\n✓ Created ${infoPath}`);
  console.log(
    `  Next: add hosts, download logo with scripts/download-logo.ts`,
  );
}

db.close();
