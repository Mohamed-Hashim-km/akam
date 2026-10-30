import React from "react";
import type { Metadata } from "next";
import MasikaClient from "@/components/MasikaClient";
import type { EditionItem } from "@/components/PreviousEditions";
import type { ArtistItem } from "@/components/FeaturedArtist";
import { API_BASE_URL } from "@/lib/config";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Akam Masika — Monthly Malayalam Literary E-Magazine",
  description:
    "Read the latest digital edition of Akam Masika, featuring essays, poetry, original Malayalam literature, author interviews, and full 3D flipbook archives.",
  alternates: {
    canonical: "https://akamdigital.in/emagazine",
  },
  openGraph: {
    title: "Akam Masika — Monthly Malayalam Literary E-Magazine",
    description:
      "Read the latest digital edition of Akam Masika, featuring essays, poetry, original Malayalam literature, author interviews, and full 3D flipbook archives.",
    url: "https://akamdigital.in/emagazine",
    type: "website",
  },
};

const FETCH_OPTS = (tags: string[]) => ({
  next: { tags: ["emagazine", ...tags], revalidate: 60 },
  signal: AbortSignal.timeout(8000),
});

async function getMasikaPageData() {
  const [latestRes, editionsRes, artistsRes] = await Promise.allSettled([
    fetch(`${API_BASE_URL}/editions?page=1&limit=1`, FETCH_OPTS(["editions"])),
    fetch(`${API_BASE_URL}/editions?page=1&limit=10`, FETCH_OPTS(["editions"])),
    fetch(`${API_BASE_URL}/users/public-authors?page=1&limit=4&featured=true`, FETCH_OPTS(["authors"])),
  ]);

  let latestEdition: EditionItem | null = null;
  if (latestRes.status === "fulfilled" && latestRes.value.ok) {
    try {
      const json = await latestRes.value.json();
      if (json?.data?.[0]) {
        latestEdition = json.data[0] as EditionItem;
      }
    } catch (e) {
      console.error("[MasikaPage] Failed to parse latest edition:", e);
    }
  }

  let previousEditions: EditionItem[] = [];
  let editionsHasMore = false;
  if (editionsRes.status === "fulfilled" && editionsRes.value.ok) {
    try {
      const json = await editionsRes.value.json();
      if (json && json.data && Array.isArray(json.data)) {
        previousEditions = json.data;
        editionsHasMore = json.meta?.hasMore ?? (json.meta?.page < json.meta?.totalPages);
      } else if (Array.isArray(json)) {
        previousEditions = json;
        editionsHasMore = false;
      }
    } catch (e) {
      console.error("[MasikaPage] Failed to parse previous editions:", e);
    }
  }

  let featuredArtists: ArtistItem[] = [];
  if (artistsRes.status === "fulfilled" && artistsRes.value.ok) {
    try {
      const json = await artistsRes.value.json();
      const raw = json.data ? json.data : (Array.isArray(json) ? json : []);
      featuredArtists = raw.map((u: any, idx: number) => ({
        id: u.id || `author-${idx}`,
        name: u.name || u.email?.split("@")[0] || "Featured Author",
        bio: u.bio || `${u.role || "Author"} at Akam Journal`,
        imageSrc: u.avatarUrl || null,
        imageAlt: u.name || "Featured Author Avatar",
      }));
    } catch (e) {
      console.error("[MasikaPage] Failed to parse featured artists:", e);
    }
  }

  return { latestEdition, previousEditions, editionsHasMore, featuredArtists };
}

export default async function MasikaPage() {
  const { latestEdition, previousEditions, editionsHasMore, featuredArtists } = await getMasikaPageData();

  return (
    <MasikaClient
      initialLatestEdition={latestEdition}
      initialPreviousEditions={previousEditions.length > 0 ? previousEditions : undefined}
      initialEditionsHasMore={editionsHasMore}
      initialFeaturedArtists={featuredArtists.length > 0 ? featuredArtists : undefined}
    />
  );
}
