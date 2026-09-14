"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Play, X, Loader2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { API_BASE_URL, apiFetch } from "@/lib/config";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/pagination";

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const serverUrl = API_BASE_URL.replace(/\/api$/, "");
    return `${serverUrl}${url}`;
  }
  return url;
}

export interface PastEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  imageSrc: string;
  images?: string[];
  imageAlt?: string;
  href?: string;
  videoUrl?: string;
}

export interface PastEventArchiveProps {
  title?: string;
  events?: PastEventItem[];
  isLoading?: boolean;
  initialHasMore?: boolean;
}

export const PastEventArchive: React.FC<PastEventArchiveProps> = ({
  title = "Past Event Archive",
  events = [],
  isLoading = false,
  initialHasMore,
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const computeHasMore = (items: PastEventItem[]) => {
    if (initialHasMore !== undefined) return initialHasMore;
    return items.length > 6;
  };

  const initialDisplayList = events.length > 6 ? events.slice(0, 6) : events;

  // Pagination states
  const [eventList, setEventList] = useState<PastEventItem[]>(initialDisplayList);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(computeHasMore(events));
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  React.useEffect(() => {
    const displayList = events.length > 6 ? events.slice(0, 6) : events;
    setEventList(displayList);
    setHasMore(computeHasMore(events));
  }, [events, initialHasMore]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await apiFetch(`${API_BASE_URL}/events/past-archives?page=${nextPage}&limit=6`);
      if (res.ok) {
        const json = await res.json();
        const rawData = json.data || (Array.isArray(json) ? json : []);
        const meta = json.meta;

        const fetchedItems: PastEventItem[] = rawData.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          imageSrc: e.imageSrc || e.image || e.imageUrl || e.coverImage || "",
          images: Array.isArray(e.images) && e.images.length > 0 ? e.images : (e.imageSrc ? [e.imageSrc] : []),
          href: e.registerHref || undefined,
          videoUrl: e.videoUrl || undefined,
        }));

        if (fetchedItems.length > 0) {
          setEventList((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newUnique = fetchedItems.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newUnique];
          });
          setPage(nextPage);
          const isMore = meta ? Boolean(meta.hasMore) : fetchedItems.length >= 6;
          setHasMore(isMore);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch next page of past events", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <section className="relative w-full bg-white py-12 sm:py-16 font-poppins overflow-hidden">
        <div className="container px-4 sm:px-6 mx-auto relative z-10">
          <div className="h-9 bg-gray-200 rounded-md w-60 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 animate-pulse flex flex-col justify-between">
                <div className="w-full aspect-[16/10] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded-md w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!eventList || eventList.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-12 sm:py-16 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 mx-auto relative z-10">
        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 text-left font-poppins">
          {title}
        </h2>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10">
          {eventList.map((item) => {
            const cardImages = Array.isArray(item.images) && item.images.length > 0
              ? item.images
              : [getImageUrl(item.imageSrc) || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800"];

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 group"
              >
                {/* Top Cover Box with Swiper image slider for multiple images - Full Width */}
                <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden group-hover:shadow-sm transition-shadow">
                  {cardImages.length > 1 ? (
                    <Swiper
                      modules={[Pagination, Autoplay]}
                      pagination={{ clickable: true }}
                      autoplay={{ delay: 4000, disableOnInteraction: false }}
                      loop={true}
                      className="w-full h-full [&_.swiper-pagination-bullet]:!w-2 [&_.swiper-pagination-bullet]:!h-2 [&_.swiper-pagination-bullet]:!bg-white/70 [&_.swiper-pagination-bullet-active]:!bg-white [&_.swiper-pagination-bullet-active]:!w-2.5 [&_.swiper-pagination-bullet]:!transition-all"
                    >
                      {cardImages.map((imgUrl, idx) => (
                        <SwiperSlide key={idx} className="relative w-full h-full">
                          <Image
                            src={getImageUrl(imgUrl)}
                            alt={`${item.title} image ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-103 transition-transform duration-500"
                            unoptimized
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <Image
                      src={cardImages[0]}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.srcset = "";
                        target.src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                  )}
                </div>

                {/* Card Content with Padding */}
                <div className="p-5 flex flex-col justify-between grow">
                  <div>
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1 mb-2 font-poppins group-hover:text-sky-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed line-clamp-2 font-poppins mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Location / Watch Recording Action */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{item.location || "Archive Recording"}</span>
                    </div>

                    {item.videoUrl && (
                      <button
                        onClick={() => setActiveVideoUrl(item.videoUrl!)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-800 transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>Watch</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered "View More" Pagination Button - Only shown if there are more cards to load */}
        {hasMore && eventList.length >= 6 && (
          <div className="flex justify-center mt-8 sm:mt-10">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="bg-black hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-full text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>View More</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Video Lightbox Modal */}
      {activeVideoUrl && (
        <div
          onClick={() => setActiveVideoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-default"
          >
            <button
              onClick={() => setActiveVideoUrl(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 cursor-pointer shadow-md"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`${getYouTubeEmbedUrl(activeVideoUrl)}?autoplay=1`}
                title="Event Recording"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PastEventArchive;
