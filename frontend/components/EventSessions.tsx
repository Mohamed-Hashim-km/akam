"use client";

import React, { useState } from "react";
import { MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import EventRegisterModal from "@/components/EventRegisterModal";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

export interface SessionItem {
  id: string;
  category: "reading" | "discussions";
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  registerHref?: string;
}

export interface EventSessionsProps {
  sessions?: SessionItem[];
  isLoading?: boolean;
}

export const EventSessions: React.FC<EventSessionsProps> = ({
  sessions = [],
  isLoading = false,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeTab, setActiveTab] = useState<"reading" | "discussions">("reading");
  const [selectedEventForReg, setSelectedEventForReg] = useState<SessionItem | null>(null);

  const filteredSessions = sessions.filter((s) => s.category === activeTab);

  if (isLoading) {
    return (
      <section className="relative w-full bg-[#EEF7F2] py-14 sm:py-18 lg:py-22 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex justify-center mb-10">
            <div className="w-64 h-11 bg-white/70 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5  mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse min-h-[320px] flex flex-col justify-between">
                <div>
                  <div className="h-6 bg-gray-200/80 rounded-md w-3/4 mb-3" />
                  <div className="h-3.5 bg-gray-200/80 rounded-md w-full mb-2" />
                  <div className="h-3.5 bg-gray-200/80 rounded-md w-5/6 mb-5" />
                  <div className="h-3.5 bg-gray-200/80 rounded-md w-1/2 mb-2" />
                  <div className="h-3.5 bg-gray-200/80 rounded-md w-1/3" />
                </div>
                <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                  <div className="h-7 bg-gray-200/80 rounded-md w-14" />
                  <div className="h-8 bg-gray-200/80 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!sessions || sessions.length === 0) return null;

  return (
    <section className="relative w-full bg-[#EEF7F2] py-8 sm:py-12 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Centered Category Pill Switcher */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white p-1.5 rounded-full border border-gray-200/60 inline-flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setActiveTab("reading")}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "reading"
                  ? "bg-[#21B573] text-white shadow-xs"
                  : "text-gray-700 hover:text-gray-950"
              }`}
            >
              Reading Events
            </button>
            <button
              onClick={() => setActiveTab("discussions")}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "discussions"
                  ? "bg-[#21B573] text-white shadow-xs"
                  : "text-gray-700 hover:text-gray-950"
              }`}
            >
              Discussions
            </button>
          </div>
        </div>

        {/* Event Cards Swiper Carousel */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 bg-white/60 rounded-3xl max-w-xl mx-auto border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 font-poppins">
              No {activeTab === "reading" ? "reading sessions" : "discussions"} scheduled at this time.
            </p>
          </div>
        ) : (
          <div className="w-full relative">
            <Swiper
              key={activeTab}
              modules={[Navigation]}
              onSwiper={setSwiperInstance}
              spaceBetween={20}
              slidesPerView={1.15}
              breakpoints={{
                640: { slidesPerView: 1.4, spaceBetween: 20 },
                768: { slidesPerView: 2.0, spaceBetween: 24 },
                1024: { slidesPerView: 2.7, spaceBetween: 24 },
              }}
              className="w-full !pb-2 [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
            >
              {filteredSessions.map((item) => (
                <SwiperSlide key={item.id} className="flex flex-col">
                  <div className="bg-white rounded-3xl p-6 sm:p-7 flex-1 flex flex-col justify-between border border-gray-100 transition-all shadow-2xs hover:shadow-md h-full">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-semibold text-dark-text/ tracking-tight leading-snug font-poppins mb-2.5">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-md text-gray-400 font-normal leading-relaxed mb-5 font-poppins">
                          {item.description}
                        </p>
                      </div>

                      {/* Meta details (Location & Time) */}
                      <div className="space-y-1.5 text-sm text-gray-500 font-medium mt-auto font-poppins">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-dark-text/70 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-dark-text/70 shrink-0" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Divider & Registration Row */}
                    <div className="mt-5">
                      <div className="border-b border-gray-100 mb-5 w-full" />

                      <div className="flex items-center justify-between gap-2">
                        {/* Date */}
                        <div className="flex flex-col">
                          <span className="text-2xl sm:text-3xl font-semibold text-dark-text tracking-tight leading-none font-poppins">
                            {item.day}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal mt-1 font-poppins uppercase">
                            {item.monthYear}
                          </span>
                        </div>

                        {/* Register Button */}
                        <button
                          onClick={() => setSelectedEventForReg(item)}
                          className="bg-white border border-gray-300 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold text-gray-900 hover:bg-black hover:text-white hover:border-black flex items-center gap-1.5 transition-all group cursor-pointer shadow-2xs shrink-0"
                        >
                          <span>Register Now</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Bottom-Right Carousel Navigation Controls */}
            {filteredSessions.length > 1 && (
              <div className="flex items-center justify-end gap-3 mt-6 sm:mt-8 pr-1">
                <button
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all focus:outline-none cursor-pointer shadow-2xs"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => swiperInstance?.slideNext()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all focus:outline-none cursor-pointer shadow-2xs"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
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
