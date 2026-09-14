"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import EventRegisterModal from "@/components/EventRegisterModal";

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

const CATEGORY_TABS: { id: SessionItem["category"]; label: string }[] = [
  { id: "reading", label: "Reading Events" },
  { id: "discussions", label: "Discussions" },
  { id: "workshop", label: "Workshop" },
  { id: "exhibition", label: "Exhibition" },
  { id: "film_screening", label: "Film Screening" },
];

export const EventSessions: React.FC<EventSessionsProps> = ({
  sessions = [],
  isLoading = false,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeTab, setActiveTab] = useState<SessionItem["category"]>("reading");
  const [selectedEventForReg, setSelectedEventForReg] = useState<SessionItem | null>(null);

  const displaySessions = sessions.filter((s) => s.category === activeTab);

  if (isLoading) {
    return (
      <section className="relative w-full bg-[#E6F4FB] py-14 sm:py-18 lg:py-22 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex justify-center mb-10">
            <div className="w-80 h-12 bg-white/70 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/80 rounded-[28px] p-6 border border-gray-100 animate-pulse h-[400px] flex flex-col justify-end"
              >
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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

        {/* Event Cards Swiper Carousel or Empty State */}
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
                  const coverImg =
                    item.imageSrc ||
                    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800";

                  return (
                    <SwiperSlide key={item.id} className="flex flex-col">
                      {/* Visual Image Cover Card matching Mockup */}
                      <div className="relative h-[380px] sm:h-[420px] rounded-[28px] overflow-hidden flex flex-col justify-end p-6 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 group border border-white/20">
                        {/* Background Image */}
                        <Image
                          src={coverImg}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          unoptimized
                        />

                        {/* Dark Gradient Overlay for optimal text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 z-10" />

                        {/* Card Content Overlay */}
                        <div className="relative z-20 flex flex-col justify-end h-full">
                          {/* Title */}
                          <h3 className="text-white font-bold text-lg sm:text-xl leading-snug font-poppins mb-4 line-clamp-2 group-hover:text-sky-200 transition-colors">
                            {item.title}
                          </h3>

                          {/* Bottom Date & Action Row */}
                          <div className="flex items-center justify-between gap-3 pt-2">
                            {/* Date Block */}
                            <div className="flex flex-col">
                              <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-poppins tracking-tight">
                                {item.day || "22"}
                              </span>
                              <span className="text-[11px] font-medium text-white/80 uppercase font-poppins mt-1 tracking-wider">
                                {item.monthYear || "Aug 2026"}
                              </span>
                            </div>

                            {/* Register Button */}
                            <button
                              onClick={() => setSelectedEventForReg(item)}
                              className="bg-white hover:bg-white/95 text-gray-950 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
                            >
                              <span>Register Now</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Bottom-Right Carousel Navigation Arrows */}
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
            <div className="w-full py-14 flex flex-col items-center justify-center text-center  p-8 ">
            
            </div>
          )}
        </div>
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
