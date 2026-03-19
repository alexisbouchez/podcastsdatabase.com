import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

export interface Person {
  slug: string;
  name: string;
  links: Record<string, string>;
}

export interface EpisodeSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface Episode {
  id: string;
  slug: string;
  number: number;
  title: string;
  date?: string;
  description?: string;
  links: Record<string, string>;
  speakers?: string[];
  segments?: EpisodeSegment[];
}

export interface Podcast {
  slug: string;
  title: string;
  description: string;
  language: string;
  hosts: string[];
  links: Record<string, string>;
}

export function getPeople(): Person[] {
  const dir = path.join(DATA_DIR, "people");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const slug = f.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      return { slug, ...data };
    });
}

export function getPerson(slug: string): Person | null {
  const file = path.join(DATA_DIR, "people", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  return { slug, ...data };
}

export function getPersonImage(slug: string): string | null {
  const pub = path.join(process.cwd(), "public", "people");
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (fs.existsSync(path.join(pub, `${slug}.${ext}`)))
      return `/people/${slug}.${ext}`;
  }
  return null;
}

export function getPodcasts(): Podcast[] {
  const dir = path.join(DATA_DIR, "podcasts");
  return fs
    .readdirSync(dir)
    .filter((f) =>
      fs.existsSync(path.join(dir, f, "info.json")),
    )
    .map((f) => {
      const data = JSON.parse(
        fs.readFileSync(path.join(dir, f, "info.json"), "utf-8"),
      );
      return { slug: f, ...data };
    });
}

export function getPodcast(slug: string): Podcast | null {
  const file = path.join(DATA_DIR, "podcasts", slug, "info.json");
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  return { slug, ...data };
}

export function getPodcastLogo(slug: string): string | null {
  const pub = path.join(process.cwd(), "public", "podcasts", slug);
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (fs.existsSync(path.join(pub, `logo.${ext}`)))
      return `/podcasts/${slug}/logo.${ext}`;
  }
  return null;
}

export function getEpisodes(podcastSlug: string): Episode[] {
  const dir = path.join(DATA_DIR, "podcasts", podcastSlug, "episodes");
  if (!fs.existsSync(dir)) return [];
  const episodes = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const slug = f.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      return { slug, id: data.id ?? slug, number: 0, ...data };
    })
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.slug.localeCompare(b.slug));
  // Assign episode numbers by release order (oldest = #1)
  episodes.forEach((ep, i) => { ep.number = i + 1; });
  // Return newest first for display
  return episodes.reverse();
}

export function getEpisode(
  podcastSlug: string,
  episodeSlug: string,
): Episode | null {
  const file = path.join(
    DATA_DIR,
    "podcasts",
    podcastSlug,
    "episodes",
    `${episodeSlug}.json`,
  );
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  const episodes = getEpisodes(podcastSlug);
  const number = episodes.find((ep) => ep.slug === episodeSlug)?.number ?? 0;
  return { slug: episodeSlug, id: data.id ?? episodeSlug, number, ...data };
}

export function getPersonLanguages(slug: string): string[] {
  const languages = new Set<string>();
  for (const podcast of getPodcasts()) {
    if (podcast.hosts.includes(slug)) {
      languages.add(podcast.language);
      continue;
    }
    for (const ep of getEpisodes(podcast.slug)) {
      if (ep.speakers?.includes(slug)) {
        languages.add(podcast.language);
        break;
      }
    }
  }
  return [...languages].sort();
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
