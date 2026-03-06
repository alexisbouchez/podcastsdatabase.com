import Link from "next/link";
import { Breadcrumbs } from "./components/breadcrumbs";
import { getPodcasts, getPeople } from "@/src/lib/data";

export default function Home() {
  const podcasts = getPodcasts();
  const people = getPeople();

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-2xl font-semibold mt-6">Podcasts Database</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Podcasts</h2>
        <ul className="mt-2 space-y-3 list-['—_'] list-inside">
          {podcasts.map((p) => (
            <li key={p.slug}>
              <Link href={`/podcasts/${p.slug}`}>
                {p.title}
              </Link>
              <p className="text-sm text-foreground/60 mt-0.5 ml-5">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">People</h2>
        <ul className="mt-2 space-y-1 list-['—_'] list-inside">
          {people.map((p) => (
            <li key={p.slug}>
              <Link href={`/people/${p.slug}`}>
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
