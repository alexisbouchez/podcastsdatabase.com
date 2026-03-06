import Link from "next/link";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function Breadcrumbs({ segments }: { segments?: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      {segments?.length ? (
        <Link href="/" className="text-foreground hover:text-foreground/60">
          ~
        </Link>
      ) : (
        <span className="text-foreground/60">~</span>
      )}
      {segments?.map((segment, index) => {
        const isLast = index === segments.length - 1;

        return (
          <span key={index}>
            <span className="text-foreground/20" aria-hidden>
              {" / "}
            </span>
            {isLast ? (
              <span className="text-foreground/60" aria-current="page">
                {segment.label}
              </span>
            ) : segment.href ? (
              <Link href={segment.href}>{segment.label}</Link>
            ) : (
              <span className="text-foreground/60">{segment.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
