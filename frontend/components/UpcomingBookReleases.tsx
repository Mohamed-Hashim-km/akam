"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

import "swiper/css";
import "swiper/css/navigation";
import Button from "./ui/Button";

export interface BookReleaseItem {
  id: string;
  title: string;
  author: string;
  editionTag?: string | null;
  description?: string | null;
  coverImage?: string | null;
  preorderLink?: string | null;
  preorderHref?: string | null;
}

export interface UpcomingBookReleasesProps {
  title?: string;
  viewAllHref?: string;
  releases?: BookReleaseItem[];
}

const BookCard: React.FC<{
  item: BookReleaseItem;
}> = ({ item }) => {
  const imageUrl = item.coverImage ? formatAssetUrl(item.coverImage) : null;
  const linkHref = item.preorderLink || item.preorderHref || "https://kairalibooks.com/";
  const displayAuthor = item.author.trim().startsWith("By ") ? item.author.trim() : `By ${item.author.trim()}`;

  return (
    <a
      href={linkHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col w-full h-full bg-white rounded-[24px] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-[3/4.2] bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 20vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-purple-100 to-indigo-100">
            <span className="text-sm font-bold text-purple-900 leading-snug line-clamp-3">
              {item.title}
            </span>
            <span className="text-xs text-purple-600 font-medium mt-2">
              {item.author}
            </span>
          </div>
        )}
      </div>

      {/* Book Info Below Cover: Title & Author Name inside padded white card area */}
      <div className="flex flex-col justify-start p-5 bg-white flex-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 truncate">
          {displayAuthor}
        </p>
      </div>
    </a>
  );
};

export const UpcomingBookReleases: React.FC<UpcomingBookReleasesProps> = ({
  title = "Upcoming Book Releases",
  viewAllHref = "https://kairalibooks.com/",
  releases: initialReleases,
}) => {
  const [releasesList, setReleasesList] = useState<BookReleaseItem[]>(
    initialReleases !== undefined ? initialReleases : []
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialReleases !== undefined) {
      setReleasesList(initialReleases);
      return;
    }

    let isMounted = true;
    const fetchBooks = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/books`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.data;
          if (Array.isArray(items) && isMounted) {
            setReleasesList(items);
          }
        }
      } catch (err) {
        console.error("Failed to fetch published books", err);
      }
    };

    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, [initialReleases]);

  if (releasesList.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-[#EECAA6] py-14 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>

          <a
            href={viewAllHref}
           >
              <Button
                          variant="primary"
                          size="md"
                          icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                          iconPosition="right"
                          className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
                        >
            <span>View All Releases</span>
           </Button>
          </a>
        </div>

        {/* Multi-Book Responsive Swiper Carousel */}
        <div className="w-full">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            spaceBetween={20}
            slidesPerView={1.25}
            breakpoints={{
              540: { slidesPerView: 2.2, spaceBetween: 20 },
              768: { slidesPerView: 3.2, spaceBetween: 24 },
              1024: { slidesPerView: 4.2, spaceBetween: 24 },
              1280: { slidesPerView: 5, spaceBetween: 24 },
            }}
            className="upcoming-books-swiper w-full [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
          >
            {releasesList.map((item) => (
              <SwiperSlide key={item.id} className="!h-auto !flex !flex-col">
                <BookCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Bottom Right Swiper Navigation Arrow Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 sm:pt-8">
            <button
              type="button"
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 rounded-full border border-black/30 bg-transparent flex items-center justify-center text-gray-900 hover:bg-black/10 transition-all focus:outline-none cursor-pointer active:scale-95"
              aria-label="Previous Release"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 rounded-full border border-black/30 bg-transparent flex items-center justify-center text-gray-900 hover:bg-black/10 transition-all focus:outline-none cursor-pointer active:scale-95"
              aria-label="Next Release"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingBookReleases;
