/**
 * Fetch podcast artwork from Apple Podcasts using the iTunes Lookup API.
 */

interface ITunesResult {
  artworkUrl600: string;
  collectionName: string;
}

/** Extract the numeric Apple Podcasts ID from a URL like
 *  https://podcasts.apple.com/.../id1862204027 */
export function parseAppleId(url: string): string {
  const match = url.match(/id(\d+)/);
  if (!match) throw new Error(`Cannot extract Apple Podcasts ID from: ${url}`);
  return match[1];
}

/** Look up podcast metadata via the iTunes API. */
export async function lookupPodcast(
  appleId: string,
): Promise<ITunesResult> {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${appleId}&entity=podcast`,
  );
  if (!res.ok) throw new Error(`iTunes API returned ${res.status}`);
  const data = await res.json();
  if (!data.results?.length) throw new Error(`No results for ID ${appleId}`);
  return data.results[0];
}

/** Download the artwork image and return the raw bytes + file extension. */
export async function downloadArtwork(
  artworkUrl600: string,
): Promise<{ data: Buffer; ext: string }> {
  // Request a 600x600 jpg (replace size token in the URL)
  const url = artworkUrl600.replace(/\/\d+x\d+bb\.jpg$/, "/600x600bb.jpg");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download artwork: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const data = Buffer.from(await res.arrayBuffer());
  return { data, ext };
}
