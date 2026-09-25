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
  category: "all" | "reading" | "discussions" | "workshop" | "exhibition" | "film_screening" | "other";
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
const CATEGORY_TABS: { id: SessionItem["category"]; label: string; apiType?: string }[] = [
  { id: "all",            label: "All Events",      apiType: "" },
  { id: "reading",        label: "Reading Events",  apiType: "READING_SESSION" },
  { id: "discussions",    label: "Discussions",     apiType: "DISCUSSION" },
  { id: "workshop",       label: "Workshop",        apiType: "WORKSHOP" },
  { id: "exhibition",     label: "Exhibition",      apiType: "EXHIBITION" },
  { id: "film_screening", label: "Film Screening",  apiType: "FILM_SCREENING" },
  { id: "other",          label: "Other Events",    apiType: "OTHER" },
];

const API_TYPE_TO_CATEGORY: Record<string, SessionItem["category"]> = {
  READING_SESSION: "reading",
  DISCUSSION: "discussions",
  WORKSHOP: "workshop",
  EXHIBITION: "exhibition",
  FILM_SCREENING: "film_screening",
  OTHER: "other",
};

const CATEGORY_LABELS: Record<string, string> = {
  reading: "Reading Event",
  discussions: "Discussion",
  workshop: "Workshop",
  exhibition: "Exhibition",
  film_screening: "Film Screening",
  other: "Other Event",
};

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const serverUrl = API_BASE_URL.replace(/\/api$/, "");
    return `${serverUrl}${url}`;
  }
  return url;
}

// Keep only events that are today or in the future (supports single day and multi-day range)
function isUpcomingEvent(day?: string | null, monthYear?: string | null, eventDate?: string | null): boolean {
  if (eventDate) {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }
  }
  if (day && monthYear) {
    // If day is a range like "12 – 15" or "28 Oct – 02 Nov", extract the end part to see if event is still active
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
  return true; // no date info → show it
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

function mapToSession(e: any, fallbackCategory: SessionItem["category"]): SessionItem {
  const category = (e.type && API_TYPE_TO_CATEGORY[e.type]) ? API_TYPE_TO_CATEGORY[e.type] : fallbackCategory;
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
  };
}

const PAGE_LIMIT = 6;

