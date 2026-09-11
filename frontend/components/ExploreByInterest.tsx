"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch } from "@/lib/config";

import "swiper/css";
import "swiper/css/navigation";

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
  backgroundColor?: string;
  slug?: string;
  href?: string;
}

export interface ExploreByInterestProps {
  title?: string;
  categories?: CategoryItem[];
}

const FALLBACK_CARD_COLORS = [
  "#E5F3A6", // Pale Lime Yellow
  "#EAB8B8", // Dusty Rose
  "#C49BF7", // Pastel Purple
  "#E57CE7", // Vibrant Magenta
  "#9CDAF0", // Sky Blue
  "#EDB46B", // Warm Amber
];

const normalizeCategories = (raw: any[]): CategoryItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: item.id || String(item.slug || Math.random()),
    title: item.title || item.name || "Community",
    description: item.description || "Engaging stories and rhymes to inspire young readers.",
    color: item.color || item.bgColor || item.backgroundColor || "",
    bgColor: item.bgColor || item.color || item.backgroundColor || "",
    slug: item.slug,
    href: item.href,
  }));
};

export const ExploreByInterest: React.FC<ExploreByInterestProps> = ({
  title = "Explore By Interest",
  categories: initialPropCategories,
}) => {
  const router = useRouter();
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(
    initialPropCategories && initialPropCategories.length > 0
      ? normalizeCategories(initialPropCategories)
      : []
  );
  const [loading, setLoading] = useState<boolean>(!initialPropCategories || initialPropCategories.length === 0);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialPropCategories && initialPropCategories.length > 0) {
      setCategoriesList(normalizeCategories(initialPropCategories));
    }

    let isMounted = true;
    const fetchLiveCommunities = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/communities`, { cache: "no-store" });
        if (res.ok) {
          const liveData: any[] = await res.json();
          const list = Array.isArray(liveData) ? liveData : (liveData as any).data || [];
          if (Array.isArray(list) && list.length > 0 && isMounted) {
            setCategoriesList(normalizeCategories(list));
          }
        }
      } catch (err) {
        console.error("Failed to fetch communities", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveCommunities();
    return () => {
      isMounted = false;
    };
  }, [initialPropCategories]);

  if (!loading && categoriesList.length === 0) {
    return null;
  }

  const getSlug = (cat: CategoryItem) =>
    cat.slug || (cat.title ? cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "community");

  const visibleCategories = showAll ? categoriesList : categoriesList.slice(0, 7);

  const renderCard = (cat: CategoryItem, index: number) => {
    const slug = getSlug(cat);
    // Prioritize API background color dynamically, fallback to preset palette if missing
    const bgColor =
      cat.color ||
      cat.bgColor ||
      cat.backgroundColor ||
      FALLBACK_CARD_COLORS[index % FALLBACK_CARD_COLORS.length];

    return (
      <div
        key={cat.id}
        onClick={() => router.push(cat.href || `/communities/${slug}`)}
        className="relative rounded-[22px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group shadow-xs hover:shadow-xl cursor-pointer w-full min-h-[210px]"
        style={{ backgroundColor: bgColor }}
      >
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight leading-snug mb-2 font-poppins">
            {cat.title}
          </h3>
          <p className="text-xs text-gray-800/85 font-normal leading-relaxed mb-5 font-poppins">
            {cat.description}
          </p>
        </div>

        <Link
          href={cat.href || `/communities/${slug}`}
          className="w-full bg-white text-gray-950 rounded-full px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer group-hover:bg-white/95"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-800 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  };

  // Serpentine Snake Pattern: Left to Right across 4 columns (0 -> 1 -> 2 -> 3), then Right to Left (3 -> 2 -> 1 -> 0)
  const getSnakeColumnIndex = (index: number, numCols: number = 4): number => {
    const cycleLen = (numCols - 1) * 2; // for 4 cols, cycleLen = 6
    const pos = index % cycleLen;
    if (pos < numCols) return pos;
    return cycleLen - pos;
  };


  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
      {/* ── Left Background Decorative Graphic (Purple Blob) ── */}
      <div className="absolute -left-16 sm:-left-24 md:-left-32 top-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-[440px] h-auto pointer-events-none select-none z-0 opacity-95">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            <linearGradient id="purpleBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8123DB" />
              <stop offset="100%" stopColor="#CF25D8" />
            </linearGradient>
          </defs>
          <g transform="rotate(35 180 200)">
            <rect x="20" y="110" width="260" height="170" rx="85" fill="url(#purpleBlobGrad)" />
            <circle cx="310" cy="195" r="20" fill="#CF25D8" />
          </g>
        </svg>
      </div>

      {/* ── Top-Right Background Decorative Graphic (Orange Blob) ── */}
      <div className="absolute -right-16 sm:-right-24 md:-right-28 -top-8 sm:-top-12 md:-top-16 w-64 sm:w-80 md:w-[440px] h-auto pointer-events-none select-none z-0 opacity-95">
        <svg viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            <linearGradient id="orangeBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0892B" />
              <stop offset="100%" stopColor="#B22222" />
            </linearGradient>
          </defs>
          <g transform="rotate(-25 220 160)">
            <rect x="110" y="50" width="270" height="170" rx="85" fill="url(#orangeBlobGrad)" />
            <circle cx="78" cy="135" r="22" fill="#E0892B" />
          </g>
        </svg>
      </div>

      <div className="container px-6 mx-auto relative z-10 max-w-[1280px]">
        {/* Section Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-center text-dark-text tracking-tight mb-12 sm:mb-16 font-poppins">
          {title}
        </h2>

        {/* Loading Skeleton */}
        {loading && categoriesList.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[22px] bg-gray-100 animate-pulse min-h-[210px] p-6"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Staggered Serpentine Diagonal Snake Layout */}
            <div className="hidden md:grid md:grid-cols-4 gap-5 lg:gap-6 md:auto-rows-[95px] lg:auto-rows-[105px] w-full items-start">
              {visibleCategories.map((cat, index) => {
                const colIndex = getSnakeColumnIndex(index);
                return (
                  <div
                    key={cat.id}
                    className="w-full"
                    style={{
                      gridColumnStart: colIndex + 1,
                      gridRowStart: index + 1,
                    }}
                  >
                    {renderCard(cat, index)}
                  </div>
                );
              })}
            </div>

            {/* Mobile Carousel Slider */}
            <div className="block md:hidden w-full">
              <Swiper
                modules={[Navigation]}
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                spaceBetween={16}
                slidesPerView={1.15}
                className="w-full [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
              >
                {visibleCategories.map((cat, index) => (
                  <SwiperSlide key={cat.id} className="!h-auto !flex !flex-col">
                    {renderCard(cat, index)}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Mobile Carousel Navigation Arrows */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                  aria-label="Previous Category"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => swiperInstance?.slideNext()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                  aria-label="Next Category"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* View More / Show Less Button */}
        {categoriesList.length > 7 && (
          <div className="flex justify-center mt-12 sm:mt-16">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all text-xs font-semibold shadow-md cursor-pointer active:scale-98"
            >
              {showAll ? "Show less" : "View more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreByInterest;
