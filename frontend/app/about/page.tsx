import AboutHero from "@/components/AboutHero";
import EditorialVow from "@/components/EditorialVow";
import AuthorsOfAkam from "@/components/AuthorsOfAkam";
import AboutKairaliBooks from "@/components/AboutKairaliBooks";
import { API_BASE_URL } from "@/lib/config";

import type { Metadata } from "next";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: "About AKAM — Preserving Heritage, Championing Modern Voices",
  description:
    "At our core, we believe that literature is the mirror of a society's soul. Rooted in the rich linguistic tradition of Malayalam.",
  alternates: {
    canonical: "https://akamdigital.in/about",
  },
  openGraph: {
    title: "About AKAM — Preserving Heritage, Championing Modern Voices",
    description:
      "At our core, we believe that literature is the mirror of a society's soul. Rooted in the rich linguistic tradition of Malayalam.",
    url: "https://akamdigital.in/about",
    type: "website",
  },
};

const FETCH_OPTS = (tags: string[]) => ({
  next: { tags: ["about", ...tags], revalidate: 60 },
  signal: AbortSignal.timeout(8000),
});

async function getInitialAuthors() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/public-authors?page=1&limit=8`, FETCH_OPTS(["authors"]));
    if (!res.ok) return { authors: [], hasMore: false };
    const json = await res.json();
    const authorsData = json.data ? json.data : (Array.isArray(json) ? json : []);
    const meta = json.meta || {};
    const mapped = authorsData.map((u: any, idx: number) => ({
      id: u.id || `author-${idx}`,
      name: u.name || u.email?.split("@")[0] || "Akam Author",
      role: u.bio || `${u.role || "Author"} at Akam Journal`,
      imageSrc: u.avatarUrl || null,
      imageAlt: u.name || "Author Avatar",
    }));
    return {
      authors: mapped,
      hasMore: meta.hasMore ?? (meta.total > 8),
    };
  } catch (err) {
    console.error("[AboutPage] Failed to fetch initial authors:", err);
    return { authors: [], hasMore: false };
  }
}

export default async function AboutPage() {
  const { authors, hasMore } = await getInitialAuthors();

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* About Hero Section */}
      <AboutHero />

      {/* Editorial Vow Section */}
      <EditorialVow />

      {/* Authors Of Akam Section */}
      <AuthorsOfAkam authors={authors.length > 0 ? authors : undefined} initialHasMore={hasMore} />

      {/* About Kairali Books Section */}
      <AboutKairaliBooks />
    </div>
  );
}
