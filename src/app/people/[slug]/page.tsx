import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server';
import { getLocale } from 'next-intlayer/server';
import { getMultilingualUrls } from 'intlayer';
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import Image from "next/image";
import { getPeople, getPerson, getPersonImage, getPersonLanguages, getPodcasts, getEpisodes } from "@/src/lib/data";

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
  const img = getPersonImage(slug);
  const description = `${person.name} on Podcasts Database — episode appearances, links, and full searchable transcripts.`;
  const title = `${person.name} — Podcasts Database`;
  return {
    title,
    description,
    alternates: {
      canonical: `/people/${slug}`,
      languages: { ...getMultilingualUrls(`/people/${slug}`), "x-default": `/people/${slug}` },
    },
    openGraph: {
      title,
      description,
      url: `https://www.podcastsdatabase.com/people/${slug}`,
      ...(img && {
        images: [{ url: `https://www.podcastsdatabase.com${img}` }],
      }),
    },
    twitter: {
      card: img ? "summary_large_image" as const : "summary" as const,
      title,
      description,
      ...(img && {
        images: [`https://www.podcastsdatabase.com${img}`],
      }),
    },
  };
}

function PersonContent({ slug }: { slug: string }) {
  const content = useIntlayer('person-detail');
  const person = getPerson(slug);
  if (!person) notFound();

  const podcasts = getPodcasts();
  const appearances: {
    podcast: string;
    slug: string;
    episodeSlug: string;
    episodeId: string;
    title: string;
  }[] = [];

  for (const podcast of podcasts) {
    if (podcast.hosts.includes(slug)) {
      for (const ep of getEpisodes(podcast.slug)) {
        appearances.push({
          podcast: podcast.title,
          slug: podcast.slug,
          episodeSlug: ep.slug,
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
            episodeSlug: ep.slug,
            episodeId: ep.id,
            title: ep.title,
          });
        }
      }
    }
  }

  const hostedPodcasts = podcasts.filter((p) => p.hosts.includes(slug));
  const img = getPersonImage(slug);
  const languages = getPersonLanguages(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: `https://www.podcastsdatabase.com/people/${slug}`,
    ...(img && { image: `https://www.podcastsdatabase.com${img}` }),
    ...(languages.length > 0 && { knowsLanguage: languages }),
    ...(Object.keys(person.links).length > 0 && {
      sameAs: Object.values(person.links),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs segments={[{ label: content.people.value, href: "/people" }, { label: person.name }]} />

      <header className="mt-6 flex items-center gap-4">
        {img && (
          <Image
            src={img}
            alt={person.name}
            width={64}
            height={64}
            sizes="64px"
            priority
            className="rounded-full"
          />
        )}
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

      {languages.length > 0 && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-foreground/60">{content.languages}</dt>
          <dd>{languages.join(", ")}</dd>
        </dl>
      )}

      {hostedPodcasts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{content.hosts}</h2>
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
            {content.episodes}
            <span className="text-foreground font-normal ml-2">
              ({appearances.length})
            </span>
          </h2>
          <ol className="mt-3 space-y-3">
            {appearances.map((a) => (
              <li key={`${a.slug}-${a.episodeSlug}`}>
                <span className="text-foreground/60 select-none">
                  #{a.episodeId}
                </span>{" "}
                <Link href={`/podcasts/${a.slug}/episodes/${a.episodeSlug}`}>
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

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  return (
    <IntlayerServerProvider locale={locale}>
      <PersonContent slug={slug} />
    </IntlayerServerProvider>
  );
}
