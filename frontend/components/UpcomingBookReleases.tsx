"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
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

const BookCard: React.FC<{
  item: BookReleaseItem;
  onReadMore: () => void;
}> = ({ item, onReadMore }) => {
  const [canExpand, setCanExpand] = useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setCanExpand(textRef.current.scrollHeight > textRef.current.clientHeight + 1);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [item.description]);

  const showReadMore = canExpand || (Boolean(item.description) && (item.description?.length ?? 0) > 80);

  return (
    <div
      key={item.id}
      className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between w-full h-full shadow-xs hover:shadow-lg transition-all duration-300 group border border-purple-100/80"
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header: Title + Tag */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-xl sm:text-2xl font-semibold text-dark-bg tracking-tight leading-tight break-words">
              {item.title}
            </h3>
            {item.editionTag && (
              <span className="bg-[#F5EDFF] text-[#8122DB] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0">
                {item.editionTag}
              </span>
            )}
          </div>

          {/* Author Name */}
          <p className="text-sm font-medium text-dark-bg/60 mb-4 break-words">
            {item.author}
          </p>

          {/* Description clamped to 2 lines */}
          <p
            ref={textRef}
            className="text-sm sm:text-base text-dark-bg/75 leading-relaxed font-normal break-words line-clamp-2 mb-1.5"
          >
            {item.description}
          </p>

          {showReadMore && (
            <button
              type="button"
              onClick={onReadMore}
              className="text-xs sm:text-sm font-semibold text-[#8122DB] underline hover:text-[#6940AF] cursor-pointer mb-4 inline-block transition-colors"
            >
              Read more
            </button>
          )}

          {!showReadMore && <div className="mb-2" />}
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
};

export const UpcomingBookReleases: React.FC<UpcomingBookReleasesProps> = ({
  title = "Upcoming Book Releases",
  viewAllHref = "https://kairalibooks.com/",
  releases: initialReleases,
}) => {
  const [releasesList, setReleasesList] = useState<BookReleaseItem[]>(
    initialReleases && initialReleases.length > 0 ? initialReleases : []
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [selectedBookForModal, setSelectedBookForModal] = useState<BookReleaseItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedBookForModal(null);
      }
    };
    if (selectedBookForModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBookForModal]);

  useEffect(() => {
    if (initialReleases && initialReleases.length > 0) {
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
          if (Array.isArray(items) && items.length > 0 && isMounted) {
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

        {/* Desktop Static Grid Layout (Hidden on Mobile) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full">
          {releasesList.map((item) => (
            <BookCard
              key={item.id}
              item={item}
              onReadMore={() => setSelectedBookForModal(item)}
            />
          ))}
        </div>

        {/* Mobile Swiper Releases Carousel (Hidden on Desktop) */}
        <div className="block md:hidden w-full">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            spaceBetween={16}
            slidesPerView={1.15}
            className="w-full [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
          >
            {releasesList.map((item) => (
              <SwiperSlide key={item.id} className="!h-auto !flex !flex-col">
                <BookCard
                  item={item}
                  onReadMore={() => setSelectedBookForModal(item)}
                />
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
      </div>

      {/* Book Details & Full Description Popup Modal */}
      {selectedBookForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-poppins"
          onClick={() => setSelectedBookForModal(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {selectedBookForModal.editionTag && (
                    <span className="bg-[#F5EDFF] text-[#8122DB] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0">
                      {selectedBookForModal.editionTag}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Book Release
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-dark-bg tracking-tight leading-snug">
                  {selectedBookForModal.title}
                </h3>
                <p className="text-sm font-medium text-dark-bg/60 mt-1">
                  {selectedBookForModal.author}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBookForModal(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Full Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                About This Book
              </h4>
              <p className="text-sm sm:text-base text-dark-bg/85 leading-relaxed font-normal whitespace-pre-line">
                {selectedBookForModal.description}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookForModal(null)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href={
                  selectedBookForModal.preorderLink ||
                  selectedBookForModal.preorderHref ||
                  "https://kairalibooks.com/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#6940AF] hover:bg-[#563493] text-white py-2.5 px-6 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>Pre-order on Kairali Books</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UpcomingBookReleases;

