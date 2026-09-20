"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import EventRegisterModal from "@/components/EventRegisterModal";
import { API_BASE_URL } from "@/lib/config";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

export interface SessionItem {
  id: string;
  category: "reading" | "discussions" | "workshop" | "exhibition" | "film_screening";
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  imageSrc?: string;
  registerHref?: string;
}

export interface EventSessionsProps {
  sessions?: SessionItem[];
  isLoading?: boolean;
}

// Tab → backend EventType mapping
const CATEGORY_TABS: { id: SessionItem["category"]; label: string; apiType: string }[] = [
  { id: "reading",       label: "Reading Events",  apiType: "READING_SESSION" },
  { id: "discussions",   label: "Discussions",     apiType: "DISCUSSION" },
  { id: "workshop",      label: "Workshop",        apiType: "WORKSHOP" },
  { id: "exhibition",    label: "Exhibition",      apiType: "EXHIBITION" },
  { id: "film_screening",label: "Film Screening",  apiType: "FILM_SCREENING" },
];

// Keep only events that are today or in the future
function isUpcomingEvent(day?: string | null, monthYear?: string | null, eventDate?: string | null): boolean {
  if (eventDate) {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }
  }
  if (day && monthYear) {
    const d = new Date(`${day} ${monthYear}`);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      return d >= new Date();
    }
  }
  return true; // no date info → show it
}

function compareEventsAsc(a: any, b: any): number {
  const parse = (e: any) => {
    if (e.eventDate) { const d = new Date(e.eventDate); if (!isNaN(d.getTime())) return d; }
    if (e.day && e.monthYear) { const d = new Date(`${e.day} ${e.monthYear}`); if (!isNaN(d.getTime())) return d; }
    return null;
  };
  const da = parse(a); const db = parse(b);
  if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
  return da.getTime() - db.getTime();
}

function mapToSession(e: any, category: SessionItem["category"]): SessionItem {
  return {
    id: e.id, category,
    title: e.title, description: e.description, location: e.location,
    time: e.time || "", day: e.day || "", monthYear: e.monthYear || "",
    imageSrc: e.imageSrc || undefined,
    registerHref: e.registerHref || undefined,
  };
}

