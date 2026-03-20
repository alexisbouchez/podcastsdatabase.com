"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EpisodePdfData } from "./podcast-pdf-document";

export function PodcastPdfButton({ data }: { data: EpisodePdfData }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { PodcastPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./podcast-pdf-document"),
      ]);

      const blob = await pdf(
        <PodcastPdfDocument
          podcast={data.podcast}
          episode={data.episode}
          speakers={data.speakers}
          segments={data.segments}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.episode.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="cursor-pointer shrink-0"
    >
      {loading ? <Loader2 className="animate-spin" /> : <FileText />}
      {loading ? "Generating…" : "Export to PDF"}
    </Button>
  );
}
