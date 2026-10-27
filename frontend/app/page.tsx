import type { Metadata } from "next";
import AuthHeroWrapper from "@/components/AuthHeroWrapper";
import LatestStories from "@/components/LatestStories";
import EditorsNote from "@/components/EditorsNote";
import ExploreByInterest from "@/components/ExploreByInterest";
import UpcomingEvents from "@/components/UpcomingEvents";
import FeaturedVideo from "@/components/FeaturedVideo";
import UpcomingBookReleases from "@/components/UpcomingBookReleases";
import ReaderReviews from "@/components/ReaderReviews";
import { API_BASE_URL } from "@/lib/config";

// ISR: Incremental Static Regeneration with 60-second background revalidation fallback
// and on-demand cache busting via /api/revalidate?path=/ or tags (stories, events, books, media, etc.)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "AKAM Digital — Malayalam Literature, Stories, Essays & E-Magazine",
  description:
    "Discover authentic Malayalam stories, serialized fiction, poetry, regional events, and monthly literary journals on AKAM Digital.",
  alternates: {
    canonical: "https://akamdigital.in",
  },
  openGraph: {
    title: "AKAM Digital — Malayalam Literature, Stories, Essays & E-Magazine",
    description:
      "Discover authentic Malayalam stories, serialized fiction, poetry, regional events, and monthly literary journals on AKAM Digital.",
    url: "https://akamdigital.in",
    siteName: "AKAM Digital",
    images: [
      {
        url: "/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "AKAM Digital",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AKAM Digital — Malayalam Literature, Stories, Essays & E-Magazine",
    description:
      "Discover authentic Malayalam stories, serialized fiction, poetry, regional events, and monthly literary journals on AKAM Digital.",
    images: ["/images/ogImage/ogImage.png"],
  },
};

const isUpcomingDate = (day?: string | null, monthYear?: string | null) => {
  if (!day || !monthYear) return true;
  try {
    const parts = day.split(/[-–—]|to/i).map((s) => s.trim());
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/\d+/);
    if (match) {
      const dateObj = new Date(`${match[0]} ${monthYear}`);
      if (!isNaN(dateObj.getTime())) {
        dateObj.setHours(23, 59, 59, 999);
        return dateObj >= new Date();
      }
    }
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
      fetch(`${API_BASE_URL}/events?page=1&limit=8&upcoming=true`,           FETCH_OPTS(["events"])),
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

    const stories = rawStories.map((s: any) => {
      const isVideo =
        s.submissionType?.toUpperCase() === "VIDEO" ||
        s.contentType?.toUpperCase() === "VIDEO" ||
        (typeof s.category === "string" && s.category.trim().toUpperCase() === "VIDEO") ||
        Boolean(
          s.mediaUrl &&
          (s.mediaUrl.includes("youtube.com") ||
           s.mediaUrl.includes("youtu.be") ||
           s.mediaUrl.includes("vimeo.com") ||
           s.mediaUrl.endsWith(".mp4") ||
           s.mediaUrl.endsWith(".webm") ||
           s.submissionType?.toUpperCase() === "VIDEO")
        );

      let imageSrc = s.coverImageUrl || s.imageSrc;
      if (!imageSrc && isVideo && s.mediaUrl) {
        const ytMatch = s.mediaUrl.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
        );
        if (ytMatch && ytMatch[1]) {
          imageSrc = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
      }
      if (!imageSrc) {
        imageSrc = s.mediaUrl || "/images/stories/ramachi.jpg";
      }

      return {
        id:          s.id,
        category:    (s.category || (isVideo ? "Video" : "Fiction")).toUpperCase(),
        badgeTextColor: getCategoryColor(s.category),
        title:       s.title,
        description: s.description || s.excerpt || s.summary || s.shortDescription || "",
        author:      typeof s.author === "string" && s.author.startsWith("By ")
                       ? s.author
                       : `By ${s.authorName || s.authorEmail || "Unknown Author"}`,
        imageSrc,
        href:        `/works/${s.slug || s.id}`,
        contentType: isVideo ? "VIDEO" : (s.contentType || s.category || "STORY").toUpperCase(),
        submissionType: s.submissionType || (isVideo ? "VIDEO" : undefined),
        mediaUrl:    s.mediaUrl,
      };
    });

    const categories  = await safeJson(categoriesRes,  pickArray, []);
    const rawEvents   = await safeJson(eventsRes,       (j) => j?.data ?? (Array.isArray(j) ? j : []), []);
    const books       = await safeJson(booksRes,        pickArray, []);
    const videos      = await safeJson(videosRes,       (j) => j?.data ?? (Array.isArray(j) ? j : []), []);
    const reviews     = await safeJson(reviewsRes,      pickArray, []);

    const events = rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      time: e.time || "",
      day: e.day || "",
      monthYear: e.monthYear || "",
      eventDate: e.eventDate,
      imageSrc: e.imageSrc || (Array.isArray(e.images) && e.images[0]) || "",
      image: e.imageSrc || (Array.isArray(e.images) && e.images[0]) || "",
      registerHref: e.registerHref || undefined,
      type: e.type,
      isPaid: Boolean(e.isPaid),
      price: e.price !== undefined ? Number(e.price) : 0,
    }));

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
  const { stories, categories, events, books, videos, reviews, editorsNote } = await getHomePageData();

  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero & About Akam Section - Shown for unauthenticated / guest users, auto-hidden client-side for logged-in users */}
      <AuthHeroWrapper />

      {/* Latest Stories Section */}
      <LatestStories stories={stories} />

      {/* Editor's Note Section */}
      <EditorsNote title={editorsNote.title} note={editorsNote.note} />

      {/* Explore By Interest Section */}
      <ExploreByInterest categories={categories} />

      {/* Upcoming Events Section - Server-side fetched (top 8 upcoming events) */}
      <UpcomingEvents events={events} />

      {/* Featured Video Section - Server-side fetched with ISR cache */}
      <FeaturedVideo initialVideos={videos} />

      {/* Upcoming Book Releases Section - Server-side fetched with ISR cache */}
      <UpcomingBookReleases releases={books} />

      {/* Reader Reviews Section */}
      <ReaderReviews reviews={reviews} />
    </main>
  );
}