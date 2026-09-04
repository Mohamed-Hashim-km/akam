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
  color: string;
  slug?: string;
  href?: string;
}

export interface ExploreByInterestProps {
  title?: string;
  categories?: CategoryItem[];
}

const normalizeCategories = (raw: any[]): CategoryItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: item.id || String(item.slug || Math.random()),
    title: item.title || item.name || "Community",
    description: item.description || "Engaging stories and cultural discourse.",
    color: item.color || "#29ABE1",
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
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLiveCommunities = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/communities`);
        if (res.ok) {
          const liveData: any[] = await res.json();
          if (Array.isArray(liveData) && isMounted) {
            setCategoriesList(normalizeCategories(liveData));
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

  const visibleCategories = showAll ? categoriesList : categoriesList.slice(0, 6);

  const renderCard = (cat: CategoryItem) => {
    const slug = getSlug(cat);
    return (
      <div
        key={cat.id}
        onClick={() => router.push(cat.href || `/communities/${slug}`)}
        className="relative rounded-3xl overflow-hidden h-full min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-7 sm:p-8 transition-all duration-300 group shadow-xs hover:shadow-xl cursor-pointer"
        style={{
          backgroundColor: cat.color || "#29ABE1",
        }}
      >
        {/* Card Content Overlay */}
        <div className="relative z-10 flex flex-col justify-end h-full">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-2 font-poppins">
            {cat.title}
          </h3>

          <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed mb-6 max-w-[95%] font-poppins">
            {cat.description}
          </p>

          {/* Black Pill Navigation Button */}
          <Link
            href={cat.href || `/communities/${slug}`}
            className="w-fit py-2.5 px-6 rounded-full text-xs sm:text-sm font-medium inline-flex items-center gap-3 bg-black text-white hover:bg-black/90 transition-all duration-200 shadow-md active:scale-98 cursor-pointer"
          >
            <span>Join Community</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Title */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-center sm:text-left text-dark-bg tracking-tight font-poppins">
            {title}
          </h2>
        </div>

        {/* Loading Skeletons */}
        {loading && categoriesList.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-gray-100 animate-pulse min-h-[360px] flex flex-col justify-end p-7"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop 3-Column Static Grid Layout (Hidden on Mobile) */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 w-full">
              {visibleCategories.map((cat) => renderCard(cat))}
            </div>

            {/* Mobile Swiper Carousel Slider (Hidden on Desktop) */}
            <div className="block md:hidden w-full">
              <Swiper
                modules={[Navigation]}
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                spaceBetween={16}
                slidesPerView={1.15}
                className="w-full [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
              >
                {visibleCategories.map((cat) => (
                  <SwiperSlide key={cat.id} className="!h-auto !flex !flex-col">
                    {renderCard(cat)}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Mobile Bottom Right Navigation Arrow Buttons */}
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

        {/* Desktop View More / Show Less Button (Hidden on Mobile) */}
        {categoriesList.length > 6 && (
          <div className="hidden md:flex justify-center mt-12 sm:mt-16">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="px-8 py-2.5 rounded-full border border-dark-bg text-dark-bg hover:bg-dark-bg hover:text-white transition-all text-sm font-medium shadow-2xs cursor-pointer"
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
