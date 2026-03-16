import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getPodcasts, getEpisodes, getPeople } from "@/src/lib/data";

const BASE_URL = "https://www.podcastsdatabase.com";
const DATA_DIR = path.join(process.cwd(), "src", "data");

function fileMtime(filePath: string): Date | undefined {
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return undefined;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const podcasts = getPodcasts();
  const people = getPeople();

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/podcasts`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/people`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  for (const podcast of podcasts) {
    const infoPath = path.join(DATA_DIR, "podcasts", podcast.slug, "info.json");
    entries.push({
      url: `${BASE_URL}/podcasts/${podcast.slug}`,
      lastModified: fileMtime(infoPath),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const episodes = getEpisodes(podcast.slug);
    for (const episode of episodes) {
      const epPath = path.join(
        DATA_DIR,
        "podcasts",
        podcast.slug,
        "episodes",
        `${episode.id}.json`,
      );
      entries.push({
        url: `${BASE_URL}/podcasts/${podcast.slug}/episodes/${episode.id}`,
        lastModified: fileMtime(epPath),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  for (const person of people) {
    const personPath = path.join(DATA_DIR, "people", `${person.slug}.json`);
    entries.push({
      url: `${BASE_URL}/people/${person.slug}`,
      lastModified: fileMtime(personPath),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
