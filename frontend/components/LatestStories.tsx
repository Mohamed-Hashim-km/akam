"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

export interface Story {
  id: string;
  category: string;
  badgeTextColor?: string;
  title: string;
  author: string;
  imageSrc: string;
  href?: string;
}

export interface LatestStoriesProps {
  title?: string;
  viewAllHref?: string;
  stories?: Story[];
}

const CATEGORY_COLORS: Record<string, string> = {
  FICTION: "text-[#D97706]",
  "NON-FICTION": "text-[#0284C7]",
  POETRY: "text-[#9333EA]",
  CULTURE: "text-[#E11D48]",
  TECHNOLOGY: "text-[#059669]",
  OPINION: "text-[#D97706]",
  LITERATURE: "text-[#2563EB]",
  GENERAL: "text-[#4B5563]",
};

function getCategoryColor(cat?: string) {
  if (!cat) return "text-[#D97706]";
  const key = cat.trim().toUpperCase();
  return CATEGORY_COLORS[key] || "text-[#D97706]";
}

// Module-level in-memory cache for 0ms instant client rendering
let inMemoryLatestStoriesCache: Story[] | null = null;

export const LatestStories: React.FC<LatestStoriesProps> = ({
  title = "Latest Stories",
  viewAllHref = "/stories",
  stories: propStories,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  // Synchronously initialize state from module cache or props for instant 0ms rendering
  const [stories, setStories] = useState<Story[]>(() => {
    if (propStories && propStories.length > 0) return propStories;
    if (inMemoryLatestStoriesCache && inMemoryLatestStoriesCache.length > 0) {
      return inMemoryLatestStoriesCache;
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propStories && propStories.length > 0) {
      setStories(propStories);
      return;
    }

    const fetchLatestPublishedStories = async () => {
      if (stories.length === 0) {
        setLoading(true);
      }

      try {
        const res = await apiFetch(`${API_BASE_URL}/stories?status=APPROVED&limit=10`, {
          next: { revalidate: 60, tags: ["stories"] },
        });

        if (res.ok) {
          const json = await res.json();
          const items = json.data || json;
          if (Array.isArray(items)) {
            const mapped = items.map((s: any) => ({
              id: s.id,
              category: (s.category || "Fiction").toUpperCase(),
              badgeTextColor: getCategoryColor(s.category),
              title: s.title,
              author: `By ${s.authorName || s.authorEmail || "Unknown Author"}`,
              imageSrc: s.coverImageUrl || "/images/stories/ramachi.jpg",
              href: `/stories/${s.slug || s.id}`,
            }));

            // Update module cache and state
            inMemoryLatestStoriesCache = mapped;
            setStories(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic latest stories", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPublishedStories();
  }, [propStories]);

  return (
    <section className="relative w-full bg-white py-12 lg:py-20 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>

          <Link href={viewAllHref}>
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
            >
              View All Stories
            </Button>
          </Link>
        </div>

        {/* Stories Content */}
        {stories.length === 0 ? (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 opacity-60">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col h-full space-y-3">
                  <div className="w-full aspect-[3/4] sm:aspect-[4/5] rounded-[24px] sm:rounded-[28px] bg-gray-100 animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-[28px] p-8 text-center my-6">
              <BookOpen className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-bold text-gray-900">No Published Stories Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                New stories will appear here dynamically as editors approve submissions.
              </p>
            </div>
          )
        ) : (
          <div className="w-full overflow-visible">
            <Swiper
              modules={[Navigation]}
              onSwiper={setSwiperInstance}
              spaceBetween={20}
              slidesPerView={1.2}
              breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 24 },
                768: { slidesPerView: 3.1, spaceBetween: 24 },
                1024: { slidesPerView: 3.6, spaceBetween: 28 },
              }}
              className="w-full !pb-4 !overflow-visible"
            >
              {stories.map((story, index) => (
                <SwiperSlide key={story.id} className="h-auto">
                  <Link href={story.href || `/stories/${story.id}`} className="flex flex-col h-full group/card cursor-pointer">
                    {/* Image Card Container */}
                    <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-gray-100 mb-4 shadow-xs">
                      <Image
                        src={story.imageSrc}
                        alt={story.title}
                        fill
                        priority={index === 0}
                        unoptimized
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 30vw"
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />

                      {/* Category Badge overlay on bottom left */}
                      <div className="absolute bottom-4 left-4 z-10">
                        <span
                          className={`bg-white ${
                            story.badgeTextColor || "text-[#D97706]"
                          } font-bold text-[11px] sm:text-xs tracking-wider uppercase px-3.5 py-1.5 rounded-xl shadow-xs`}
                        >
                          {story.category}
                        </span>
                      </div>
                    </div>

                    {/* Title & Author Below Card */}
                    <h3 className="text-lg sm:text-xl font-semibold text-dark-text tracking-tight leading-snug mb-1 group-hover/card:text-gray-700 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#646464] font-normal flex items-center gap-1">
                      <span>{story.author}</span>
                    </p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Bottom Navigation Arrows */}
        {stories.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-4 sm:pt-6">
            <button
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all focus:outline-none cursor-pointer"
              aria-label="Previous Story"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all focus:outline-none cursor-pointer"
              aria-label="Next Story"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestStories;
