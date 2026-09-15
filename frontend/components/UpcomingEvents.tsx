"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";
import { API_BASE_URL } from "@/lib/config";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  imageSrc?: string;
  image?: string;
  imageUrl?: string;
  coverImage?: string;
  registerHref?: string;
  featured?: boolean;
  type?: string;
}

export interface UpcomingEventsProps {
  title?: string;
  viewAllHref?: string;
  events?: EventItem[];
}

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const serverUrl = API_BASE_URL.replace(/\/api$/, "");
    return `${serverUrl}${url}`;
  }
  return url;
}

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
    // fallback
  }
  return true;
};

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  title = "Upcoming Events",
  viewAllHref = "/events",
  events: initialEvents,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [fetchedEvents, setFetchedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(initialEvents === undefined);

  useEffect(() => {
    if (initialEvents === undefined) {
      const fetchEvents = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/events`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const upcomingOnly = data.filter((e: any) => {
                if (e.type === "PAST_ARCHIVE") return false;
                return isUpcomingDate(e.day, e.monthYear);
              });

              const mapped: EventItem[] = upcomingOnly.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                location: e.location,
                time: e.time || "",
                day: e.day || "",
                monthYear: e.monthYear || "",
                imageSrc: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
                image: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
                registerHref: e.registerHref || undefined,
                featured: e.type === "READING_SESSION",
                type: e.type,
              }));
              setFetchedEvents(mapped);
            }
          }
        } catch (err) {
          console.error("Failed to load upcoming events from backend:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }
  }, [initialEvents]);

  const displayEvents = initialEvents !== undefined ? initialEvents : fetchedEvents;

  if (loading) {
    return (
      <section className="relative w-full bg-[#EFF8FC] py-16 lg:py-24 font-poppins overflow-hidden">
        <div className="container px-6 mx-auto relative z-10 animate-pulse text-center">
          <div className="h-10 bg-gray-200/80 rounded-md w-60 mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl h-[420px] bg-gray-200/70" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayEvents || displayEvents.length === 0) return null;

  return (
    <section className="relative w-full bg-[#EFF8FC] py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        {/* Section Header - Centered Title */}
        <div className="text-center mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>
        </div>

        {/* Swiper Event Cards Carousel */}
        <div className="w-full overflow-hidden px-1">
          <Swiper
            modules={[Navigation]}
            onSwiper={setSwiperInstance}
            spaceBetween={20}
            slidesPerView={1.2}
            breakpoints={{
              640: { slidesPerView: 2.1, spaceBetween: 24 },
              1024: { slidesPerView: 3.2, spaceBetween: 28 },
              1280: { slidesPerView: 3.4, spaceBetween: 32 },
            }}
            className="upcoming-events-swiper w-full !pb-4 !overflow-visible"
          >
            {displayEvents.map((evt) => {
              const rawImg = evt.imageSrc || evt.image || evt.imageUrl || evt.coverImage;
              const bgImg = getImageUrl(rawImg) || "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop";

              return (
                <SwiperSlide key={evt.id} className="flex flex-col">
                  <Link
                    href={viewAllHref || "/events"}
                    className="group relative w-full h-[380px] sm:h-[420px] md:h-[450px] rounded-[26px] sm:rounded-[28px] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end"
                  >
                    {/* Event Background Image from Backend */}
                    <img
                      src={bgImg}
                      alt={evt.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Card Content Overlay */}
                    <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-end h-full">
                      {/* Event Title */}
                      <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug line-clamp-2 mb-4 group-hover:text-white/95 transition-colors">
                        {evt.title}
                      </h3>

                      {/* Footer: Date & Register Now Pill Button */}
                      <div className="flex items-end justify-between gap-3 pt-2">
                        {/* Date */}
                        <div className="flex flex-col">
                          <span className="text-3xl sm:text-4xl font-bold text-white leading-none tracking-tight">
                            {evt.day}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-white/80 mt-1">
                            {evt.monthYear}
                          </span>
                        </div>

                        {/* Register Now Pill */}
                        <div className="px-4 py-2 bg-white text-[#111827] rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md group-hover:bg-gray-100 transition-all shrink-0">
                          <span>Register Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Carousel Navigation Arrows (Centered Below Cards) */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:border-gray-800 hover:text-gray-900 transition-all focus:outline-none shadow-xs cursor-pointer"
            aria-label="Previous Event"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => swiperInstance?.slideNext()}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:border-gray-800 hover:text-gray-900 transition-all focus:outline-none shadow-xs cursor-pointer"
            aria-label="Next Event"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View All Events Button (Centered Below Arrows) */}
        <div className="flex justify-center mt-6">
          <Link href={viewAllHref}>
                 <Button
                          variant="primary"
                          size="md"
                          icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                          iconPosition="right"
                          className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
                        >
                        
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
