import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import { Transcript } from "@/src/app/components/transcript";
import {
  getPodcasts,
  getPodcast,
  getEpisodes,
  getEpisode,
  getPerson,
  formatTime,
} from "@/src/lib/data";

export function generateStaticParams() {
  const podcasts = getPodcasts();
  return podcasts.flatMap((p) =>
    getEpisodes(p.slug).map((ep) => ({ slug: p.slug, id: ep.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const podcast = getPodcast(slug);
  const episode = getEpisode(slug, id);
  if (!podcast || !episode) return {};
  return {
    title: `#${id} ${episode.title} — ${podcast.title}`,
    description: episode.description,
    openGraph: {
      title: `#${id} ${episode.title} — ${podcast.title}`,
      description: episode.description,
      url: `https://www.podcastsdatabase.com/podcasts/${slug}/episodes/${id}`,
    },
  };
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const podcast = getPodcast(slug);
  if (!podcast) notFound();
  const episode = getEpisode(slug, id);
  if (!episode) notFound();

  const speakers = (episode.speakers ?? [])
    .map((s) => getPerson(s))
    .filter(Boolean);

  const speakerMap = Object.fromEntries(
    speakers.map((s) => [s!.slug, s!.name]),
  );

  const totalDuration = episode.segments?.length
    ? episode.segments[episode.segments.length - 1].end
    : 0;

  return (
    <>
      <Breadcrumbs
        segments={[
          { label: "Podcasts", href: "/podcasts" },
          { label: podcast.title, href: `/podcasts/${slug}` },
          { label: "Episodes" },
          { label: `#${id}` },
        ]}
      />

      <header className="mt-6">
        <p className="text-sm text-foreground/60">
          {podcast.title} — Episode {id}
          {episode.date && <> — {episode.date}</>}
        </p>
        <h1 className="text-2xl font-semibold mt-1">{episode.title}</h1>
        {episode.description && (
          <p className="mt-2 text-sm text-foreground/60 whitespace-pre-line text-pretty">
            {episode.description}
          </p>
        )}
      </header>

      {speakers.length > 0 && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-foreground/60">Speakers</dt>
          <dd>
            {speakers.map((s, i) => (
              <span key={s!.slug}>
                {i > 0 && ", "}
                <Link href={`/people/${s!.slug}`}>{s!.name}</Link>
              </span>
            ))}
          </dd>
          {totalDuration > 0 && (
            <>
              <dt className="text-foreground/60">Duration</dt>
              <dd>
                <time>{formatTime(totalDuration)}</time>
              </dd>
            </>
          )}
        </dl>
      )}

      {Object.keys(episode.links).length > 0 && (
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          {Object.entries(episode.links).map(([label, url]) => (
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

      {episode.segments && episode.segments.length > 0 && (
        <section className="mt-10">
          <Transcript segments={episode.segments} speakerMap={speakerMap} />
        </section>
      )}
    </>
  );
}
