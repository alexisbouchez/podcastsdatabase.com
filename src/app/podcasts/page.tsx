import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import { ListFilter } from "@/src/app/components/list-filter";
import {
  getPodcasts,
  getPodcastLogo,
  getEpisodes,
  getPerson,
} from "@/src/lib/data";

export const metadata = {
  title: "Podcasts — Podcasts Database",
};

export default function PodcastsPage() {
  const podcasts = getPodcasts();

  const items = podcasts.map((p) => {
    const logo = getPodcastLogo(p.slug);
    const episodes = getEpisodes(p.slug);
    const hosts = p.hosts.map((h) => getPerson(h)).filter(Boolean);
    const hostNames = hosts.map((h) => h!.name).join(", ");

    return {
      key: p.slug,
      searchText: `${p.title} ${p.description} ${hostNames} ${p.language}`.toLowerCase(),
      node: (
        <Link
          href={`/podcasts/${p.slug}`}
          className="flex items-start gap-4 p-4 rounded-lg border border-foreground/10 no-underline text-foreground hover:border-foreground/30 transition-colors"
        >
          {logo && (
            <Image
              src={logo}
              alt={p.title}
              width={64}
              height={64}
              sizes="64px"
              className="rounded shrink-0"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-sm text-foreground/60 mt-1 line-clamp-2 text-pretty">
              {p.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-foreground/50">
              <span>{episodes.length} episodes</span>
              {hosts.length > 0 && <span>Hosted by {hostNames}</span>}
              <span>{p.language}</span>
            </div>
          </div>
        </Link>
      ),
    };
  });

  return (
    <>
      <Breadcrumbs segments={[{ label: "Podcasts" }]} />
      <h1 className="text-2xl font-semibold mt-6">Podcasts</h1>
      <ListFilter placeholder="Filter podcasts..." items={items} />
    </>
  );
}
