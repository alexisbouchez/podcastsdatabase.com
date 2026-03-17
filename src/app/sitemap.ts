import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getMultilingualUrls } from "intlayer";
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

function alternates(pagePath: string) {
  return {
    languages: {
      ...getMultilingualUrls(`${BASE_URL}${pagePath}`),
      "x-default": `${BASE_URL}${pagePath}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const podcasts = getPodcasts();
  const people = getPeople();

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternates("/"),
    },
    {
      url: `${BASE_URL}/podcasts`,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: alternates("/podcasts"),
    },
    {
      url: `${BASE_URL}/people`,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: alternates("/people"),
    },
  ];

  for (const podcast of podcasts) {
    const infoPath = path.join(DATA_DIR, "podcasts", podcast.slug, "info.json");
    const pagePath = `/podcasts/${podcast.slug}`;
    entries.push({
      url: `${BASE_URL}${pagePath}`,
      lastModified: fileMtime(infoPath),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: alternates(pagePath),
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
      const epPagePath = `/podcasts/${podcast.slug}/episodes/${episode.slug}`;
      entries.push({
        url: `${BASE_URL}${epPagePath}`,
        lastModified: fileMtime(epPath),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: alternates(epPagePath),
      });
    }
  }

  for (const person of people) {
    const personPath = path.join(DATA_DIR, "people", `${person.slug}.json`);
    const pagePath = `/people/${person.slug}`;
    entries.push({
      url: `${BASE_URL}${pagePath}`,
      lastModified: fileMtime(personPath),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: alternates(pagePath),
    });
  }

  return entries;
}
