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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Akam Digital — Storytelling, Literature & Cultural Platform",
  description:
    "Discover authentic Malayalam stories, essay collections, poetry, regional events, and literary discourse on Akam Digital.",
  openGraph: {
    title: "Akam Digital — Storytelling, Literature & Cultural Platform",
    description:
      "Discover authentic Malayalam stories, essay collections, poetry, regional events, and literary discourse on Akam Digital.",
    url: "https://akam.digital",
    siteName: "Akam Digital",
    type: "website",
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
    const fetchOptions: RequestInit = {
      next: { revalidate: 300, tags: ["homepage", "stories"] },
      signal: AbortSignal.timeout(8000),
    };

    const [storiesRes, categoriesRes, eventsRes, booksRes, videosRes, commentsRes, editorsNoteRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/stories?status=APPROVED&limit=10`, fetchOptions),
      fetch(`${API_BASE_URL}/communities`, fetchOptions),
      fetch(`${API_BASE_URL}/events`, fetchOptions),
      fetch(`${API_BASE_URL}/books`, fetchOptions),
      fetch(`${API_BASE_URL}/media?featured=true&limit=3`, fetchOptions),
      fetch(`${API_BASE_URL}/stories/comments/recent?limit=10`, fetchOptions),
      fetch(`${API_BASE_URL}/settings/editors-note`, fetchOptions),
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

    const stories = rawStories.map((s: any) => ({
      id: s.id,
      category: (s.category || "Fiction").toUpperCase(),
      badgeTextColor: getCategoryColor(s.category),
      title: s.title,
      author: typeof s.author === "string" && s.author.startsWith("By ") ? s.author : `By ${s.authorName || s.authorEmail || "Unknown Author"}`,
      imageSrc: s.coverImageUrl || s.imageSrc || "/images/stories/ramachi.jpg",
      href: `/stories/${s.slug || s.id}`,
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

    const comments =
      commentsRes.status === "fulfilled" && commentsRes.value.ok
        ? await commentsRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || [])).catch(() => [])
        : [];

    let editorsNote = {
      title: "Editor's Note",
      note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
    };
    if (editorsNoteRes.status === "fulfilled" && editorsNoteRes.value.ok) {
      try {
        const json = await editorsNoteRes.value.json();
        if (json && json.title && json.note) {
          editorsNote = { title: json.title, note: json.note };
        }
      } catch (e) {}
    }

    return { stories, categories, events, books, videos, comments, editorsNote };
  } catch (err) {
    console.error("Failed server-side data fetch for homepage", err);
    return {
      stories: [],
      categories: [],
      events: [],
      books: [],
      videos: [],
      comments: [],
      editorsNote: {
        title: "Editor's Note",
        note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
      },
    };
  }
}

export default async function Home() {
  const { stories, categories, events, books, videos, comments, editorsNote } = await getHomePageData();

  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero Section - Only shown for unauthenticated / guest users */}
      <AuthHeroWrapper />

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
      <ReaderReviews reviews={comments} />
    </main>
  );
}