export const EventSessions: React.FC<EventSessionsProps> = ({
  sessions: initialSessions,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeTab, setActiveTab] = useState<SessionItem["category"]>("all");
  const [selectedEventForReg, setSelectedEventForReg] = useState<SessionItem | null>(null);

  // Per-tab cache & pagination state
  const [tabCache, setTabCache] = useState<Partial<Record<SessionItem["category"], SessionItem[]>>>({});
  const [tabPages, setTabPages] = useState<Partial<Record<SessionItem["category"], number>>>({});
  const [tabHasMore, setTabHasMore] = useState<Partial<Record<SessionItem["category"], boolean>>>({});
  const [tabLoading, setTabLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displaySessions, setDisplaySessions] = useState<SessionItem[]>([]);

  // ── server-side initial fetch per tab (Page 1) ──────────────────────────────
  const fetchTab = useCallback(async (tab: SessionItem["category"]) => {
    // Use initialSessions prop path if provided (SSR-seed mode)
    if (initialSessions !== undefined) return;

    // Serve from cache first
    if (tabCache[tab] !== undefined) {
      setDisplaySessions(tabCache[tab]!);
      return;
    }

    const tabConfig = CATEGORY_TABS.find((t) => t.id === tab);
    if (!tabConfig) return;

    setTabLoading(true);
    try {
      const typeQuery = tabConfig.apiType ? `type=${tabConfig.apiType}&` : "";
      const url = `${API_BASE_URL}/events?${typeQuery}page=1&limit=${PAGE_LIMIT}&upcoming=true`;

      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const raw: any[] = json.data ?? (Array.isArray(json) ? json : []);
      const meta = json.meta;

      const mapped = raw
        .filter((e) => e.isPublished !== false && e.type !== "PAST_ARCHIVE" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
        .sort(compareEventsAsc)
        .map((e) => mapToSession(e, tab));

      setTabCache((prev) => ({ ...prev, [tab]: mapped }));
      setTabPages((prev) => ({ ...prev, [tab]: 1 }));
      setTabHasMore((prev) => ({
        ...prev,
        [tab]: meta ? Boolean(meta.hasMore) : raw.length >= PAGE_LIMIT,
      }));
      setDisplaySessions(mapped);
    } catch (err) {
      console.error("EventSessions: failed to fetch tab", tabConfig.id, err);
    } finally {
      setTabLoading(false);
    }
  }, [initialSessions, tabCache]);

  // ── server-side load more (Infinite Carousel Pagination) ────────────────────
  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || tabLoading || initialSessions !== undefined) return;
    const hasMore = tabHasMore[activeTab];
    if (!hasMore) return;

    const currentPage = tabPages[activeTab] || 1;
    const nextPage = currentPage + 1;
    const tabConfig = CATEGORY_TABS.find((t) => t.id === activeTab);
    if (!tabConfig) return;

    setIsLoadingMore(true);
    try {
      const typeQuery = tabConfig.apiType ? `type=${tabConfig.apiType}&` : "";
      const url = `${API_BASE_URL}/events?${typeQuery}page=${nextPage}&limit=${PAGE_LIMIT}&upcoming=true`;

      const res = await fetch(url);
      if (!res.ok) {
        setTabHasMore((prev) => ({ ...prev, [activeTab]: false }));
        return;
      }
      const json = await res.json();
      const raw: any[] = json.data ?? (Array.isArray(json) ? json : []);
      const meta = json.meta;

      if (raw.length > 0) {
        const newMapped = raw
          .filter((e) => e.isPublished !== false && e.type !== "PAST_ARCHIVE" && isUpcomingEvent(e.day, e.monthYear, e.eventDate))
          .sort(compareEventsAsc)
          .map((e) => mapToSession(e, activeTab));

        setDisplaySessions((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const unique = newMapped.filter((i) => !existingIds.has(i.id));
          const combined = [...prev, ...unique];
          setTabCache((c) => ({ ...c, [activeTab]: combined }));
          return combined;
        });

        setTabPages((prev) => ({ ...prev, [activeTab]: nextPage }));
        setTabHasMore((prev) => ({
          ...prev,
          [activeTab]: meta ? Boolean(meta.hasMore) : raw.length >= PAGE_LIMIT,
        }));
      } else {
        setTabHasMore((prev) => ({ ...prev, [activeTab]: false }));
      }
    } catch (err) {
      console.error("EventSessions: failed to load next page", err);
      setTabHasMore((prev) => ({ ...prev, [activeTab]: false }));
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, isLoadingMore, tabLoading, tabHasMore, tabPages, initialSessions]);

  // Keep swiper instance updated when slides change
  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.update();
    }
  }, [displaySessions.length, swiperInstance]);

  // Fetch on mount and tab change
  useEffect(() => {
    if (initialSessions !== undefined) {
      // Props-provided path (if ever called with SSR data)
      setDisplaySessions(
        activeTab === "all"
          ? initialSessions
          : initialSessions.filter((s) => s.category === activeTab)
      );
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
                  onSlideChange={(swiper) => {
                    // If user is within 2 slides of the end, prefetch next page
                    if (tabHasMore[activeTab] && !isLoadingMore && swiper.activeIndex >= displaySessions.length - 2) {
                      loadNextPage();
                    }
                  }}
                  onReachEnd={() => {
                    if (tabHasMore[activeTab] && !isLoadingMore) {
                      loadNextPage();
                    }
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
                              src={getImageUrl(item.imageSrc)}
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

                  {/* Loading slide for next page */}
                  {isLoadingMore && (
                    <SwiperSlide key="loading-slide" className="flex flex-col">
                      <div className="relative h-[380px] sm:h-[420px] rounded-[28px] overflow-hidden flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-xs border border-white/50 shadow-sm animate-pulse">
                        <Loader2 className="w-8 h-8 text-[#4EB2E4] animate-spin mb-3" />
                        <span className="text-xs font-semibold text-gray-600">Loading more events…</span>
                      </div>
                    </SwiperSlide>
                  )}
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
                    onClick={() => {
                      if (swiperInstance) {
                        if (swiperInstance.isEnd && tabHasMore[activeTab] && !isLoadingMore) {
                          loadNextPage();
                        } else {
                          swiperInstance.slideNext();
                        }
                      }
                    }}
                    disabled={isLoadingMore}
                    className="w-10 h-10 rounded-full border border-gray-400/40 bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:bg-white hover:text-black transition-all focus:outline-none cursor-pointer shadow-2xs disabled:opacity-60"
                    aria-label="Next slide"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#4EB2E4]" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full py-14 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                <p className="text-sm font-medium">
                  {activeTab === "all"
                    ? "No upcoming events at the moment."
                    : `No upcoming ${CATEGORY_TABS.find((t) => t.id === activeTab)?.label.toLowerCase() || "events"} at the moment.`}
                </p>
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
