import MediaSection from "@/components/MediaSection";
import { API_BASE_URL } from "@/lib/config";
import type { Metadata } from "next";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Akam Media — Interviews, Discussions, Debates & Cultural Programmes",
  description:
    "Explore Malayalam literature, art, and heritage through candid dialogues, oral histories, and cultural discourse with regional thinkers.",
  alternates: {
    canonical: "https://akamdigital.in/media",
  },
  openGraph: {
    title: "Akam Media — Interviews, Discussions, Debates & Cultural Programmes",
    description:
      "Explore Malayalam literature, art, and heritage through candid dialogues, oral histories, and cultural discourse with regional thinkers.",
    url: "https://akamdigital.in/media",
    type: "website",
  },
};

const FETCH_OPTS = (tags: string[]) => ({
  next: { tags: ["media", ...tags], revalidate: 60 },
  signal: AbortSignal.timeout(8000),
});

async function getInitialMedia() {
  try {
    const res = await fetch(`${API_BASE_URL}/media?category=interviews&page=1&limit=6`, FETCH_OPTS(["media"]));
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 6, totalPages: 1 } };
    const json = await res.json();
    return {
      data: json.data || (Array.isArray(json) ? json : []),
      meta: json.meta || { total: 0, page: 1, limit: 6, totalPages: 1 },
    };
  } catch (err) {
    console.error("[MediaPage] Failed to fetch initial media:", err);
    return { data: [], meta: { total: 0, page: 1, limit: 6, totalPages: 1 } };
  }
}

export default async function MediaPage() {
  const { data: initialMedia, meta: initialMeta } = await getInitialMedia();

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Media Section */}
      <MediaSection initialMedia={initialMedia.length > 0 ? initialMedia : undefined} initialMeta={initialMeta} />
    </div>
  );
}
