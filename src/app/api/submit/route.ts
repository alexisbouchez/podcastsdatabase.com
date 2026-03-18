import { NextRequest, NextResponse } from "next/server";

const PYANNOTE_API = "https://api.pyannote.ai/v1";

function getApiKey() {
  const key = process.env.PYANNOTE_API_KEY;
  if (!key) throw new Error("PYANNOTE_API_KEY not configured");
  return key;
}

export async function POST(req: NextRequest) {
  let body: { url?: string; numSpeakers?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, numSpeakers } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server misconfiguration" },
      { status: 500 }
    );
  }

  const payload: Record<string, unknown> = { url };
  if (numSpeakers && numSpeakers >= 1 && numSpeakers <= 20) {
    payload.numSpeakers = numSpeakers;
  }

  const resp = await fetch(`${PYANNOTE_API}/diarize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: `pyannote.ai error: ${resp.status} ${text}` },
      { status: resp.status >= 400 && resp.status < 500 ? resp.status : 502 }
    );
  }

  const data = await resp.json();
  return NextResponse.json({ jobId: data.jobId }, { status: 202 });
}
