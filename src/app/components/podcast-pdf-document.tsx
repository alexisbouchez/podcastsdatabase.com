"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

interface Episode {
  id: string;
  number: number;
  title: string;
  date?: string;
  description?: string;
}

interface Host {
  name: string;
  slug: string;
}

export interface PodcastPdfData {
  podcast: {
    title: string;
    description: string;
    language: string;
    links: Record<string, string>;
    partial?: boolean;
  };
  hosts: Host[];
  episodes: Episode[];
}

const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";
const SERIF_ITALIC = "Times-Italic";

const s = StyleSheet.create({
  page: {
    fontFamily: SERIF,
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#111111",
    paddingTop: 72,
    paddingBottom: 80,
    paddingHorizontal: 72,
  },
  // ── Header ────────────────────────────────────────────────────────────────
  siteHeader: {
    fontFamily: SERIF,
    fontSize: 7.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#888888",
    textAlign: "center",
    marginBottom: 16,
  },
  ruleHeavy: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#111111",
    marginBottom: 20,
  },
  ruleThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#aaaaaa",
    marginBottom: 14,
  },
  // ── Title block ───────────────────────────────────────────────────────────
  titleBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: SERIF_BOLD,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 1.25,
    marginBottom: 6,
  },
  // ── Abstract / description ────────────────────────────────────────────────
  abstract: {
    fontFamily: SERIF_ITALIC,
    fontSize: 10,
    textAlign: "justify",
    color: "#333333",
    lineHeight: 1.5,
    marginBottom: 14,
    paddingHorizontal: 18,
  },
  // ── Metadata table ────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: SERIF_BOLD,
    fontSize: 9.5,
    width: 56,
    color: "#555555",
  },
  metaValue: {
    fontFamily: SERIF,
    fontSize: 9.5,
    flex: 1,
    color: "#222222",
  },
  metaLink: {
    fontFamily: SERIF,
    fontSize: 9.5,
    color: "#1a56db",
    marginRight: 8,
    textDecoration: "underline",
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 1,
  },
  // ── Section heading ───────────────────────────────────────────────────────
  sectionWrapper: {
    marginTop: 22,
  },
  sectionHeading: {
    fontFamily: SERIF_BOLD,
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  sectionCount: {
    fontFamily: SERIF,
    fontSize: 11,
    color: "#777777",
  },
  // ── Episode entry ─────────────────────────────────────────────────────────
  episode: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: "#dddddd",
  },
  epNumber: {
    fontFamily: SERIF,
    fontSize: 9,
    color: "#aaaaaa",
    width: 28,
    paddingTop: 1,
    textAlign: "right",
    marginRight: 8,
  },
  epBody: {
    flex: 1,
  },
  epTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  epTitle: {
    fontFamily: SERIF_BOLD,
    fontSize: 10.5,
    flex: 1,
    marginRight: 8,
    lineHeight: 1.3,
  },
  epDate: {
    fontFamily: SERIF,
    fontSize: 9,
    color: "#999999",
    flexShrink: 0,
    paddingTop: 1,
  },
  epDesc: {
    fontFamily: SERIF,
    fontSize: 9.5,
    color: "#444444",
    lineHeight: 1.45,
    marginTop: 3,
    textAlign: "justify",
  },
  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 36,
    left: 72,
    right: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 5,
  },
  footerLeft: {
    fontFamily: SERIF_ITALIC,
    fontSize: 8,
    color: "#999999",
  },
  footerRight: {
    fontFamily: SERIF,
    fontSize: 8,
    color: "#999999",
  },
});

export function PodcastPdfDocument({ podcast, hosts, episodes }: PodcastPdfData) {
  const hostNames = hosts.map((h) => h.name).join(", ");
  const linkEntries = Object.entries(podcast.links);

  return (
    <Document
      title={podcast.title}
      author="podcastsdatabase.com"
      subject={`Episode guide for ${podcast.title}`}
      creator="podcastsdatabase.com"
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Site header ── */}
        <Text style={s.siteHeader}>podcastsdatabase.com</Text>
        <View style={s.ruleHeavy} />

        {/* ── Podcast title ── */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{podcast.title}</Text>
        </View>

        <View style={s.ruleThin} />

        {/* ── Abstract / description ── */}
        <Text style={s.abstract}>{podcast.description}</Text>

        {/* ── Metadata ── */}
        {hostNames ? (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>{hosts.length > 1 ? "Hosts" : "Host"}</Text>
            <Text style={s.metaValue}>{hostNames}</Text>
          </View>
        ) : null}

        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Language</Text>
          <Text style={s.metaValue}>{podcast.language.toUpperCase()}</Text>
        </View>

        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Episodes</Text>
          <Text style={s.metaValue}>{episodes.length}</Text>
        </View>

        {linkEntries.length > 0 && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Links</Text>
            <View style={s.linksRow}>
              {linkEntries.map(([label, url]) => (
                <Link key={label} src={url} style={s.metaLink}>
                  {label}
                </Link>
              ))}
            </View>
          </View>
        )}

        <View style={{ ...s.ruleHeavy, marginTop: 16 }} />

        {/* ── Episodes section ── */}
        <View style={s.sectionWrapper}>
          <Text style={s.sectionHeading}>
            Episodes{" "}
            <Text style={s.sectionCount}>({episodes.length})</Text>
          </Text>

          {episodes.map((ep) => (
            <View key={ep.id} style={s.episode} wrap={false}>
              <Text style={s.epNumber}>
                {!podcast.partial ? `#${ep.number}` : ""}
              </Text>
              <View style={s.epBody}>
                <View style={s.epTitleRow}>
                  <Text style={s.epTitle}>{ep.title}</Text>
                  {ep.date ? <Text style={s.epDate}>{ep.date}</Text> : null}
                </View>
                {ep.description ? (
                  <Text style={s.epDesc}>{ep.description}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* ── Fixed footer with page numbers ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>{podcast.title}</Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
