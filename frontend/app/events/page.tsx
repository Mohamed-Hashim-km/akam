import React from "react";
import type { Metadata } from "next";
import EventsHero from "@/components/EventsHero";
import EventSessions from "@/components/EventSessions";
import PastEventArchive from "@/components/PastEventArchive";

// ISR: revalidate every 60 seconds (only for metadata / hero shell)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Literary Events & Workshops | AKAM Digital",
  description:
    "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on AKAM Digital.",
  alternates: {
    canonical: "https://akamdigital.in/events",
  },
  openGraph: {
    title: "Literary Events & Workshops | AKAM Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on AKAM Digital.",
    url: "https://akamdigital.in/events",
    siteName: "AKAM Digital",
    images: [
      {
        url: "/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "AKAM Digital Events",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Literary Events & Workshops | AKAM Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on AKAM Digital.",
    images: ["/images/ogImage/ogImage.png"],
  },
};

import { API_BASE_URL } from "@/lib/config";
import type { SessionItem } from "@/components/EventSessions";
import type { PastEventItem } from "@/components/PastEventArchive";

const FETCH_OPTS = (tags: string[]) => ({
  next: { tags: ["events", ...tags], revalidate: 60 },
  signal: AbortSignal.timeout(8000),
});

const API_TYPE_TO_CATEGORY: Record<string, SessionItem["category"]> = {
  READING_SESSION: "reading",
  DISCUSSION: "discussions",
  WORKSHOP: "workshop",
  EXHIBITION: "exhibition",
  FILM_SCREENING: "film_screening",
  OTHER: "other",
};

function isUpcomingEvent(day?: string | null, monthYear?: string | null, eventDate?: string | null): boolean {
  if (eventDate) {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }
  }
  if (day && monthYear) {
    const parts = day.split(/[-–—]|to/i).map((s) => s.trim());
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/\d+/);
    if (match) {
      const d = new Date(`${match[0]} ${monthYear}`);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        return d >= new Date();
      }
    }
    const d = new Date(`${day} ${monthYear}`);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      return d >= new Date();
    }
  }
  return true;
}

function compareEventsAsc(a: any, b: any): number {
  const parse = (e: any) => {
    if (e.eventDate) { const d = new Date(e.eventDate); if (!isNaN(d.getTime())) return d; }
    if (e.day && e.monthYear) {
      const parts = e.day.split(/[-–—]|to/i).map((s: string) => s.trim());
      const firstNum = parts[0]?.match(/\d+/);
      if (firstNum) {
        const d = new Date(`${firstNum[0]} ${e.monthYear}`);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(`${e.day} ${e.monthYear}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };
  const da = parse(a); const db = parse(b);
  if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
  return da.getTime() - db.getTime();
}

function mapToSession(e: any): SessionItem {
  const category = (e.type && API_TYPE_TO_CATEGORY[e.type]) ? API_TYPE_TO_CATEGORY[e.type] : "all";
  const imageSrc = e.imageSrc || (Array.isArray(e.images) && e.images.length > 0 ? e.images[0] : undefined);
  return {
    id: e.id,
    category,
    title: e.title,
    description: e.description,
    location: e.location,
    time: e.time || "",
    day: e.day || "",
    monthYear: e.monthYear || "",
    imageSrc: imageSrc || undefined,
    registerHref: e.registerHref || undefined,
    isPaid: Boolean(e.isPaid),
    price: e.price !== undefined ? Number(e.price) : 0,
  };
}

function mapRawToPastEvent(e: any): PastEventItem {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    imageSrc: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
    images: Array.isArray(e.images) && e.images.length > 0 ? e.images : (e.imageSrc ? [e.imageSrc] : []),
    href: e.registerHref || undefined,
    videoUrl: e.videoUrl || undefined,
  };
}

async function getEventsPageData() {
  const [upcomingRes, pastRes] = await Promise.allSettled([
    fetch(`${API_BASE_URL}/events?page=1&limit=6&upcoming=true`, FETCH_OPTS(["events"])),
    fetch(`${API_BASE_URL}/events/past-archives?page=1&limit=6`, FETCH_OPTS(["events"])),
  ]);

  let upcomingSessions: SessionItem[] = [];
  let upcomingHasMore = false;
  if (upcomingRes.status === "fulfilled" && upcomingRes.value.ok) {
    try {
      const json = await upcomingRes.value.json();
      const raw: any[] = json.data ?? (Array.isArray(json) ? json : []);
      upcomingSessions = raw
        .filter((e) => e.isPublished !== false && e.type !== "PAST_ARCHIVE" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
        .sort(compareEventsAsc)
        .map(mapToSession);
      upcomingHasMore = json.meta?.hasMore ?? (raw.length >= 6);
    } catch (e) {
      console.error("[EventsPage] Failed to parse upcoming events:", e);
    }
  }

  let pastEvents: PastEventItem[] = [];
  let pastHasMore = false;
  if (pastRes.status === "fulfilled" && pastRes.value.ok) {
    try {
      const json = await pastRes.value.json();
      const raw: any[] = json.data ?? (Array.isArray(json) ? json : []);
      pastEvents = raw.map(mapRawToPastEvent);
      pastHasMore = json.meta?.hasMore ?? (raw.length >= 6);
    } catch (e) {
      console.error("[EventsPage] Failed to parse past events:", e);
    }
  }

  return { upcomingSessions, upcomingHasMore, pastEvents, pastHasMore };
}

export default async function EventsPage() {
  const { upcomingSessions, upcomingHasMore, pastEvents, pastHasMore } = await getEventsPageData();

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Unified Event Sessions Section - pre-rendered with ISR */}
      <EventSessions
        sessions={upcomingSessions.length > 0 ? upcomingSessions : undefined}
        initialHasMore={upcomingHasMore}
      />

      {/* Past Event Archive Section - pre-rendered with ISR */}
      <PastEventArchive
        events={pastEvents.length > 0 ? pastEvents : undefined}
        initialHasMore={pastHasMore}
      />
    </div>
  );
}
