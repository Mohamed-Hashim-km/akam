"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { Quote } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

export interface ReviewItem {
  id: string;
  content?: string;
  quote?: string;
  userName?: string;
  userEmail?: string;
  authorName?: string;
  authorInitial?: string;
  storyTitle?: string;
  bookTitle?: string;
  storySlug?: string;
  createdAt?: string;
}

export interface ReaderReviewsProps {
  title?: string;
  reviews?: ReviewItem[];
}

export const ReaderReviews: React.FC<ReaderReviewsProps> = ({
  title = "Reader Reviews",
  reviews: rawReviews,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  const displayList: ReviewItem[] = Array.isArray(rawReviews) ? rawReviews : [];

  if (displayList.length === 0) return null;

  return (
    <section className="relative w-full bg-white pb-16 lg:py-24 font-poppins overflow-hidden">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-1/2 left-10 w-48 h-48 bg-emerald-100/40 rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full relative z-10 text-center mb-10 lg:mb-14">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
          {title}
        </h2>
      </div>

      {/* Swiper Carousel Slider (Full Viewport Width) */}
      <div className="w-full relative z-10">
        <Swiper
          modules={[Autoplay, Pagination]}
          onSwiper={setSwiperInstance}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
          }}
          spaceBetween={24}
          slidesPerView={1.15}
          breakpoints={{
            640: { slidesPerView: 1.8, spaceBetween: 24 },
            768: { slidesPerView: 2.5, spaceBetween: 28 },
            1024: { slidesPerView: 3.5, spaceBetween: 32 },
            1280: { slidesPerView: 4, spaceBetween: 32 },
          }}
          className="w-full !pb-6"
        >
          {displayList.map((item) => {
            const text = item.content || item.quote || "";
            const name =
              item.userName ||
              (item.userEmail ? item.userEmail.split("@")[0] : null) ||
              item.authorName ||
              "Reader";
            const initial = item.authorInitial || name[0]?.toUpperCase() || "R";
            const storyName = item.storyTitle || item.bookTitle || "Story Reader";

            return (
              <SwiperSlide key={item.id} className="!h-auto flex">
                <div className="bg-[#F4FAF6] rounded-3xl p-7 lg:p-8 flex flex-col justify-between w-full h-full min-h-[250px] border border-emerald-100/80 shadow-xs hover:shadow-md transition-all duration-300 group">
                  <div>
                    {/* Pale Mint Quote Icon */}
                    <div className="text-[#21B573]/40 mb-3">
                      <Quote className="w-9 h-9 rotate-180 fill-[#21B573]/20" />
                    </div>

                    {/* Italicized Quote Text */}
                    <p className="text-sm sm:text-base italic text-dark-bg/85 font-normal leading-relaxed mb-6">
                      &ldquo;{text}&rdquo;
                    </p>
                  </div>

                  <div>
                    {/* Subtle Mint Divider */}
                    <div className="border-b border-emerald-200/50 mb-4" />

                    {/* Reviewer Author Footer */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar Circle */}
                        <div className="w-9 h-9 rounded-full bg-[#D8F5E5] text-[#21B573] font-medium flex items-center justify-center text-sm shrink-0">
                          {initial}
                        </div>

                        {/* Author Name */}
                        <span className="text-sm font-medium text-dark-bg truncate">
                          {name}
                        </span>
                      </div>

                      {/* Book Title Tag / Link */}
                      {item.storySlug ? (
                        <Link
                          href={`/stories/${item.storySlug}`}
                          className="text-xs font-medium text-[#21B573] hover:underline tracking-wide truncate max-w-[45%]"
                        >
                          {storyName}
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[#21B573] tracking-wide truncate max-w-[45%]">
                          {storyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
};

export default ReaderReviews;
