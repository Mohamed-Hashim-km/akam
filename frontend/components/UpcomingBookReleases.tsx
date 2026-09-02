"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

import "swiper/css";
import "swiper/css/navigation";

export interface BookReleaseItem {
  id: string;
  title: string;
  author: string;
  editionTag?: string | null;
  description: string;
  coverImage?: string | null;
  preorderLink?: string | null;
  preorderHref?: string | null;
}

export interface UpcomingBookReleasesProps {
  title?: string;
  viewAllHref?: string;
  releases?: BookReleaseItem[];
}

const defaultReleases: BookReleaseItem[] = [
  {
    id: "1",
    title: "Before Darkness Falls",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
    preorderLink: "https://amazon.com",
  },
  {
    id: "2",
    title: "Without the Sea Knowing",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
    preorderLink: "https://amazon.com",
  },
  {
    id: "3",
    title: "Before Darkness Falls",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
    preorderLink: "https://amazon.com",
  },
];

export const UpcomingBookReleases: React.FC<UpcomingBookReleasesProps> = ({
  title = "Upcoming Book Releases",
  viewAllHref = "https://kairalibooks.com/",
  releases: initialReleases,
}) => {
  const [releasesList, setReleasesList] = useState<BookReleaseItem[]>(
    initialReleases && initialReleases.length > 0 ? initialReleases : []
  );
  const [loading, setLoading] = useState<boolean>(!initialReleases || initialReleases.length === 0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialReleases && initialReleases.length > 0) {
      setReleasesList(initialReleases);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchBooks = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/books`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setReleasesList(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch published books", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, [initialReleases]);

  const displayList = releasesList.length > 0 ? releasesList : defaultReleases;

  const renderBookCard = (item: BookReleaseItem) => (
    <div
      key={item.id}
      className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between w-full h-full shadow-xs hover:shadow-lg transition-all duration-300 group border border-purple-100/80 "
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header: Title + Tag */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-xl sm:text-2xl font-semibold text-dark-bg tracking-tight leading-tight">
              {item.title}
            </h3>
            {item.editionTag && (
              <span className="bg-[#F5EDFF] text-[#8122DB] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0">
                {item.editionTag}
              </span>
            )}
          </div>

          {/* Author Name */}
          <p className="text-sm font-medium text-dark-bg/60 mb-4">
            {item.author}
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base text-dark-bg/75 leading-relaxed font-normal mb-4">
            {item.description}
          </p>
        </div>

        {/* Light Purple Divider */}
        <div className="border-b-2 border-[#EBE0FF] my-4" />
      </div>

      {/* Bottom Pre-order Button */}
      <div className="pt-1">
        <a
          href={item.preorderLink || item.preorderHref || "https://kairalibooks.com/"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-white border border-black/20 text-dark-bg py-2.5 px-5 rounded-full text-sm font-medium inline-flex items-center justify-between transition-all duration-300 group-hover:bg-dark-bg group-hover:text-white group-hover:border-dark-bg shadow-xs group/btn cursor-pointer"
        >
          <span>Pre-order</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </a>
      </div>
    </div>
  );

  return (
    <section className="relative w-full bg-gradient-to-b from-[#EBE0FF] to-white py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#6940AF] tracking-tight">
            {title}
          </h2>

          <a href={viewAllHref} target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
            >
              View All Releases
            </Button>
          </a>
        </div>

        {/* Releases Grid / Carousel */}
        {loading && releasesList.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 h-[280px] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Static Grid Layout (Hidden on Mobile) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full">
              {displayList.map((item) => renderBookCard(item))}
            </div>

            {/* Mobile Swiper Releases Carousel (Hidden on Desktop) */}
            <div className="block md:hidden w-full">
              <Swiper
                modules={[Navigation]}
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                spaceBetween={16}
                slidesPerView={1.15}
                className="w-full"
              >
                {displayList.map((item) => (
                  <SwiperSlide key={item.id} className="h-auto">
                    {renderBookCard(item)}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Mobile Bottom Right Swiper Navigation Arrow Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                  aria-label="Previous Release"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => swiperInstance?.slideNext()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                  aria-label="Next Release"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default UpcomingBookReleases;
