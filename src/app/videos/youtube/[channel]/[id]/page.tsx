import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/src/app/components/breadcrumbs";
import { Transcript } from "@/src/app/components/transcript";
import {
  getYoutubeChannels,
  getChannelVideos,
  getVideo,
  getPerson,
  formatTime,
} from "@/src/lib/data";

export function generateStaticParams() {
  return getYoutubeChannels().flatMap((channel) =>
    getChannelVideos(channel).map((v) => ({ channel, id: v.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string; id: string }>;
}) {
  const { channel, id } = await params;
  const video = getVideo(channel, id);
  if (!video) return {};
  return {
    title: `${video.title} — Podcasts Database`,
    description: video.description,
    alternates: { canonical: `/videos/youtube/${channel}/${id}` },
  };
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ channel: string; id: string }>;
}) {
  const { channel, id } = await params;
  const video = getVideo(channel, id);
  if (!video) notFound();

  const speaker = video.speaker ? getPerson(video.speaker) : null;
  const speakerMap = speaker ? { [video.speaker!]: speaker.name } : {};

  const totalDuration = video.segments?.length
    ? video.segments[video.segments.length - 1].end
    : 0;

  return (
    <article>
      <Breadcrumbs
        segments={[
          { label: "Videos", href: "/videos" },
          { label: channel, href: `/videos/youtube/${channel}` },
          { label: video.title },
        ]}
      />

      <header className="mt-6">
        <p className="text-sm text-foreground/60">
          YouTube — {channel}
          {video.date && <> — <time dateTime={video.date}>{video.date}</time></>}
          {totalDuration > 0 && <> — <time>{formatTime(totalDuration)}</time></>}
        </p>
        <h1 className="text-2xl font-semibold mt-1">{video.title}</h1>
        {video.description && (
          <p className="mt-2 text-sm text-foreground/60 whitespace-pre-line text-pretty">
            {video.description}
          </p>
        )}
      </header>

      {video.youtubeId && (
        <div className="mt-6 aspect-video max-w-sm">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {video.segments && video.segments.length > 0 && (
        <section className="mt-10">
          <Transcript segments={video.segments} speakerMap={speakerMap} />
        </section>
      )}
    </article>
  );
}
