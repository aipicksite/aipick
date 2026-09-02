// Server-only helper — fetches a curated photo from Pexels for content
// pages (hero banners, blog covers, feature sections). Never call this
// from a client component; PEXELS_API_KEY must stay server-side.

type PexelsPhoto = {
  src: { large2x: string; large: string; medium: string };
  alt: string;
  photographer: string;
  photographer_url: string;
};

export type ImageResult = {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
};

export async function getPexelsImage(
  query: string,
  orientation: "landscape" | "portrait" | "square" = "landscape"
): Promise<ImageResult | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=1&orientation=${orientation}`,
      {
        headers: { Authorization: key },
        next: { revalidate: 60 * 60 * 24 }, // cache for a day
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const photo = data?.photos?.[0] as PexelsPhoto | undefined;
    if (!photo) return null;

    return {
      url: photo.src.large2x,
      alt: photo.alt || query,
      credit: photo.photographer,
      creditUrl: photo.photographer_url,
    };
  } catch {
    return null;
  }
}
