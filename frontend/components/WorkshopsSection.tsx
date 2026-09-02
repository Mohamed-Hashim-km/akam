"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";
import EventRegisterModal from "@/components/EventRegisterModal";
import { API_BASE_URL } from "@/lib/config";

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

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  imageSrc: string;
  imageAlt?: string;
  bgColor?: string;
  isPrimaryButton?: boolean;
}

export interface WorkshopsSectionProps {
  title?: string;
  workshops?: WorkshopItem[];
  isLoading?: boolean;
}

export const WorkshopsSection: React.FC<WorkshopsSectionProps> = ({
  title = "Workshops",
  workshops = [],
  isLoading = false,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [selectedWorkshopForReg, setSelectedWorkshopForReg] = useState<WorkshopItem | null>(null);

  if (isLoading) {
    return (
      <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="h-10 bg-gray-200/80 rounded-md w-48 mb-8 sm:mb-12 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl overflow-hidden animate-pulse min-h-[420px] flex flex-col justify-between">
                <div className="w-full aspect-[16/10] bg-gray-200/70" />
                <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-7 bg-gray-200/80 rounded-md w-3/4 mb-4" />
                    <div className="h-4 bg-gray-200/80 rounded-md w-full mb-2" />
                    <div className="h-4 bg-gray-200/80 rounded-md w-4/5 mb-6" />
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-8 bg-gray-200/80 rounded-md w-16" />
                    <div className="h-9 bg-gray-200/80 rounded-full w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!workshops || workshops.length === 0) return null;
  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading with Navigation Arrows */}
        <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight text-left">
            {title}
          </h2>

          {workshops.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => swiperInstance?.slidePrev()}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-dark-text hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none cursor-pointer"
                aria-label="Previous workshop"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => swiperInstance?.slideNext()}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-dark-text hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none cursor-pointer"
                aria-label="Next workshop"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Workshops Swiper Carousel */}
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
            {workshops.map((item) => (
              <SwiperSlide key={item.id} className="flex flex-col">
                <div className="bg-white border border-gray-100 hover:bg-[#FFE9E4] hover:border-transparent rounded-3xl overflow-hidden flex-1 flex flex-col justify-between transition-all duration-300 group cursor-pointer shadow-xs hover:shadow-md">
                  {/* Header Image */}
                  {item.imageSrc ? (
                    <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
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
                  <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3 className="text-xl sm:text-2xl font-semibold text-dark-text tracking-tight leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed mt-3 mb-6">
                        {item.description}
                      </p>

                      {/* Meta details (Location & Time) */}
                      <div className="space-y-2.5 text-xs sm:text-sm text-[#5A6560C2] font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Divider & Registration Button */}
                    <div className="mt-6">
                      <div className="border-b border-gray-200/60 mb-6 w-full" />

                      <div className="flex items-center justify-between">
                        {/* Date */}
                        <div className="flex flex-col">
                          <span className="text-3xl sm:text-4xl font-semibold text-dark-text tracking-tight leading-none">
                            {item.day}
                          </span>
                          <span className="text-xs text-[#5A6560C2] font-normal mt-1">
                            {item.monthYear}
                          </span>
                        </div>

                        {/* Registration Button using shared Button component */}
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => setSelectedWorkshopForReg(item)}
                          icon={<ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />}
                          iconPosition="right"
                          className="px-5 py-2 text-xs sm:text-sm font-semibold border-gray-300 text-gray-900 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300"
                        >
                          Register Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <EventRegisterModal
        isOpen={!!selectedWorkshopForReg}
        onClose={() => setSelectedWorkshopForReg(null)}
        event={selectedWorkshopForReg}
      />
    </section>
  );
};

export default WorkshopsSection;

