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

async function getHomePageData() {
  try {
    const [storiesRes, categoriesRes, eventsRes, booksRes, videosRes, commentsRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/stories/published?page=1&limit=10`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/communities`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/events`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/books`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/media?featured=true&limit=3`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/stories/comments/recent?limit=10`, { next: { revalidate: 60 } }),
    ]);

    const stories =
      storiesRes.status === "fulfilled" && storiesRes.value.ok
        ? await storiesRes.value.json().then((json) => json.data || (Array.isArray(json) ? json : []))
        : [];

    const categories =
      categoriesRes.status === "fulfilled" && categoriesRes.value.ok
        ? await categoriesRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || []))
        : [];

    const rawEvents =
      eventsRes.status === "fulfilled" && eventsRes.value.ok
        ? await eventsRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || []))
        : [];

    const events = rawEvents.filter((e: any) => {
      if (e.type === "PAST_ARCHIVE") return false;
      return isUpcomingDate(e.day, e.monthYear);
    });

    const books =
      booksRes.status === "fulfilled" && booksRes.value.ok
        ? await booksRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || []))
        : [];

    const videos =
      videosRes.status === "fulfilled" && videosRes.value.ok
        ? await videosRes.value.json().then((json) => json.data || (Array.isArray(json) ? json : []))
        : [];

    const comments =
      commentsRes.status === "fulfilled" && commentsRes.value.ok
        ? await commentsRes.value.json().then((json) => (Array.isArray(json) ? json : json.data || []))
        : [];

    return { stories, categories, events, books, videos, comments };
  } catch (err) {
    console.error("Failed server-side data fetch for homepage", err);
    return { stories: [], categories: [], events: [], books: [], videos: [], comments: [] };
  }
}

export default async function Home() {
  const { stories, categories, events, books, videos, comments } = await getHomePageData();

  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero Section - Only shown for unauthenticated / guest users */}
      <AuthHeroWrapper />

      {/* Latest Stories Section */}
      <LatestStories stories={stories} />

      {/* Editor's Note Section */}
      <EditorsNote />

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
