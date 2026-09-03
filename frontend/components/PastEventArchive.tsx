"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL } from "@/lib/config";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const serverUrl = API_BASE_URL.replace(/\/api$/, "");
    return `${serverUrl}${url}`;
  }
  return url;
}

export interface PastEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  videoUrl?: string;
}

export interface PastEventArchiveProps {
  title?: string;
  events?: PastEventItem[];
  isLoading?: boolean;
}

export const PastEventArchive: React.FC<PastEventArchiveProps> = ({
  title = "Past Event Archive",
  events = [],
  isLoading = false,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="relative w-full bg-white py-10 sm:py-14 lg:py-16 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="h-9 bg-gray-200/80 rounded-md w-60 mb-6 sm:mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse min-h-[340px] flex flex-col justify-between">
                <div className="w-full aspect-[16/8] bg-gray-200/70" />
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-6 bg-gray-200/80 rounded-md w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200/80 rounded-md w-full mb-2" />
                    <div className="h-4 bg-gray-200/80 rounded-md w-4/5 mb-4" />
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="h-4 bg-gray-200/80 rounded-md w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-10 sm:py-14 lg:py-16 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Heading with Navigation Arrows */}
        <div className="flex items-center justify-between gap-4 ">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12   text-left">
            {title}
          </h2>

          {/* Navigation Controls - Only show if more than 1 event */}
          {events.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => swiperInstance?.slidePrev()}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-dark-text hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none cursor-pointer"
                aria-label="Previous past event"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => swiperInstance?.slideNext()}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-dark-text hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none cursor-pointer"
                aria-label="Next past event"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Past Events Swiper Carousel */}
        <div className="w-full">
          <Swiper
            modules={[Navigation]}
            onSwiper={setSwiperInstance}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.4, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 2.2, spaceBetween: 28 },
            }}
            className="w-full !pb-2 [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
          >
            {events.map((item) => (
              <SwiperSlide key={item.id} className="flex flex-col">
                <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl overflow-hidden flex-1 flex flex-col justify-between transition-all duration-300 group shadow-xs">
                  {/* Header Image — plain display only */}
                  {item.imageSrc ? (
                    <div className="relative w-full aspect-[16/8] bg-gray-100 overflow-hidden">
                      <Image
                        src={getImageUrl(item.imageSrc)}
                        alt={item.imageAlt || item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.srcset = "";
                          target.src = "/editors_note_bg.png";
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-semibold text-dark-text tracking-tight leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-[#5A6560C2] font-normal leading-relaxed mt-2 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Location Meta + Watch Recording Button */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 group-hover:border-black/5 transition-colors flex-wrap">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5A6560C2] font-medium min-w-0">
                        <MapPin className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>

                      {item.videoUrl && (
                        <button
                          onClick={() => setActiveVideoUrl(item.videoUrl!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          Watch Recording
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Video Lightbox Modal — same style as Media page */}
      {activeVideoUrl && (
        <div
          onClick={() => setActiveVideoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-default"
          >
            {/* Floating Close Button */}
            <button
              onClick={() => setActiveVideoUrl(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 cursor-pointer shadow-md"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 16:9 Embedded Video Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`${getYouTubeEmbedUrl(activeVideoUrl)}?autoplay=1`}
                title="Event Recording"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PastEventArchive;
