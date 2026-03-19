import { getPodcasts, getPeople, getEpisodes } from "@/src/lib/data";

export const dynamic = "force-static";

interface SearchEntry {
  type: "podcast" | "person" | "episode" | "transcript";
  title: string;
  url: string;
  context?: string;
}

export function GET() {
  const entries: SearchEntry[] = [];

  const podcasts = getPodcasts();
  for (const p of podcasts) {
    entries.push({
      type: "podcast",
      title: p.title,
      url: `/podcasts/${p.slug}`,
      context: p.description,
    });

    const episodes = getEpisodes(p.slug);
    for (const ep of episodes) {
      entries.push({
        type: "episode",
        title: `#${ep.number} ${ep.title}`,
        url: `/podcasts/${p.slug}/episodes/${ep.slug}`,
        context: `${p.title}${ep.date ? ` — ${ep.date}` : ""}`,
      });

    }
  }

  const people = getPeople();
  for (const p of people) {
    entries.push({
      type: "person",
      title: p.name,
      url: `/people/${p.slug}`,
    });
  }

  return Response.json(entries);
}
