import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server';
import { getLocale } from 'next-intlayer/server';
import { getIntlayer, getMultilingualUrls } from 'intlayer';
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

export async function generateMetadata() {
  const locale = await getLocale();
  const content = getIntlayer("people-page", locale);
  const title = content.peoplePodcastsDatabase;
  const description = content.browseAllPodcastHostsAnd;

  return {
    title,
    description,
    alternates: {
      canonical: "/people",
      languages: { ...getMultilingualUrls("/people"), "x-default": "/people" },
    },
    openGraph: {
      title,
      description,
      url: "https://www.podcastsdatabase.com/people",
    },
    twitter: {
      card: "summary" as const,
      title,
      description,
    },
  };
}

function PeoplePageContent() {
  const content = useIntlayer('people-page');

  const people = getPeople();
  const podcasts = getPodcasts();

  // Pre-compute episode counts, hosted podcasts, and languages per person
  const episodeCounts = new Map<string, number>();
  const hostOf = new Map<string, string[]>();
  const personLanguages = new Map<string, Set<string>>();

  for (const podcast of podcasts) {
    for (const host of podcast.hosts) {
      if (!hostOf.has(host)) hostOf.set(host, []);
      hostOf.get(host)!.push(podcast.title);
      if (!personLanguages.has(host)) personLanguages.set(host, new Set());
      personLanguages.get(host)!.add(podcast.language);
    }

    const episodes = getEpisodes(podcast.slug);
    for (const ep of episodes) {
      for (const host of podcast.hosts) {
        episodeCounts.set(host, (episodeCounts.get(host) || 0) + 1);
      }
      for (const speaker of ep.speakers || []) {
        if (!podcast.hosts.includes(speaker)) {
          episodeCounts.set(speaker, (episodeCounts.get(speaker) || 0) + 1);
          if (!personLanguages.has(speaker)) personLanguages.set(speaker, new Set());
          personLanguages.get(speaker)!.add(podcast.language);
        }
      }
    }
  }

  const items = people.map((p) => {
    const img = getPersonImage(p.slug);
    const count = episodeCounts.get(p.slug) || 0;
    const hosted = hostOf.get(p.slug);
    const languages = personLanguages.get(p.slug);

    return {
      key: p.slug,
      searchText: `${p.name} ${hosted ? hosted.join(" ") : ""} ${languages ? [...languages].join(" ") : ""}`.toLowerCase(),
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
            <h3 className="font-semibold text-sm">{p.name}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground/50">
              {hosted && <span>{content.hostOf}{hosted.join(", ")}</span>}
              {count > 0 && <span>{count} {content.episodes}</span>}
              {languages && languages.size > 0 && (
                <span>{[...languages].sort().join(", ")}</span>
              )}
            </div>
          </div>
        </Link>
      ),
    };
  });

  return (
    <>
      <Breadcrumbs segments={[{ label: content.people.value }]} />
      <h1 className="text-2xl font-semibold mt-6">{content.people}</h1>
      <ListFilter placeholder={content.searchPeople.value} items={items} />
    </>
  );
}

export default async function PeoplePage() {
  const locale = await getLocale();

  return (
    <IntlayerServerProvider locale={locale}>
      <PeoplePageContent />
    </IntlayerServerProvider>
  );
}