export const EventSessions: React.FC<EventSessionsProps> = ({
  sessions: initialSessions,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeTab, setActiveTab] = useState<SessionItem["category"]>("reading");
  const [selectedEventForReg, setSelectedEventForReg] = useState<SessionItem | null>(null);

  // Per-tab cache — avoids re-fetching the same tab twice in a session
  const [tabCache, setTabCache] = useState<Partial<Record<SessionItem["category"], SessionItem[]>>>({});
  const [tabLoading, setTabLoading] = useState(false);
  const [displaySessions, setDisplaySessions] = useState<SessionItem[]>([]);

  // ── server-side fetch per tab ──────────────────────────────────────────────
  const fetchTab = useCallback(async (tab: SessionItem["category"]) => {
    // Use initialSessions prop path if provided (SSR-seed mode)
    if (initialSessions !== undefined) return;

    // Serve from cache first
    if (tabCache[tab] !== undefined) {
      setDisplaySessions(tabCache[tab]!);
      return;
    }

    const apiType = CATEGORY_TABS.find((t) => t.id === tab)?.apiType;
    if (!apiType) return;

    setTabLoading(true);
    try {
      // Server filters by type — exactly like editorial does with ?type=X
      const res = await fetch(`${API_BASE_URL}/events?type=${apiType}`);
      if (!res.ok) return;
      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : json.data ?? [];

      const mapped = raw
        .filter((e) => e.isPublished !== false && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
        .sort(compareEventsAsc)
        .map((e) => mapToSession(e, tab));

      setTabCache((prev) => ({ ...prev, [tab]: mapped }));
      setDisplaySessions(mapped);
    } catch (err) {
      console.error("EventSessions: failed to fetch type", apiType, err);
    } finally {
      setTabLoading(false);
    }
  }, [initialSessions, tabCache]);

  // Fetch on mount and tab change
  useEffect(() => {
    if (initialSessions !== undefined) {
      // Props-provided path (if ever called with SSR data)
      setDisplaySessions(initialSessions.filter((s) => s.category === activeTab));
      return;
    }
    fetchTab(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: SessionItem["category"]) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSwiperInstance(null);
  };

  // ── initial skeleton (first ever load) ────────────────────────────────────
  const isInitialLoad = tabLoading && displaySessions.length === 0 && !tabCache[activeTab];

  if (isInitialLoad) {
    return (
      <section className="relative w-full bg-[#E6F4FB] py-14 sm:py-18 lg:py-22 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex justify-center mb-10">
            <div className="w-80 h-12 bg-white/70 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 rounded-[28px] p-6 border border-gray-100 animate-pulse h-[400px] flex flex-col justify-end">
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-[#E6F4FB] py-10 sm:py-16 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Centered Category Pill Filter Tabs */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="bg-white/90 backdrop-blur-xs p-1.5 rounded-full border border-gray-200/60 inline-flex items-center gap-1 sm:gap-1.5 shadow-sm flex-wrap justify-center">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={tabLoading}
                  className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                    isActive
                      ? "bg-[#4EB2E4] text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-950 hover:bg-gray-100/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-tab loading spinner */}
        {tabLoading ? (
          <div className="w-full py-16 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Loading events…</span>
          </div>
        ) : (
          /* Event Cards Swiper Carousel or Empty State */
          <div className="w-full relative">
            {displaySessions.length > 0 ? (
              <>
                <Swiper
                  key={activeTab}
                  modules={[Navigation]}
                  onSwiper={setSwiperInstance}
                  spaceBetween={20}
                  slidesPerView={1.15}
                  breakpoints={{
                    640: { slidesPerView: 1.4, spaceBetween: 24 },
                    768: { slidesPerView: 2.1, spaceBetween: 24 },
                    1024: { slidesPerView: 2.7, spaceBetween: 24 },
                    1280: { slidesPerView: 3.1, spaceBetween: 24 },
                  }}
                  className="w-full !pb-4 [&_.swiper-wrapper]:!items-stretch"
                >
                  {displaySessions.map((item) => {
                    return (
                      <SwiperSlide key={item.id} className="flex flex-col">
                        <div className="relative h-[380px] sm:h-[420px] rounded-[28px] overflow-hidden flex flex-col justify-end p-6 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 group border border-white/20 bg-gray-800">
                          {/* Background Image — only if imageSrc exists */}
                          {item.imageSrc && (
                            <Image
                              src={item.imageSrc}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              unoptimized
                            />
                          )}
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 z-10" />
                          {/* Card Content */}
                          <div className="relative z-20 flex flex-col justify-end h-full">
                            <h3 className="text-white font-bold text-lg sm:text-xl leading-snug font-poppins mb-4 line-clamp-2 group-hover:text-sky-200 transition-colors">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between gap-3 pt-2">
                              <div className="flex flex-col">
                                {item.day && (
                                  <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-poppins tracking-tight">
                                    {item.day}
                                  </span>
                                )}
                                {item.monthYear && (
                                  <span className="text-[11px] font-medium text-white/80 uppercase font-poppins mt-1 tracking-wider">
                                    {item.monthYear}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedEventForReg(item)}
                                className="bg-white hover:bg-white/95 text-gray-950 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
                              >
                                <span>Register Now</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>

                {/* Carousel Nav Arrows */}
                <div className="flex items-center justify-end gap-3 mt-6 sm:mt-8 pr-1">
                  <button
                    onClick={() => swiperInstance?.slidePrev()}
                    className="w-10 h-10 rounded-full border border-gray-400/40 bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:bg-white hover:text-black transition-all focus:outline-none cursor-pointer shadow-2xs"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => swiperInstance?.slideNext()}
                    className="w-10 h-10 rounded-full border border-gray-400/40 bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:bg-white hover:text-black transition-all focus:outline-none cursor-pointer shadow-2xs"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full py-14 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                <p className="text-sm font-medium">No upcoming {CATEGORY_TABS.find(t => t.id === activeTab)?.label.toLowerCase()} at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <EventRegisterModal
        isOpen={!!selectedEventForReg}
        onClose={() => setSelectedEventForReg(null)}
        event={selectedEventForReg}
      />
    </section>
  );
};

export default EventSessions;
