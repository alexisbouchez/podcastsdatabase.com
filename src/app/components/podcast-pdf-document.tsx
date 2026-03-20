"use client";

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";

export interface EpisodePdfData {
  podcast: {
    title: string;
    slug: string;
    partial?: boolean;
  };
  episode: {
    number: number;
    title: string;
    date?: string;
    description?: string;
    links: Record<string, string>;
  };
  speakers: Array<{ slug: string; name: string }>;
  segments: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;
}

const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";
const SERIF_ITALIC = "Times-Italic";

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const s = StyleSheet.create({
  page: {
    fontFamily: SERIF,
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#111111",
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
  },
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
  ruleHeavyTopSpaced: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#111111",
    marginTop: 16,
    marginBottom: 20,
  },
  ruleThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#aaaaaa",
    marginBottom: 14,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: SERIF_BOLD,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  podcastMeta: {
    fontFamily: SERIF_ITALIC,
    fontSize: 10,
    textAlign: "center",
    color: "#666666",
  },
  abstract: {
    fontFamily: SERIF_ITALIC,
    fontSize: 10,
    textAlign: "justify",
    color: "#333333",
    lineHeight: 1.5,
    marginBottom: 14,
    paddingHorizontal: 18,
  },
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
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaLink: {
    fontFamily: SERIF,
    fontSize: 9.5,
    color: "#1a56db",
    marginRight: 8,
    textDecoration: "underline",
  },
  sectionWrapper: {
    marginTop: 22,
  },
  sectionHeading: {
    fontFamily: SERIF_BOLD,
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    marginBottom: 9,
  },
  segmentTimestamp: {
    fontFamily: SERIF,
    fontSize: 8.5,
    color: "#aaaaaa",
    width: 32,
    paddingTop: 1.5,
    textAlign: "right",
    marginRight: 8,
    flexShrink: 0,
  },
  segmentBody: {
    flex: 1,
  },
  segmentSpeaker: {
    fontFamily: SERIF_BOLD,
    fontSize: 9.5,
    color: "#333333",
    marginBottom: 1,
  },
  segmentText: {
    fontFamily: SERIF,
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.5,
    textAlign: "justify",
  },
});

export function PodcastPdfDocument({ podcast, episode, speakers, segments }: EpisodePdfData) {
  const speakerMap = Object.fromEntries(speakers.map((sp) => [sp.slug, sp.name]));
  const speakerNames = speakers.map((sp) => sp.name).join(", ");
  const linkEntries = Object.entries(episode.links);

  return (
    <Document
      title={episode.title}
      author="podcastsdatabase.com"
      subject={`Transcript — ${episode.title}`}
      creator="podcastsdatabase.com"
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Site header ── */}
        <Text style={s.siteHeader}>podcastsdatabase.com</Text>
        <View style={s.ruleHeavy} />

        {/* ── Episode title ── */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{episode.title}</Text>
          <Text style={s.podcastMeta}>{podcast.title}</Text>
        </View>

        <View style={s.ruleThin} />

        {/* ── Abstract / description ── */}
        {episode.description ? (
          <Text style={s.abstract}>{episode.description}</Text>
        ) : null}

        {/* ── Metadata ── */}
        {speakerNames ? (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>{speakers.length > 1 ? "Speakers" : "Speaker"}</Text>
            <Text style={s.metaValue}>{speakerNames}</Text>
          </View>
        ) : null}

        {episode.date ? (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>{episode.date}</Text>
          </View>
        ) : null}

        {!podcast.partial ? (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Episode</Text>
            <Text style={s.metaValue}>#{episode.number}</Text>
          </View>
        ) : null}

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

        <View style={s.ruleHeavyTopSpaced} />

        {/* ── Transcript ── */}
        {segments.length > 0 ? (
          <View style={s.sectionWrapper}>
            <Text style={s.sectionHeading}>Transcript</Text>
            {segments.map((seg, i) => (
              <View key={i} style={s.segment} wrap={false}>
                <Text style={s.segmentTimestamp}>{fmtTime(seg.start)}</Text>
                <View style={s.segmentBody}>
                  <Text style={s.segmentSpeaker}>
                    {speakerMap[seg.speaker] ?? seg.speaker}
                  </Text>
                  <Text style={s.segmentText}>{seg.text}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
