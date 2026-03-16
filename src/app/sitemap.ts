import type { MetadataRoute } from "next";
import { getPodcasts, getEpisodes, getPeople } from "@/src/lib/data";

const BASE_URL = "https://www.podcastsdatabase.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const podcasts = getPodcasts();
  const people = getPeople();

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const podcast of podcasts) {
    entries.push({
      url: `${BASE_URL}/podcasts/${podcast.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const episodes = getEpisodes(podcast.slug);
    for (const episode of episodes) {
      entries.push({
        url: `${BASE_URL}/podcasts/${podcast.slug}/episodes/${episode.id}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  for (const person of people) {
    entries.push({
      url: `${BASE_URL}/people/${person.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
