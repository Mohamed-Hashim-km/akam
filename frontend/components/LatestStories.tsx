"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Play, Video } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";
import Button from "./ui/Button";

export interface Story {
  id: string;
  category: string;
  badgeTextColor?: string;
  badgeBgColor?: string;
  title: string;
  description?: string;
  author: string;
  imageSrc: string;
  href?: string;
  contentType?: string; // "STORY" | "VIDEO" | "POEM" | etc.
  submissionType?: string;
  mediaUrl?: string | null;
}

export interface LatestStoriesProps {
  title?: string;
  viewAllHref?: string;
  stories?: Story[];
}

const CATEGORY_BADGE_MAP: Record<string, { bg: string; text: string }> = {
  FICTION:      { bg: "bg-[#DF7E26]",   text: "text-white" },
  "NON-FICTION":{ bg: "bg-[#38A9E4]",   text: "text-white" },
  POETRY:       { bg: "bg-purple-500",  text: "text-white" },
  CULTURE:      { bg: "bg-rose-500",    text: "text-white" },
  TECHNOLOGY:   { bg: "bg-emerald-500", text: "text-white" },
  OPINION:      { bg: "bg-[#DF7E26]",   text: "text-white" },
  LITERATURE:   { bg: "bg-blue-600",    text: "text-white" },
  STORY:        { bg: "bg-[#DF7E26]",   text: "text-white" },
  BLOG:         { bg: "bg-[#38A9E4]",   text: "text-white" },
  VIDEO:        { bg: "bg-[#38A9E4]",   text: "text-white" },
  PAINTING:     { bg: "bg-purple-600",  text: "text-white" },
  POEM:         { bg: "bg-purple-500",  text: "text-white" },
  GENERAL:      { bg: "bg-[#DF7E26]",   text: "text-white" },
};

function getCategoryBadge(cat?: string) {
  if (!cat) return CATEGORY_BADGE_MAP.STORY;
  const key = cat.trim().toUpperCase();
  return CATEGORY_BADGE_MAP[key] || CATEGORY_BADGE_MAP.GENERAL;
}

function normalizeStory(s: any): Story {
  const isVideo =
    s.submissionType === "VIDEO" ||
    s.contentType === "VIDEO" ||
    (typeof s.category === "string" && s.category.toUpperCase() === "VIDEO");

  const cat = (s.category || s.contentType || (isVideo ? "Video" : "Story")).toUpperCase();
  const rawAuthor =
    s.authorName || s.authorEmail || s.author || "Unknown Author";
  const author =
    typeof s.author === "string" && s.author.startsWith("By ")
      ? s.author
      : `By ${rawAuthor}`;
  const badge = getCategoryBadge(cat);

  // Build a short description
  const rawDesc =
    s.description ||
    s.excerpt ||
    s.summary ||
    s.shortDescription ||
    "";

  let img = s.imageSrc || s.coverImageUrl;
  if (!img && isVideo && s.mediaUrl) {
    const ytMatch = s.mediaUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      img = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
  }
  if (!img) {
    img = s.mediaUrl || "/images/stories/ramachi.jpg";
  }
  if (img && typeof img === "string" && img.startsWith("/")) {
    img = formatAssetUrl(img);
  }

  return {
    id: s.id,
    category: cat,
    badgeTextColor: badge.text,
    badgeBgColor: badge.bg,
    title: s.title,
    description: rawDesc,
    author,
    imageSrc: img,
    href: s.href || `/works/${s.slug || s.id}`,
    contentType: isVideo ? "VIDEO" : (s.contentType || s.submissionType || cat).toUpperCase(),
    submissionType: s.submissionType,
    mediaUrl: s.mediaUrl,
  };
}

