import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server';
import { getLocale } from 'next-intlayer/server';
import { getIntlayer } from 'intlayer';
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

export async function generateMetadata() {
  const locale = await getLocale();
  const content = getIntlayer("podcasts-page", locale);
  const title = content.podcastsPodcastsDatabase;
  const description = content.browseAllPodcastsWithFull;

  return {
    title,
    description,
    alternates: {
      canonical: "/podcasts",
      languages: {
        en: "/podcasts?locale=en",
        fr: "/podcasts?locale=fr",
        es: "/podcasts?locale=es",
        "x-default": "/podcasts",
      },
    },
    openGraph: {
      title,
      description,
      url: "https://www.podcastsdatabase.com/podcasts",
    },
    twitter: {
      card: "summary" as const,
      title,
      description,
    },
  };
}

function PodcastsPageContent() {
  const content = useIntlayer('podcasts-page');

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
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-foreground/60 mt-1 line-clamp-2 text-pretty">
              {p.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-foreground/50">
              <span>{episodes.length} {content.episodes}</span>
              {hosts.length > 0 && <span>{content.hostedByHostnames({ hostNames: hostNames })}</span>}
              <span>{p.language}</span>
            </div>
          </div>
        </Link>
      ),
    };
  });

  return (
    <>
      <Breadcrumbs segments={[{ label: content.podcasts.value }]} />
      <h1 className="text-2xl font-semibold mt-6">{content.podcasts}</h1>
      <ListFilter placeholder={content.searchPodcasts.value} items={items} />
    </>
  );
}

export default async function PodcastsPage() {
  const locale = await getLocale();

  return (
    <IntlayerServerProvider locale={locale}>
      <PodcastsPageContent />
    </IntlayerServerProvider>
  );
}
