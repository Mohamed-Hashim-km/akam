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

async function getHomePageData() {
  try {
    const timeoutSignal = AbortSignal.timeout(8000);

    const [storiesRes, categoriesRes, eventsRes, booksRes, videosRes, reviewsRes, editorsNoteRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/stories?status=APPROVED&featured=true&limit=10`, {
        next: { tags: ["homepage", "stories"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/communities`, {
        next: { tags: ["homepage", "categories"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/events`, {
        next: { tags: ["homepage", "events"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/books`, {
        next: { tags: ["homepage", "books"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/media?featured=true&limit=4`, {
        next: { tags: ["homepage", "media"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/reviews`, {
        next: { tags: ["homepage", "reviews"], revalidate: 60 },
        signal: timeoutSignal,
      }),
      fetch(`${API_BASE_URL}/settings/editors-note`, {
        next: { tags: ["homepage", "editors-note"], revalidate: 60 },
        signal: timeoutSignal,
      }),
    ]);

    let rawStories: any[] = [];
    if (storiesRes.status === "fulfilled" && storiesRes.value.ok) {
      try {
        const json = await storiesRes.value.json();
        rawStories = json.data || (Array.isArray(json) ? json : []);
      } catch (e) {
        console.error("Failed to parse stories json", e);
      }
    }

    // Fallback: If no stories are explicitly marked as featured in editorial, fallback to latest approved
    if (rawStories.length === 0) {
      try {
        const fallbackRes = await fetch(`${API_BASE_URL}/stories?status=APPROVED&limit=10`, {
          next: { tags: ["homepage", "stories"], revalidate: 60 },
          signal: AbortSignal.timeout(5000),
        });
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          rawStories = fallbackJson.data || (Array.isArray(fallbackJson) ? fallbackJson : []);
        }
      } catch (e) {
        console.error("Failed to fallback to latest approved stories", e);
      }
    }

    const stories = rawStories.map((s: any) => ({
      id: s.id,
      category: (s.category || "Fiction").toUpperCase(),
      badgeTextColor: getCategoryColor(s.category),
      title: s.title,
      description: s.description || s.excerpt || s.summary || s.shortDescription || "",
      author: typeof s.author === "string" && s.author.startsWith("By ") ? s.author : `By ${s.authorName || s.authorEmail || "Unknown Author"}`,
      imageSrc: s.coverImageUrl || s.imageSrc || "/images/stories/ramachi.jpg",
      href: `/works/${s.slug || s.id}`,
      contentType: (s.contentType || s.category || "STORY").toUpperCase(),
    }));

    const categories =
      categoriesRes.status === "fulfilled" && categoriesRes.value.ok
        ? await categoriesRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || [])).catch(() => [])
        : [];

    const rawEvents =
      eventsRes.status === "fulfilled" && eventsRes.value.ok
        ? await eventsRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || [])).catch(() => [])
        : [];

    const events = rawEvents.filter((e: any) => {
      if (e.type === "PAST_ARCHIVE") return false;
      return isUpcomingDate(e.day, e.monthYear);
    });

    const books =
      booksRes.status === "fulfilled" && booksRes.value.ok
        ? await booksRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || [])).catch(() => [])
        : [];

    const videos =
      videosRes.status === "fulfilled" && videosRes.value.ok
        ? await videosRes.value.json().then((json) => json.data || (Array.isArray(json) ? json : [])).catch(() => [])
        : [];

    const reviews =
      reviewsRes.status === "fulfilled" && reviewsRes.value.ok
        ? await reviewsRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || [])).catch(() => [])
        : [];

    let editorsNote = {
      title: "From Akam editorial",
      note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
    };
    if (editorsNoteRes.status === "fulfilled" && editorsNoteRes.value.ok) {
      try {
        const json = await editorsNoteRes.value.json();
        if (json && json.title && json.note) {
          editorsNote = { title: json.title, note: json.note };
        }
      } catch (e) { }
    }

    return { stories, categories, events, books, videos, reviews, editorsNote };
  } catch (err) {
    console.error("Failed server-side data fetch for homepage", err);
    return {
      stories: [],
      categories: [],
      events: [],
      books: [],
      videos: [],
      reviews: [],
      editorsNote: {
        title: "From Akam editorial",
        note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
      },
    };
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

      {/* Upcoming Events Section */}
      <UpcomingEvents events={events} />

      {/* Featured Video Section */}
      <FeaturedVideo initialVideos={videos} />

      {/* Upcoming Book Releases Section */}
      <UpcomingBookReleases releases={books} />

      {/* Reader Reviews Section */}
      <ReaderReviews reviews={reviews} />
    </main>
  );
}
