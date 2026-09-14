"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";

import "swiper/css";
import "swiper/css/navigation";

// Dynamically import flipbook to avoid SSR issues
const EditionFlipbook = dynamic(() => import("./EditionFlipbook"), { ssr: false });

import { API_BASE_URL, formatAssetUrl } from "@/lib/config";

export interface EditionItem {
  id: string;
  title: string;
  pdfUrl: string;
  coverImage?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface PreviousEditionsProps {
  title?: string;
}

const SAMPLE_EDITIONS: EditionItem[] = [
  {
    id: "sample-1",
    title: "August 2025",
    pdfUrl: "/uploads/pdfs/edition_1788754468993.pdf",
    coverImage: "http://localhost:3000/uploads/inline-images/post-1789115092135_1789115092136.png",
  },
  {
    id: "sample-2",
    title: "May 2025",
    pdfUrl: "/uploads/pdfs/edition_1788345988530.pdf",
    coverImage: "https://akam-a701.onrender.com/uploads/inline-images/post-1789022831572_1789022831572.png",
  },
  {
    id: "sample-3",
    title: "Febraury 2025",
    pdfUrl: "/uploads/pdfs/edition_1788754468993.pdf",
    coverImage: "http://localhost:3000/uploads/inline-images/post-1789115092135_1789115092136.png",
  },
  {
    id: "sample-4",
    title: "December 2024",
    pdfUrl: "/uploads/pdfs/edition_1788345988530.pdf",
    coverImage: "https://akam-a701.onrender.com/uploads/inline-images/post-1789022831572_1789022831572.png",
  },
];

export const PreviousEditions: React.FC<PreviousEditionsProps> = ({
  title = "Previous Editions",
}) => {
  const [editions, setEditions] = useState<EditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [openEdition, setOpenEdition] = useState<EditionItem | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const fetchEditionsPage = async (pageNum: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/editions?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let items: EditionItem[] = [];
      let nextHasMore = false;

      if (json && json.data && Array.isArray(json.data)) {
        items = json.data;
        nextHasMore = json.meta?.hasMore ?? (json.meta?.page < json.meta?.totalPages);
      } else if (Array.isArray(json)) {
        items = json;
        nextHasMore = false;
      }

      return { items, hasMore: nextHasMore };
    } catch (err) {
      console.error("[PreviousEditions] fetch page failed:", err);
      return { items: [], hasMore: false };
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setLoading(true);
      const { items, hasMore: more } = await fetchEditionsPage(1);

      if (isMounted) {
        if (items.length > 0) {
          setEditions(items);
          setHasMore(more);
        } else {
          setEditions(SAMPLE_EDITIONS);
          setHasMore(false);
        }
        setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadNextPage = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { items, hasMore: more } = await fetchEditionsPage(nextPage);

    if (items.length > 0) {
      setEditions((prev) => {
        const existing = new Set(prev.map((e) => e.id));
        const newUnique = items.filter((item) => !existing.has(item.id));
        return [...prev, ...newUnique];
      });
      setPage(nextPage);
      setHasMore(more);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handleNextSlide = async () => {
    if (!swiperInstance) return;

    const isNearEnd = swiperInstance.activeIndex >= editions.length - 3;
    if (isNearEnd && hasMore && !loadingMore) {
      await loadNextPage();
    }
    swiperInstance.slideNext();
  };

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const displayList = editions.length > 0 ? editions : SAMPLE_EDITIONS;

  return (
    <>
      <section id="previous-editions" className="relative w-full bg-white py-12 lg:py-16 font-poppins overflow-hidden">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
          {/* Section Header */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12 text-left">
            {title}
          </h2>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
                  <div className="mt-3.5 h-5 bg-gray-100 rounded-lg animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Swiper Carousel */}
              <Swiper
                onSwiper={setSwiperInstance}
                modules={[Navigation]}
                spaceBetween={24}
                slidesPerView={1.15}
                onSlideChange={(swiper) => {
                  if (swiper.activeIndex >= editions.length - 3 && hasMore && !loadingMore) {
                    loadNextPage();
                  }
                }}
                breakpoints={{
                  480: { slidesPerView: 1.8, spaceBetween: 20 },
                  640: { slidesPerView: 2.3, spaceBetween: 24 },
                  768: { slidesPerView: 3, spaceBetween: 24 },
                  1024: { slidesPerView: 4, spaceBetween: 24 },
                }}
                className="w-full !pb-2"
              >
                {displayList.map((edition) => {
                  const showCover = !!(edition.coverImage && !imgErrors[edition.id]);
                  return (
                    <SwiperSlide key={edition.id} className="!h-auto">
                      <button
                        type="button"
                        onClick={() => setOpenEdition(edition)}
                        className="flex flex-col group cursor-pointer text-left w-full h-full"
                      >
                        {/* Cover Image Container */}
                        <div className="relative w-full aspect-[3/4] rounded-[18px] sm:rounded-[22px] overflow-hidden bg-gray-100 shadow-xs group-hover:shadow-lg transition-all duration-300">
                          {showCover ? (
                            <img
                              src={formatAssetUrl(edition.coverImage!)}
                              alt={edition.title}
                              onError={() => handleImgError(edition.id)}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-amber-100 to-amber-200">
                              <BookOpen className="w-12 h-12 text-amber-800/40" />
                              <span className="text-xs text-amber-900 font-semibold text-center px-4 leading-snug">
                                {edition.title}
                              </span>
                            </div>
                          )}

                         
                        </div>

                        {/* Edition Title */}
                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-dark-text tracking-tight mt-4 group-hover:text-black transition-colors line-clamp-1">
                          {edition.title}
                        </h3>
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Navigation Controls on Bottom Right */}
              <div className="flex items-center justify-end gap-3 mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-800 transition-colors cursor-pointer"
                  aria-label="Previous edition"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[1.75]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  disabled={loadingMore}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Next edition"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 stroke-[1.75]" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Flipbook Modal */}
      {openEdition && (
        <EditionFlipbook
          pdfUrl={openEdition.pdfUrl}
          title={openEdition.title}
          onClose={() => setOpenEdition(null)}
        />
      )}
    </>
  );
};

export default PreviousEditions;
