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
        title: `#${ep.id} ${ep.title}`,
        url: `/podcasts/${p.slug}/episodes/${ep.id}`,
        context: `${p.title}${ep.date ? ` — ${ep.date}` : ""}`,
      });

      if (ep.segments) {
        // Index transcript segments grouped per speaker turn
        for (let i = 0; i < ep.segments.length; i++) {
          const seg = ep.segments[i];
          entries.push({
            type: "transcript",
            title: seg.text,
            url: `/podcasts/${p.slug}/episodes/${ep.id}#seg-${i}`,
            context: `${p.title} #${ep.id}`,
          });
        }
      }
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
