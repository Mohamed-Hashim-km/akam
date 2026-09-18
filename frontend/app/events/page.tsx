import React from "react";
import type { Metadata } from "next";
import EventsHero from "@/components/EventsHero";
import EventSessions, { SessionItem } from "@/components/EventSessions";
import PastEventArchive, { PastEventItem } from "@/components/PastEventArchive";
import { API_BASE_URL } from "@/lib/config";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Literary Events & Workshops | Akam Digital",
  description:
    "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
  openGraph: {
    title: "Literary Events & Workshops | Akam Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
    images: [
      {
        url: "https://akamdigital.vercel.app/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "Akam Digital Events",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Literary Events & Workshops | Akam Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
    images: ["https://akamdigital.vercel.app/images/ogImage/ogImage.png"],
  },
};

/**
 * Parses event dates from day + monthYear strings (e.g., "18", "Oct 2026")
 * or from an ISO eventDate string.
 */
function parseEventDate(
  day?: string | null,
  monthYear?: string | null,
  eventDate?: string | Date | null
): Date | null {
  if (eventDate) {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) return d;
  }

  if (day && monthYear) {
    const parsed = new Date(`${day} ${monthYear}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/**
 * Returns true if the event takes place today or in the future.
 * Events are considered valid through the end of their event day (23:59:59.999).
 */
function isUpcomingEvent(
  day?: string | null,
  monthYear?: string | null,
  eventDate?: string | Date | null
): boolean {
  const d = parseEventDate(day, monthYear, eventDate);
  if (!d) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

/**
 * Comparator to sort events ascending by date (earliest upcoming event first).
 */
function compareEventsAsc(a: any, b: any): number {
  const dateA = parseEventDate(a.day, a.monthYear, a.eventDate);
  const dateB = parseEventDate(b.day, b.monthYear, b.eventDate);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.getTime() - dateB.getTime();
}

/**
 * Comparator to sort past events descending by date (most recent past event first).
 */
function compareEventsDesc(a: any, b: any): number {
  const dateA = parseEventDate(a.day, a.monthYear, a.eventDate);
  const dateB = parseEventDate(b.day, b.monthYear, b.eventDate);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB.getTime() - dateA.getTime();
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Maps a raw API event to a typed SessionItem. */
function mapSession<C extends string>(e: any, category: C) {
  return {
    id:           e.id,
    category,
    title:        e.title,
    description:  e.description,
    location:     e.location,
    time:         e.time        || "",
    day:          e.day         || "",
    monthYear:    e.monthYear   || "",
    imageSrc:     e.imageSrc    || undefined,
    registerHref: e.registerHref || undefined,
  };
}

// ─── data fetcher ─────────────────────────────────────────────────────────────

async function getEventsData(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      next: { tags: ["events"], revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[EventsPage] Failed to fetch events: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? [];
  } catch (err) {
    console.error("[EventsPage] Error fetching events:", err);
    return [];
  }
}

export default async function EventsPage() {
  const rawEvents = await getEventsData();

  // Filter for published events
  const publishedEvents = rawEvents.filter((e: any) => e.isPublished !== false);

  // 1. Upcoming events by category, sorted chronologically ascending
  const readingSessions = publishedEvents
    .filter((e: any) => e.type === "READING_SESSION" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const discussionSessions = publishedEvents
    .filter((e: any) => e.type === "DISCUSSION" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const workshopEvents = publishedEvents
    .filter((e: any) => e.type === "WORKSHOP" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const exhibitionEvents = publishedEvents
    .filter((e: any) => e.type === "EXHIBITION" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const filmScreeningEvents = publishedEvents
    .filter((e: any) => e.type === "FILM_SCREENING" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const sessions: SessionItem[] = [
    ...readingSessions.map((e: any)       => mapSession(e, "reading"       as const)),
    ...discussionSessions.map((e: any)    => mapSession(e, "discussions"   as const)),
    ...workshopEvents.map((e: any)        => mapSession(e, "workshop"      as const)),
    ...exhibitionEvents.map((e: any)      => mapSession(e, "exhibition"    as const)),
    ...filmScreeningEvents.map((e: any)   => mapSession(e, "film_screening" as const)),
  ];

  // 2. Past events archive: items marked as PAST_ARCHIVE or whose date has passed
  const pastEventsRaw = publishedEvents
    .filter((e: any) => {
      if (e.type === "PAST_ARCHIVE") return true;
      if (!isUpcomingEvent(e.day, e.monthYear, e.eventDate)) return true;
      return false;
    })
    .sort(compareEventsDesc);

  const pastEvents: PastEventItem[] = pastEventsRaw.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    imageSrc: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
    images: Array.isArray(e.images) && e.images.length > 0 ? e.images : (e.imageSrc ? [e.imageSrc] : []),
    href: e.registerHref || undefined,
    videoUrl: e.videoUrl || undefined,
  }));

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Unified Event Sessions Section (Reading, Discussions, Workshop, Exhibition, Film Screening) */}
      <EventSessions sessions={sessions} isLoading={false} />

      {/* Past Event Archive Section */}
      <PastEventArchive events={pastEvents} isLoading={false} />
    </div>
  );
}
