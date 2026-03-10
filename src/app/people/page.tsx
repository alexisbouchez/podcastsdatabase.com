import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import { ListFilter } from "@/src/app/components/list-filter";
import {
  getPeople,
  getPersonImage,
  getPodcasts,
  getEpisodes,
} from "@/src/lib/data";

export const metadata = {
  title: "People — Podcasts Database",
};

export default function PeoplePage() {
  const people = getPeople();
  const podcasts = getPodcasts();

  // Pre-compute episode counts per person
  const episodeCounts = new Map<string, number>();
  const hostOf = new Map<string, string[]>();

  for (const podcast of podcasts) {
    for (const host of podcast.hosts) {
      if (!hostOf.has(host)) hostOf.set(host, []);
      hostOf.get(host)!.push(podcast.title);
    }

    const episodes = getEpisodes(podcast.slug);
    for (const ep of episodes) {
      for (const host of podcast.hosts) {
        episodeCounts.set(host, (episodeCounts.get(host) || 0) + 1);
      }
      for (const speaker of ep.speakers || []) {
        if (!podcast.hosts.includes(speaker)) {
          episodeCounts.set(speaker, (episodeCounts.get(speaker) || 0) + 1);
        }
      }
    }
  }

  const items = people.map((p) => {
    const img = getPersonImage(p.slug);
    const count = episodeCounts.get(p.slug) || 0;
    const hosted = hostOf.get(p.slug);

    return {
      key: p.slug,
      searchText: `${p.name} ${hosted ? hosted.join(" ") : ""}`.toLowerCase(),
      node: (
        <Link
          href={`/people/${p.slug}`}
          className="flex items-center gap-4 p-3 rounded-lg border border-foreground/10 no-underline text-foreground hover:border-foreground/30 transition-colors"
        >
          {img ? (
            <Image
              src={img}
              alt={p.name}
              width={40}
              height={40}
              sizes="40px"
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-foreground/10 shrink-0 flex items-center justify-center text-foreground/40 text-sm">
              {p.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-sm">{p.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground/50">
              {hosted && <span>Host of {hosted.join(", ")}</span>}
              {count > 0 && <span>{count} episodes</span>}
            </div>
          </div>
        </Link>
      ),
    };
  });

  return (
    <>
      <Breadcrumbs segments={[{ label: "People" }]} />
      <h1 className="text-2xl font-semibold mt-6">People</h1>
      <ListFilter placeholder="Search people..." items={items} />
    </>
  );
}
