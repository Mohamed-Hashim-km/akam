import type { Metadata } from "next";
import { cookies } from "next/headers";
import AuthHeroWrapper from "@/components/AuthHeroWrapper";
import LatestStories from "@/components/LatestStories";
import EditorsNote from "@/components/EditorsNote";
import ExploreByInterest from "@/components/ExploreByInterest";
import UpcomingEvents from "@/components/UpcomingEvents";
import FeaturedVideo from "@/components/FeaturedVideo";
import UpcomingBookReleases from "@/components/UpcomingBookReleases";
import ReaderReviews from "@/components/ReaderReviews";
import { API_BASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Akam Digital — Storytelling, Literature & Cultural Platform",
  description:
    "Discover authentic Malayalam stories, essay collections, poetry, regional events, and literary discourse on Akam Digital.",
  openGraph: {
    title: "Akam Digital — Storytelling, Literature & Cultural Platform",
    description:
      "Discover authentic Malayalam stories, essay collections, poetry, regional events, and literary discourse on Akam Digital.",
    url: "https://akamdigital.vercel.app",
    siteName: "Akam Digital",
    images: [
      {
        url: "https://akamdigital.vercel.app/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "Akam Digital",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akam Digital — Storytelling, Literature & Cultural Platform",
    description:
      "Discover authentic Malayalam stories, essay collections, poetry, regional events, and literary discourse on Akam Digital.",
    images: ["https://akamdigital.vercel.app/images/ogImage/ogImage.png"],
  },
};

const isUpcomingDate = (day?: string | null, monthYear?: string | null) => {
  if (!day || !monthYear) return true;
  try {
    const dateStr = `${day} ${monthYear}`;
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      dateObj.setHours(23, 59, 59, 999);
      return dateObj >= new Date();
    }
  } catch (e) {
    return true;
  }
  return true;
};

const CATEGORY_COLORS: Record<string, string> = {
  FICTION: "text-[#D97706]",
  "NON-FICTION": "text-[#0284C7]",
  POETRY: "text-[#9333EA]",
  CULTURE: "text-[#E11D48]",
  TECHNOLOGY: "text-[#059669]",
  OPINION: "text-[#D97706]",
  LITERATURE: "text-[#2563EB]",
  GENERAL: "text-[#4B5563]",
};

function getCategoryColor(cat?: string) {
  if (!cat) return "text-[#D97706]";
  const key = cat.trim().toUpperCase();
  return CATEGORY_COLORS[key] || "text-[#D97706]";
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Safe JSON parser for a settled fetch result. Returns [] on any failure. */
async function safeJson<T = any[]>(
  result: PromiseSettledResult<Response>,
  pick: (json: any) => T,
  fallback: T
): Promise<T> {
  if (result.status !== "fulfilled" || !result.value.ok) return fallback;
  try {
    return pick(await result.value.json());
  } catch {
    return fallback;
  }
}

const pickArray = (json: any): any[] =>
  Array.isArray(json) ? json : json?.data ?? [];

const FETCH_OPTS = (tags: string[]) => ({
  next: { tags: ["homepage", ...tags], revalidate: 60 },
  signal: AbortSignal.timeout(8000),
});

const DEFAULT_EDITORS_NOTE = {
  title: "From Akam editorial",
  note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
};

// ─── data fetcher ─────────────────────────────────────────────────────────────

async function getHomePageData() {
  try {
    // Fetch featured stories AND fallback stories in parallel — zero extra round-trips.
    const [
      featuredStoriesRes,
      fallbackStoriesRes,
      categoriesRes,
      eventsRes,
      booksRes,
      videosRes,
      reviewsRes,
      editorsNoteRes,
    ] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/stories?status=APPROVED&featured=true&limit=10`, FETCH_OPTS(["stories"])),
      fetch(`${API_BASE_URL}/stories?status=APPROVED&limit=10`,              FETCH_OPTS(["stories"])),
      fetch(`${API_BASE_URL}/communities`,                                    FETCH_OPTS(["categories"])),
      fetch(`${API_BASE_URL}/events`,                                         FETCH_OPTS(["events"])),
      fetch(`${API_BASE_URL}/books`,                                          FETCH_OPTS(["books"])),
      fetch(`${API_BASE_URL}/media?featured=true&limit=4`,                   FETCH_OPTS(["media"])),
      fetch(`${API_BASE_URL}/reviews`,                                        FETCH_OPTS(["reviews"])),
      fetch(`${API_BASE_URL}/settings/editors-note`,                         FETCH_OPTS(["editors-note"])),
    ]);

    // Prefer featured stories; fall back to latest approved (already fetched above).
    const featuredRaw = await safeJson(featuredStoriesRes, pickArray, []);
    const rawStories  = featuredRaw.length > 0
      ? featuredRaw
      : await safeJson(fallbackStoriesRes, pickArray, []);

    const stories = rawStories.map((s: any) => ({
      id:          s.id,
      category:    (s.category || "Fiction").toUpperCase(),
      badgeTextColor: getCategoryColor(s.category),
      title:       s.title,
      description: s.description || s.excerpt || s.summary || s.shortDescription || "",
      author:      typeof s.author === "string" && s.author.startsWith("By ")
                     ? s.author
                     : `By ${s.authorName || s.authorEmail || "Unknown Author"}`,
      imageSrc:    s.coverImageUrl || s.imageSrc || "/images/stories/ramachi.jpg",
      href:        `/works/${s.slug || s.id}`,
      contentType: (s.contentType || s.category || "STORY").toUpperCase(),
    }));

    const categories  = await safeJson(categoriesRes,  pickArray, []);
    const rawEvents   = await safeJson(eventsRes,       pickArray, []);
    const books       = await safeJson(booksRes,        pickArray, []);
    const videos      = await safeJson(videosRes,       (j) => j?.data ?? (Array.isArray(j) ? j : []), []);
    const reviews     = await safeJson(reviewsRes,      pickArray, []);

    const events = rawEvents.filter((e: any) =>
      e.type !== "PAST_ARCHIVE" && isUpcomingDate(e.day, e.monthYear)
    );

    const editorsNoteRaw = await safeJson(
      editorsNoteRes,
      (j) => (j?.title && j?.note ? { title: j.title, note: j.note } : null),
      null
    );
    const editorsNote = editorsNoteRaw ?? DEFAULT_EDITORS_NOTE;

    return { stories, categories, events, books, videos, reviews, editorsNote };
  } catch (err) {
    console.error("Failed server-side data fetch for homepage", err);
    return { stories: [], categories: [], events: [], books: [], videos: [], reviews: [], editorsNote: DEFAULT_EDITORS_NOTE };
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedInCookie = cookieStore.get("akam_logged_in")?.value === "true";
  const { stories, categories, events, books, videos, reviews, editorsNote } = await getHomePageData();

  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero & About Akam Section - Only shown for unauthenticated / guest users */}
      <AuthHeroWrapper initialIsLoggedIn={isLoggedInCookie} />

      {/* Latest Stories Section */}
      <LatestStories stories={stories} />

    
      {/* Editor's Note Section */}
      <EditorsNote title={editorsNote.title} note={editorsNote.note} />

      {/* Explore By Interest Section */}
      <ExploreByInterest categories={categories} />

      {/* Upcoming Events Section - fetches live from API (no ISR cache) */}
      <UpcomingEvents />

      {/* Featured Video Section - fetches live from API (no ISR cache) */}
      <FeaturedVideo />

      {/* Upcoming Book Releases Section - fetches live from API (no ISR cache) */}
      <UpcomingBookReleases />

      {/* Reader Reviews Section */}
      <ReaderReviews reviews={reviews} />
    </main>
  );
}