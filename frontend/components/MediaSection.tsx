"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Play, X, Video, Loader2, ChevronDown } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";
import { getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/youtube";

export interface MediaCardItem {
  id: string;
  title: string;
  description: string;
  category: string;
  youtubeUrl: string;
  youtubeId: string;
  createdAt?: string;
}

export interface MediaSectionProps {
  title?: string;
  initialCategory?: string;
}

const mediaCategories = [
  { id: "interviews", label: "Interviews" },
  { id: "conversations", label: "Conversations" },
  { id: "cultural", label: "Cultural Programmes" },
  { id: "recordings", label: "Event Recordings" },
];

export const MediaSection: React.FC<MediaSectionProps> = ({
  title = "Media",
  initialCategory = "interviews",
}) => {
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [mediaList, setMediaList] = useState<MediaCardItem[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 6, totalPages: 1 });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MediaCardItem | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Fetch initial page 1 whenever active category tab changes
  useEffect(() => {
    let isMounted = true;
    setLoadingInitial(true);
    setPage(1);

    const fetchInitial = async () => {
      try {
        const res = await apiFetch(
          `${API_BASE_URL}/media?category=${activeTab}&page=1&limit=6`
        );
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.data) {
            setMediaList(json.data);
            if (json.meta) setMeta(json.meta);
          } else {
            setMediaList(Array.isArray(json) ? json : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial media videos", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Load next page function for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (loadingMore || page >= meta.totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/media?category=${activeTab}&page=${nextPage}&limit=6`
      );
      if (res.ok) {
        const json = await res.json();
        const newItems = json.data || [];
        setMediaList((prev) => [...prev, ...newItems]);
        setPage(nextPage);
        if (json.meta) setMeta(json.meta);
      }
    } catch (err) {
      console.error("Failed to load more media items", err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, page, meta.totalPages, loadingMore]);

  // IntersectionObserver to auto-trigger loadNextPage when sentinel comes into view
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          page < meta.totalPages &&
          !loadingMore &&
          !loadingInitial
        ) {
          loadNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadNextPage, page, meta.totalPages, loadingMore, loadingInitial]);

  const handleTabChange = (catId: string) => {
    if (catId === activeTab) return;
    setActiveTab(catId);
  };

  return (
    <section className="relative w-full bg-white py-10 sm:py-16 lg:py-20 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight text-center mb-8 sm:mb-12 lg:mb-16 font-poppins">
          {title}
        </h1>

        {/* Main Content Layout (Sidebar Tabs on Desktop + Mobile Category Dropdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mx-auto">
          
          {/* Mobile Category Select Dropdown (Shown on screens < lg) */}
          <div className="block lg:hidden w-full mb-2">
        
            <div className="relative w-full">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-base font-semibold text-gray-950 appearance-none outline-none focus:border-black shadow-2xs pr-12 cursor-pointer transition-colors"
              >
                {mediaCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Left Category Tabs (Shown on screens >= lg) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 shrink-0">
            {mediaCategories.map((cat, index) => {
              const isActive = activeTab === cat.id;
              const isLast = index === mediaCategories.length - 1;
              return (
                <div
                  key={cat.id}
                  className={`relative flex flex-col shrink-0 ${
                    !isLast ? "border-b border-[#D0D0D0]" : ""
                  }`}
                >
                  <button
                    onClick={() => handleTabChange(cat.id)}
                    className={`text-left text-base sm:text-lg lg:text-xl transition-all duration-200 pb-2.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "font-semibold text-gray-950"
                        : "font-medium text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </button>

                  {/* Multi-color 3px Linear Gradient Underline on Active Tab */}
                  {isActive && (
                    <div className="h-[3px] w-full rounded-full bg-[linear-gradient(to_right,#29ACD8,#26AFB1,#23B47B,#57C15C,#7FCA49,#D8E021)] -mt-[1px]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side Media Cards Grid */}
          <div className="lg:col-span-9 flex flex-col space-y-8">
            {loadingInitial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col animate-pulse">
                    <div className="w-full aspect-video rounded-xl sm:rounded-2xl bg-gray-200" />
                    <div className="h-5 bg-gray-200 rounded-md w-3/4 mt-3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded-md w-full" />
                  </div>
                ))}
              </div>
            ) : mediaList.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100 p-8">
                <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No Videos Found</h3>
                <p className="text-xs text-gray-500 mt-1">
                  There are no media videos available in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {mediaList.map((item) => {
                  const thumbnailUrl = getYouTubeThumbnail(item.youtubeUrl || item.youtubeId);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVideo(item)}
                      className="flex flex-col group cursor-pointer"
                    >
                      {/* Dynamic YouTube Thumbnail Container */}
                      <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900 shadow-2xs group-hover:shadow-md transition-shadow">
                        <Image
                          src={thumbnailUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white border border-white/40 group-hover:scale-110 transition-transform shadow-md">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-lg font-semibold text-dark-bg tracking-tight mt-3 group-hover:text-black transition-colors font-poppins">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-500 font-normal leading-relaxed mt-1 line-clamp-3 font-poppins">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Intersection Observer Sentinel & Loading Indicator */}
            <div ref={observerTarget} className="flex justify-center py-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-2xs animate-in fade-in">
                  <Loader2 className="w-4 h-4 animate-spin text-[#21B573]" />
                  <span>Loading more videos...</span>
                </div>
              )}
{/* 
              {!loadingInitial && !loadingMore && page >= meta.totalPages && mediaList.length > 0 && (
                <p className="text-xs text-gray-400 font-normal">
                  Showing all {meta.total} videos in {mediaCategories.find((c) => c.id === activeTab)?.label}
                </p>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Video Lightbox Modal (Only Video + Floating Close Button) */}
      {selectedVideo && (
        <div
          onClick={() => setSelectedVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-default"
          >
            {/* Floating Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 cursor-pointer shadow-md"
              aria-label="Close video modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pure 16:9 Video Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <iframe
                src={`${getYouTubeEmbedUrl(selectedVideo.youtubeUrl || selectedVideo.youtubeId)}?autoplay=1`}
                title={selectedVideo.title}
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

export default MediaSection;
