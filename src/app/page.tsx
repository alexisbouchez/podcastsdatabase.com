import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "./components/breadcrumbs";
import {
  getPodcasts,
  getPodcastLogo,
  getEpisodes,
  getPeople,
  getPersonImage,
} from "@/src/lib/data";

export default function Home() {
  const podcasts = getPodcasts();
  const people = getPeople();

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-2xl font-semibold mt-6">Podcasts Database</h1>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Podcasts</h2>
          <Link href="/podcasts" className="text-sm">
            View all
          </Link>
        </div>
        <div className="mt-3 grid gap-3">
          {podcasts.map((p) => {
            const logo = getPodcastLogo(p.slug);
            const episodeCount = getEpisodes(p.slug).length;

            return (
              <Link
                key={p.slug}
                href={`/podcasts/${p.slug}`}
                className="flex items-center gap-4 p-3 rounded-lg border border-foreground/10 no-underline text-foreground hover:border-foreground/30 transition-colors"
              >
                {logo && (
                  <Image
                    src={logo}
                    alt={p.title}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="rounded shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{p.title}</h3>
                  <p className="text-xs text-foreground/50 mt-0.5 line-clamp-1">
                    {p.description}
                  </p>
                </div>
                <span className="ml-auto text-xs text-foreground/40 shrink-0">
                  {episodeCount} ep.
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">People</h2>
          <Link href="/people" className="text-sm">
            View all
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {people.map((p) => {
            const img = getPersonImage(p.slug);

            return (
              <Link
                key={p.slug}
                href={`/people/${p.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-foreground/10 no-underline text-foreground hover:border-foreground/30 transition-colors"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    width={32}
                    height={32}
                    sizes="32px"
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-foreground/10 shrink-0 flex items-center justify-center text-foreground/40 text-xs">
                    {p.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {p.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
