/**
 * Rename episode files from <id>.json to <slug>.json based on title.
 * Adds a `slug` field to each episode JSON.
 *
 * Usage: bun run scripts/slugify-episodes.ts [--dry-run]
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DRY_RUN = process.argv.includes("--dry-run");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanum → dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/-{2,}/g, "-"); // collapse multiple dashes
}

function main() {
  const podcastsDir = path.join(DATA_DIR, "podcasts");
  const podcasts = fs
    .readdirSync(podcastsDir)
    .filter((f) => fs.existsSync(path.join(podcastsDir, f, "info.json")));

  let totalRenamed = 0;
  let totalSkipped = 0;

  for (const podcast of podcasts) {
    const episodesDir = path.join(podcastsDir, podcast, "episodes");
    if (!fs.existsSync(episodesDir)) continue;

    const files = fs
      .readdirSync(episodesDir)
      .filter((f) => f.endsWith(".json"));

    // Track slugs within this podcast to handle duplicates
    const usedSlugs = new Set<string>();

    for (const file of files) {
      const filePath = path.join(episodesDir, file);
      const id = file.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (!data.title) {
        console.log(`  SKIP ${podcast}/${file} — no title`);
        totalSkipped++;
        continue;
      }

      let slug = slugify(data.title);

      // Handle duplicate slugs by appending the numeric id
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${id}`;
      }
      usedSlugs.add(slug);

      const newFilePath = path.join(episodesDir, `${slug}.json`);

      if (filePath === newFilePath) {
        // Already slugified
        if (!data.slug) {
          data.slug = slug;
          if (!DRY_RUN) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
          }
          console.log(`  UPDATE ${podcast}/${file} — added slug field`);
        }
        totalSkipped++;
        continue;
      }

      // Add slug and id fields to the data
      data.slug = slug;
      data.id = id;

      console.log(
        `  ${DRY_RUN ? "[DRY] " : ""}RENAME ${podcast}/episodes/${file} → ${slug}.json`
      );

      if (!DRY_RUN) {
        fs.writeFileSync(newFilePath, JSON.stringify(data, null, 2) + "\n");
        fs.unlinkSync(filePath);
      }

      totalRenamed++;
    }
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] " : ""}Done: ${totalRenamed} renamed, ${totalSkipped} skipped`
  );
}

main();