export const LatestStories: React.FC<LatestStoriesProps> = ({
  title = "Featured content",
  viewAllHref = "/works",
  stories: propStories,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  const [stories, setStories] = useState<Story[]>(() => {
    if (propStories !== undefined && propStories.length > 0) {
      return propStories.map(normalizeStory);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propStories !== undefined && propStories.length > 0) {
      setStories(propStories.map(normalizeStory));
    }

    let isMounted = true;

    const fetchFeaturedPublishedStories = async () => {
      if (!propStories || propStories.length === 0) {
        setLoading(true);
      }

      try {
        const res = await apiFetch(
          `${API_BASE_URL}/stories?status=APPROVED&featured=true&limit=10`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const json = await res.json();
          const items = json.data || (Array.isArray(json) ? json : []);
          if (Array.isArray(items) && items.length > 0) {
            if (isMounted) {
              setStories(items.map(normalizeStory));
            }
            return;
          }
        }

        // Fallback: If no stories are explicitly marked as featured, fallback to latest approved
        if (!propStories || propStories.length === 0) {
          const fallbackRes = await apiFetch(
            `${API_BASE_URL}/stories?status=APPROVED&limit=10`,
            { cache: "no-store" }
          );
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            const fallbackItems = fallbackJson.data || (Array.isArray(fallbackJson) ? fallbackJson : []);
            if (Array.isArray(fallbackItems) && isMounted) {
              setStories(fallbackItems.map(normalizeStory));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic featured stories", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedPublishedStories();

    return () => {
      isMounted = false;
    };
  }, [propStories]);

  return (
    <section className="relative w-full bg-white py-12 lg:py-20 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 mx-auto relative z-10 ">
        {/* ── Section Header ── */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8 sm:mb-10 lg:mb-12">
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
             View all
            </Button>
          </Link>
        </div>

        {/* ── Stories Content ── */}
        {stories.length === 0 ? (
          loading ? (
            /* Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 opacity-60">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
                  <div className="h-3.5 w-1/3 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-5 w-5/6 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3.5 w-3/4 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="bg-gray-50 border border-gray-200 rounded-[28px] p-8 text-center my-6">
              <BookOpen className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-bold text-gray-900">
                No Featured Works Yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Featured works selected in the Editorial catalog will appear here.
              </p>
            </div>
          )
        ) : (
          <div className="w-full overflow-visible">
            <Swiper
              modules={[Navigation]}
              onSwiper={setSwiperInstance}
              spaceBetween={24}
              slidesPerView={1.15}
              breakpoints={{
                480:  { slidesPerView: 1.6,  spaceBetween: 20 },
                640:  { slidesPerView: 2.2,  spaceBetween: 24 },
                768:  { slidesPerView: 2.8,  spaceBetween: 24 },
                1024: { slidesPerView: 4,    spaceBetween: 28 },
                1280: { slidesPerView: 4,    spaceBetween: 32 },
              }}
              className="latest-stories-swiper w-full !pb-4 !overflow-visible"
            >
              {stories.map((story, index) => {
                const badge = getCategoryBadge(story.category);
                const isVideo =
                  story.contentType === "VIDEO" ||
                  story.submissionType === "VIDEO" ||
                  story.category === "VIDEO";

                return (
                  <SwiperSlide key={story.id} className="h-auto">
                    <Link
                      href={story.href || `/works/${story.id}`}
                      className="flex flex-col h-full group/card cursor-pointer"
                    >
                      {/* ── Image ── */}
                      <div className="relative w-full aspect-square rounded-[22px] overflow-hidden bg-gray-100 mb-3 sm:mb-4 shadow-xs">
                        <Image
                          src={story.imageSrc}
                          alt={story.title}
                          fill
                          priority={index < 2}
                          unoptimized
                          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 40vw, 33vw"
                          className="object-cover group-hover/card:scale-[1.04] transition-transform duration-500 ease-out"
                        />

                        {/* Video play indicator */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/75 backdrop-blur-xs flex items-center justify-center shadow-md group-hover/card:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5 text-gray-900" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Title & Category Badge Row ── */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight leading-snug group-hover/card:text-gray-700 transition-colors line-clamp-1">
                          {story.title}
                        </h3>
                        <span
                          className={`${badge.bg} ${badge.text} font-bold text-[10px] sm:text-[11px] tracking-wider uppercase px-2.5 py-0.5 rounded-lg shrink-0 shadow-2xs`}
                        >
                          {story.category}
                        </span>
                      </div>

                      {story.description && (
                        <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
                          {story.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-700 font-medium mt-auto pt-0.5">
                        {story.author}
                      </p>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}

        {/* ── Navigation Arrows ── */}
        {stories.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-5 sm:pt-7">
            <button
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none cursor-pointer shadow-xs"
              aria-label="Previous Story"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none cursor-pointer shadow-xs"
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
