import { NextRequest, NextResponse } from "next/server";

const PYANNOTE_API = "https://api.pyannote.ai/v1";

export interface DiarizationTurn {
  start: number;
  end: number;
  speaker: string;
}

export interface JobResult {
  status: "running" | "succeeded" | "failed" | "canceled";
  step?: string;
  error?: string;
  output?: {
    diarization: DiarizationTurn[];
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const apiKey = process.env.PYANNOTE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "PYANNOTE_API_KEY not configured" },
      { status: 500 }
    );
  }

  const resp = await fetch(`${PYANNOTE_API}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // Don't cache — this is a polling endpoint
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: `pyannote.ai error: ${resp.status} ${text}` },
      { status: resp.status >= 400 && resp.status < 500 ? resp.status : 502 }
    );
  }

  const data: JobResult = await resp.json();
  return NextResponse.json(data);
}
