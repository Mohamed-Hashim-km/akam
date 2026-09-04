"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";
import { API_BASE_URL } from "@/lib/config";
import EventRegisterModal from "@/components/EventRegisterModal";

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
  registerHref?: string;
  featured?: boolean;
  type?: string;
}

export interface UpcomingEventsProps {
  title?: string;
  viewAllHref?: string;
  events?: EventItem[];
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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [fetchedEvents, setFetchedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialEvents);
  const [selectedEventForReg, setSelectedEventForReg] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!initialEvents || initialEvents.length === 0) {
      const fetchEvents = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/events`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              // Filter out PAST_ARCHIVE and events whose date has passed
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
                registerHref: e.registerHref || undefined,
                featured: e.type === "READING_SESSION",
                type: e.type,
              }));
              setFetchedEvents(mapped);
            }
          }
        } catch (err) {
          console.error("Failed to load upcoming events:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }
  }, [initialEvents]);

  const displayEvents = initialEvents && initialEvents.length > 0
    ? initialEvents
    : fetchedEvents;

  if (loading) {
    return (
      <section className="relative w-full bg-[#F9F9F9] py-16 lg:py-24 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10 animate-pulse">
          <div className="h-10 bg-gray-200/80 rounded-md w-60 mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl p-7 min-h-[440px] bg-gray-200/60 flex flex-col justify-between" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayEvents.length === 0) return null;

  return (
    <section className="relative w-full bg-[#F9F9F9] py-16 lg:py-24 font-poppins overflow-hidden">
      {/* Background Decorative Ambient Circles */}
   
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
            {title}
          </h2>

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

        {/* Swiper Event Cards Carousel */}
        <div className="w-full overflow-visible">
          <Swiper
            modules={[Navigation]}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.5, spaceBetween: 24 },
              768: { slidesPerView: 2.2, spaceBetween: 28 },
              1024: { slidesPerView: 3, spaceBetween: 32 },
            }}
            className="w-full !pb-4 !overflow-visible [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
          >
            {displayEvents.map((evt) => (
              <SwiperSlide key={evt.id} className="flex flex-col">
                <div className="rounded-3xl p-7 lg:p-8 flex-1 flex flex-col justify-between transition-all duration-300 group shadow-xs hover:shadow-xl cursor-pointer bg-[#F5F0FC] text-dark-bg hover:bg-[#8122DB] hover:text-white">
                  {/* Top Content: Title + Description */}
                  <div className="flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-4 transition-colors">
                      {evt.title}
                    </h3>

                    <p className="text-sm sm:text-base font-normal leading-relaxed mb-6 transition-colors text-dark-bg/75 group-hover:text-white/85">
                      {evt.description}
                    </p>
                  </div>

                  {/* Middle Info: Location & Time */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 shrink-0 opacity-80" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 shrink-0 opacity-80" />
                      <span>{evt.time}</span>
                    </div>
                  </div>
</div>
                  {/* Bottom Footer: Date & Register Button */}
                  <div className="pt-6 flex items-center justify-between border-t border-black/10 group-hover:border-white/20 transition-colors">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-medium tracking-tight">
                        {evt.day}
                      </span>
                      <span className="text-xs sm:text-sm font-medium transition-colors text-dark-bg/70 group-hover:text-white/80">
                        {evt.monthYear}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedEventForReg(evt)}
                      icon={<ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />}
                      iconPosition="right"
                      className="group/btn text-sm font-medium shadow-xs bg-white text-dark-bg hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      Register Now
                    </Button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Bottom Swiper Navigation Arrows (Only show if > 1 event) */}
        {displayEvents.length > 1 && (
          <div className="flex items-center justify-end gap-3 pt-6">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            className="w-11 h-11 rounded-full border border-black/20 bg-white flex items-center justify-center text-dark-bg hover:bg-black/5 transition-all focus:outline-none"
            aria-label="Previous Event"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => swiperInstance?.slideNext()}
            className="w-11 h-11 rounded-full border border-black/20 bg-white flex items-center justify-center text-dark-bg hover:bg-black/5 transition-all focus:outline-none"
            aria-label="Next Event"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        )}
      </div>

      {/* Registration Modal */}
      {selectedEventForReg && (
        <EventRegisterModal
          isOpen={!!selectedEventForReg}
          onClose={() => setSelectedEventForReg(null)}
          event={selectedEventForReg}
        />
      )}
    </section>
  );
};

export default UpcomingEvents;
