"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";

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
}

export interface UpcomingEventsProps {
  title?: string;
  viewAllHref?: string;
  events?: EventItem[];
}

const defaultEvents: EventItem[] = [
  {
    id: "1",
    title: "Monsoon Poetry Symposium 2026",
    description:
      "A live round-table conversation with leading critics and authors exploring narrative shifts, contemporary themes, and language in Malayalam literature.",
    location: "Kochi Cultural Center & Online Stream",
    time: "10:49 am",
    day: "22",
    monthYear: "Aug 2026",
    featured: true,
  },
  {
    id: "2",
    title: "Monsoon Poetry Symposium 2026",
    description:
      "A live round-table conversation with leading critics and authors exploring narrative shifts, contemporary themes, and language in Malayalam literature.",
    location: "Kochi Cultural Center & Online Stream",
    time: "10:49 am",
    day: "28",
    monthYear: "Aug 2026",
    featured: false,
  },
  {
    id: "3",
    title: "Monsoon Poetry Symposium 2026",
    description:
      "A live round-table conversation with leading critics and authors exploring narrative shifts, contemporary themes, and language in Malayalam literature.",
    location: "Kochi Cultural Center & Online Stream",
    time: "10:49 am",
    day: "29",
    monthYear: "Aug 2026",
    featured: false,
  },
  {
    id: "4",
    title: "Digital Malayalam Publishing Summit",
    description:
      "Exploring modern journalism, digital publishing trends, and creator monetization strategies for Malayalam media.",
    location: "Trivandrum International Center",
    time: "02:30 pm",
    day: "05",
    monthYear: "Sep 2026",
    featured: false,
  },
  {
    id: "5",
    title: "Short Story Writers Masterclass",
    description:
      "Hands-on masterclass with renowned authors focusing on character development, pacing, and dialogue framing.",
    location: "Calicut Town Hall & Zoom Stream",
    time: "11:00 am",
    day: "14",
    monthYear: "Sep 2026",
    featured: false,
  },
];

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  title = "Upcoming Events",
  viewAllHref = "#events",
  events = defaultEvents,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

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
              className="group px-6 py-2.5 text-sm font-medium shadow-xs"
            >
              View All Events
            </Button>
          </Link>
        </div>

        {/* Swiper Event Cards Carousel (Starts at exact same left alignment as title) */}
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
            className="w-full !pb-4 !overflow-visible"
          >
            {events.map((evt) => (
              <SwiperSlide key={evt.id} className="h-auto">
                <div className="rounded-3xl p-7 lg:p-8 flex flex-col justify-between h-full min-h-[440px] transition-all duration-300 group shadow-xs hover:shadow-xl cursor-pointer bg-[#F5F0FC] text-dark-bg hover:bg-[#8122DB] hover:text-white">
                  {/* Top Content: Title + Description */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-semibold  tracking-tight leading-tight mb-4 transition-colors">
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

                    <Link href={evt.registerHref || `#register-${evt.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />}
                        iconPosition="right"
                        className="group/btn text-sm font-medium shadow-xs bg-white text-dark-bg  hover:shadow-md transition-all duration-300"
                      >
                        Register Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Bottom Swiper Navigation Arrows */}
        <div className="flex items-center gap-3 pt-6">
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
      </div>

    </section>
  );
};

export default UpcomingEvents;
