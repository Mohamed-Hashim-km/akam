import React from "react";
import type { Metadata } from "next";
import EventsHero from "@/components/EventsHero";
import EventSessions, { SessionItem } from "@/components/EventSessions";
import WorkshopsSection, { WorkshopItem } from "@/components/WorkshopsSection";
import PastEventArchive, { PastEventItem } from "@/components/PastEventArchive";
import { API_BASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Literary Events & Workshops | Akam Digital",
  description:
    "Explore upcoming reading sessions, author discussions, creative writing masterclasses, and past literary archives on Akam.",
  openGraph: {
    title: "Literary Events & Workshops | Akam Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, and past literary archives on Akam.",
    type: "website",
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
    const cleanedDay = day.trim();
    const cleanedMonthYear = monthYear.trim();
    const parsed = new Date(`${cleanedDay} ${cleanedMonthYear}`);
    if (!isNaN(parsed.getTime())) return parsed;

    const parsedAlt = new Date(`${cleanedMonthYear} ${cleanedDay}`);
    if (!isNaN(parsedAlt.getTime())) return parsedAlt;
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
  if (!d) return true; // If date cannot be parsed, keep it visible
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() >= Date.now();
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
  const dateA = parseEventDate(a.day, a.monthYear, a.eventDate) || (a.createdAt ? new Date(a.createdAt) : null);
  const dateB = parseEventDate(b.day, b.monthYear, b.eventDate) || (b.createdAt ? new Date(b.createdAt) : null);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB.getTime() - dateA.getTime();
}

async function getEventsData(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[EventsPage] Failed to fetch events: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  } catch (err) {
    console.error("[EventsPage] Error fetching events:", err);
    return [];
  }
}

export default async function EventsPage() {
  const rawEvents = await getEventsData();

  // Filter for published events
  const publishedEvents = rawEvents.filter((e: any) => e.isPublished !== false);

  // 1. Upcoming reading and discussion sessions, sorted chronologically ascending
  const readingSessions = publishedEvents
    .filter((e: any) => e.type === "READING_SESSION" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const discussionSessions = publishedEvents
    .filter((e: any) => e.type === "DISCUSSION" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const sessions: SessionItem[] = [
    ...readingSessions.map((e: any) => ({
      id: e.id,
      category: "reading" as const,
      title: e.title,
      description: e.description,
      location: e.location,
      time: e.time || "",
      day: e.day || "",
      monthYear: e.monthYear || "",
      registerHref: e.registerHref || undefined,
    })),
    ...discussionSessions.map((e: any) => ({
      id: e.id,
      category: "discussions" as const,
      title: e.title,
      description: e.description,
      location: e.location,
      time: e.time || "",
      day: e.day || "",
      monthYear: e.monthYear || "",
      registerHref: e.registerHref || undefined,
    })),
  ];

  // 2. Upcoming workshops, sorted chronologically ascending
  const upcomingWorkshops = publishedEvents
    .filter((e: any) => e.type === "WORKSHOP" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
    .sort(compareEventsAsc);

  const workshops: WorkshopItem[] = upcomingWorkshops.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    time: e.time || "",
    day: e.day || "",
    monthYear: e.monthYear || "",
    imageSrc: e.imageSrc || "",
  }));

  // 3. Past events archive: items marked as PAST_ARCHIVE or whose date has passed
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
    href: e.registerHref || undefined,
    videoUrl: e.videoUrl || undefined,
  }));

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Event Sessions Section */}
      <EventSessions sessions={sessions} isLoading={false} />

      {/* Workshops Section */}
      <WorkshopsSection workshops={workshops} isLoading={false} />

      {/* Past Event Archive Section */}
      <PastEventArchive events={pastEvents} isLoading={false} />
    </div>
  );
}
