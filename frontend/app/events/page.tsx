"use client";

import React, { useEffect, useState } from "react";
import EventsHero from "@/components/EventsHero";
import EventSessions, { SessionItem } from "@/components/EventSessions";
import WorkshopsSection, { WorkshopItem } from "@/components/WorkshopsSection";
import PastEventArchive, { PastEventItem } from "@/components/PastEventArchive";
import { API_BASE_URL } from "@/lib/config";

export default function EventsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [pastEvents, setPastEvents] = useState<PastEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const [readingRes, discussionRes, workshopRes, archiveRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events?type=READING_SESSION`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/events?type=DISCUSSION`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/events?type=WORKSHOP`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/events?type=PAST_ARCHIVE`).then((r) => (r.ok ? r.json() : [])),
      ]);

      const mappedSessions: SessionItem[] = [
        ...readingRes.map((e: any) => ({
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
        ...discussionRes.map((e: any) => ({
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

      const mappedWorkshops: WorkshopItem[] = workshopRes.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        time: e.time || "",
        day: e.day || "",
        monthYear: e.monthYear || "",
        imageSrc: e.imageSrc || "",
      }));

      const mappedPastEvents: PastEventItem[] = archiveRes.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        imageSrc: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
        href: e.registerHref || undefined,
      }));

      setSessions(mappedSessions);
      setWorkshops(mappedWorkshops);
      setPastEvents(mappedPastEvents);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllEvents();
  }, []);

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Event Sessions Section */}
      <EventSessions sessions={sessions} isLoading={loading} />

      {/* Workshops Section */}
      <WorkshopsSection workshops={workshops} isLoading={loading} />

      {/* Past Event Archive Section */}
      <PastEventArchive events={pastEvents} isLoading={loading} />
    </div>
  );
}
