import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import {
  getPodcasts,
  getPodcast,
  getPodcastLogo,
  getEpisodes,
  getPerson,
} from "@/src/lib/data";

export function generateStaticParams() {
  return getPodcasts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const podcast = getPodcast(slug);
  if (!podcast) return {};
  return { title: `${podcast.title} — Podcasts Database` };
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const podcast = getPodcast(slug);
  if (!podcast) notFound();

  const episodes = getEpisodes(slug);
  const hosts = podcast.hosts.map((h) => getPerson(h)).filter(Boolean);

  return (
    <>
      <Breadcrumbs
        segments={[
          { label: "Podcasts" },
          { label: podcast.title, href: `/podcasts/${slug}` },
        ]}
      />

      <header className="mt-6 flex items-start gap-4">
        {(() => {
          const logo = getPodcastLogo(slug);
          return logo ? (
            <Image
              src={logo}
              alt={podcast.title}
              width={80}
              height={80}
              className="rounded shrink-0"
            />
          ) : null;
        })()}
        <div>
          <h1 className="text-2xl font-semibold">{podcast.title}</h1>
          <p className="mt-2 text-foreground/60 text-pretty">
            {podcast.description}
          </p>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-foreground/60">Language</dt>
        <dd>
          <code>{podcast.language}</code>
        </dd>
        <dt className="text-foreground/60">Hosts</dt>
        <dd>
          {hosts.map((h, i) => (
            <span key={h!.slug}>
              {i > 0 && ", "}
              <Link href={`/people/${h!.slug}`} className="underline">
                {h!.name}
              </Link>
            </span>
          ))}
        </dd>
      </dl>

      {Object.keys(podcast.links).length > 0 && (
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          {Object.entries(podcast.links).map(([label, url]) => (
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

      <hr className="mt-8 border-foreground/10" />

      <section className="mt-6">
        <h2 className="text-lg font-semibold">
          Episodes
          <span className="text-foreground font-normal ml-2">
            ({episodes.length})
          </span>
        </h2>
        {episodes.length === 0 ? (
          <p className="mt-2 text-foreground/60 text-sm">No episodes yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {episodes.map((ep) => (
              <li key={ep.id}>
                <span className="text-foreground/60 select-none">#{ep.id}</span>{" "}
                <Link href={`/podcasts/${slug}/episodes/${ep.id}`}>
                  {ep.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
