import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server';
import { getLocale } from 'next-intlayer/server';
import { getMultilingualUrls } from 'intlayer';
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
  const logo = getPodcastLogo(slug);
  const title = `#${id} ${episode.title} — ${podcast.title}`;
  return {
    title,
    description: episode.description,
    alternates: {
      canonical: `/podcasts/${slug}/episodes/${id}`,
      languages: { ...getMultilingualUrls(`/podcasts/${slug}/episodes/${id}`), "x-default": `/podcasts/${slug}/episodes/${id}` },
    },
    openGraph: {
      title,
      description: episode.description,
      url: `https://www.podcastsdatabase.com/podcasts/${slug}/episodes/${id}`,
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

function EpisodeContent({ slug, id }: { slug: string; id: string }) {
  const content = useIntlayer('episode-detail');
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

  const logo = getPodcastLogo(slug);
  const totalDuration = episode.segments?.length
    ? episode.segments[episode.segments.length - 1].end
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    url: `https://www.podcastsdatabase.com/podcasts/${slug}/episodes/${id}`,
    episodeNumber: Number(id),
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
          { label: content.episodes.value },
          { label: `#${id}` },
        ]}
      />

      <header className="mt-6">
        <p className="text-sm text-foreground/60">
          {podcast.title} — {content.episode} {id}
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
          <dt className="text-foreground/60">{content.speakers}</dt>
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
              <dt className="text-foreground/60">{content.duration}</dt>
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
    </article>
  );
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const locale = await getLocale();

  return (
    <IntlayerServerProvider locale={locale}>
      <EpisodeContent slug={slug} id={id} />
    </IntlayerServerProvider>
  );
}
