import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import { Transcript } from "@/src/app/components/transcript";
import {
  getPodcasts,
  getPodcast,
  getPodcastLogo,
  getEpisodes,
  getEpisode,
  getPerson,
  formatTime,
} from "@/src/lib/data";

export function generateStaticParams() {
  const podcasts = getPodcasts();
  return podcasts.flatMap((p) =>
    getEpisodes(p.slug).map((ep) => ({ slug: p.slug, episodeSlug: ep.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; episodeSlug: string }>;
}) {
  const { slug, episodeSlug } = await params;
  const podcast = getPodcast(slug);
  const episode = getEpisode(slug, episodeSlug);
  if (!podcast || !episode) return {};
  const logo = getPodcastLogo(slug);
  const epPath = `/podcasts/${slug}/episodes/${episodeSlug}`;
  const title = `#${episode.number} ${episode.title} — ${podcast.title}`;
  return {
    title,
    description: episode.description,
    alternates: { canonical: epPath },
    openGraph: {
      title,
      description: episode.description,
      url: `https://www.podcastsdatabase.com${epPath}`,
      ...(logo && {
        images: [{ url: `https://www.podcastsdatabase.com${logo}` }],
      }),
    },
    twitter: {
      card: logo ? "summary_large_image" as const : "summary" as const,
      title,
      description: episode.description,
      ...(logo && {
        images: [`https://www.podcastsdatabase.com${logo}`],
      }),
    },
  };
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string; episodeSlug: string }>;
}) {
  const { slug, episodeSlug } = await params;
  const podcast = getPodcast(slug);
  if (!podcast) notFound();
  const episode = getEpisode(slug, episodeSlug);
  if (!episode) notFound();

  const speakers = (episode.speakers ?? [])
    .map((s) => getPerson(s))
    .filter(Boolean);

  const speakerMap = Object.fromEntries(
    speakers.map((s) => [s!.slug, s!.name]),
  );

  const logo = getPodcastLogo(slug);
  const totalDuration = episode.segments?.length
    ? episode.segments[episode.segments.length - 1].end
    : 0;

  const epPath = `/podcasts/${slug}/episodes/${episodeSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    url: `https://www.podcastsdatabase.com${epPath}`,
    episodeNumber: episode.number,
    ...(episode.date && { datePublished: episode.date }),
    ...(totalDuration > 0 && {
      duration: `PT${Math.floor(totalDuration / 60)}M${Math.floor(totalDuration % 60)}S`,
    }),
    ...(logo && { image: `https://www.podcastsdatabase.com${logo}` }),
    partOfSeries: {
      "@type": "PodcastSeries",
      name: podcast.title,
      url: `https://www.podcastsdatabase.com/podcasts/${slug}`,
    },
    contributor: speakers.map((s) => ({
      "@type": "Person",
      name: s!.name,
      url: `https://www.podcastsdatabase.com/people/${s!.slug}`,
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        segments={[
          { label: "Podcasts", href: "/podcasts" },
          { label: podcast.title, href: `/podcasts/${slug}` },
          { label: "Episodes" },
          { label: `#${episode.number}` },
        ]}
      />

      <header className="mt-6">
        <p className="text-sm text-foreground/60">
          {podcast.title} — Episode {episode.number}
          {episode.date && <> — <time dateTime={episode.date}>{episode.date}</time></>}
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

      {(() => {
        const youtubeUrl = episode.links["youtube"];
        if (!youtubeUrl) return null;
        const videoId = new URL(youtubeUrl).searchParams.get("v");
        if (!videoId) return null;
        return (
          <div className="mt-6 aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={episode.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      })()}

      {episode.segments && episode.segments.length > 0 && (
        <section className="mt-10">
          <Transcript segments={episode.segments} speakerMap={speakerMap} />
        </section>
      )}
    </article>
  );
}
