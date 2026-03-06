import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import Image from "next/image";
import { getPeople, getPerson, getPersonImage, getPodcasts, getEpisodes } from "@/src/lib/data";

export function generateStaticParams() {
  return getPeople().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) return {};
  return { title: `${person.name} — Podcasts Database` };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();

  const podcasts = getPodcasts();
  const appearances: {
    podcast: string;
    slug: string;
    episodeId: string;
    title: string;
  }[] = [];

  for (const podcast of podcasts) {
    if (podcast.hosts.includes(slug)) {
      for (const ep of getEpisodes(podcast.slug)) {
        appearances.push({
          podcast: podcast.title,
          slug: podcast.slug,
          episodeId: ep.id,
          title: ep.title,
        });
      }
    } else {
      for (const ep of getEpisodes(podcast.slug)) {
        if (ep.speakers?.includes(slug)) {
          appearances.push({
            podcast: podcast.title,
            slug: podcast.slug,
            episodeId: ep.id,
            title: ep.title,
          });
        }
      }
    }
  }

  const hostedPodcasts = podcasts.filter((p) => p.hosts.includes(slug));

  return (
    <>
      <Breadcrumbs segments={[{ label: "People" }, { label: person.name }]} />

      <header className="mt-6 flex items-center gap-4">
        {(() => {
          const img = getPersonImage(slug);
          return img ? (
            <Image
              src={img}
              alt={person.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : null;
        })()}
        <h1 className="text-2xl font-semibold">{person.name}</h1>
      </header>

      {Object.keys(person.links).length > 0 && (
        <nav className="mt-3 flex flex-wrap gap-3 text-sm">
          {Object.entries(person.links).map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
            >
              [{label}]
            </a>
          ))}
        </nav>
      )}

      {hostedPodcasts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Hosts</h2>
          <ul className="mt-2 space-y-1 list-['—_'] list-inside">
            {hostedPodcasts.map((p) => (
              <li key={p.slug}>
                <Link href={`/podcasts/${p.slug}`}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {appearances.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">
            Episodes
            <span className="text-foreground font-normal ml-2">
              ({appearances.length})
            </span>
          </h2>
          <ol className="mt-3 space-y-3">
            {appearances.map((a) => (
              <li key={`${a.slug}-${a.episodeId}`}>
                <span className="text-foreground/60 select-none">
                  #{a.episodeId}
                </span>{" "}
                <Link href={`/podcasts/${a.slug}/episodes/${a.episodeId}`}>
                  {a.title}
                </Link>
                <p className="text-xs text-foreground mt-0.5">{a.podcast}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
