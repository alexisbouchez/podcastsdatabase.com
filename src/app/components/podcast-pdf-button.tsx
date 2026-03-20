"use client";

import { useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EpisodePdfData } from "./podcast-pdf-document";

type State = "idle" | "loading" | "error";

export function PodcastPdfButton({ data }: { data: EpisodePdfData }) {
  const [state, setState] = useState<State>("idle");

  const handleExport = async () => {
    setState("loading");
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
      setState("idle");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <Button
      variant={state === "error" ? "destructive" : "outline"}
      size="sm"
      onClick={state === "loading" ? undefined : handleExport}
      disabled={state === "loading"}
      className="cursor-pointer shrink-0"
    >
      {state === "loading" && <Loader2 className="animate-spin" />}
      {state === "error" && <AlertCircle />}
      {state === "idle" && <FileText />}
      {state === "loading" ? "Generating…" : state === "error" ? "Failed — retry?" : "Export transcript to PDF"}
    </Button>
  );
}
