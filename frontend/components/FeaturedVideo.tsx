"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch } from "@/lib/config";
import { getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/youtube";
import Button from "./ui/Button";

import "swiper/css";
import "swiper/css/navigation";

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  youtubeUrl: string;
  youtubeId: string;
}

export interface FeaturedVideoProps {
  title?: string;
  initialVideos?: VideoItem[];
}

export const FeaturedVideo: React.FC<FeaturedVideoProps> = ({
  title = "Featured Video",
  initialVideos,
}) => {
  const [videoList, setVideoList] = useState<VideoItem[]>(
    initialVideos && initialVideos.length > 0 ? initialVideos : []
  );
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialVideos && initialVideos.length > 0) {
      setVideoList(initialVideos);
      return;
    }

    let isMounted = true;
    const fetchFeaturedVideos = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/media?featured=true&limit=3`);
        if (res.ok) {
          const json = await res.json();
          const fetchedData = json.data || (Array.isArray(json) ? json : []);
          if (isMounted) {
            setVideoList(fetchedData.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured videos", err);
      }
    };

    fetchFeaturedVideos();
    return () => {
      isMounted = false;
    };
  }, [initialVideos]);

  if (videoList.length === 0) {
    return null;
  }

  const renderVideoCard = (video: VideoItem) => {
    const thumbnailUrl = getYouTubeThumbnail(video.youtubeUrl || video.youtubeId || "");
    return (
      <div
        key={video.id}
        onClick={() => setActiveVideo(video)}
        className="group flex flex-col h-full rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white"
      >
        {/* Top Video Thumbnail Frame with Play Overlay */}
        <div className="relative w-full aspect-video rounded-t-3xl overflow-hidden bg-slate-950">
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white border border-white/50 group-hover:scale-110 transition-transform shadow-md">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Bottom Warm Orange/Amber Title Box */}
        <div className="p-5 bg-[#E58826] rounded-b-3xl flex-1 flex items-center min-h-[96px]">
          <h3 className="text-sm sm:text-base font-semibold text-white leading-snug line-clamp-3 font-poppins">
            {video.title}
          </h3>
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full bg-white py-12 sm:py-16 lg:py-20 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        {/* Header: Title Left + "Explore Media ->" Button Right */}
        <div className="flex items-center flex-wrap justify-between gap-4 mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
            {title}
          </h2>

          <Link href="/media">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
            >
              Explore Media
            </Button>
          </Link>
        </div>

        {/* Desktop Static 3-Column Grid Layout (Hidden on Mobile) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch w-full">
          {videoList.map((video) => renderVideoCard(video))}
        </div>

        {/* Mobile Swiper Video Cards Carousel (Hidden on Desktop) */}
        <div className="block md:hidden w-full">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            spaceBetween={16}
            slidesPerView={1.15}
            className="w-full [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
          >
            {videoList.map((video) => (
              <SwiperSlide key={video.id} className="!h-auto !flex !flex-col">
                {renderVideoCard(video)}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Mobile Bottom Right Swiper Navigation Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <button
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
              aria-label="Previous Video"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
              aria-label="Next Video"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist Lightbox Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer border border-white/20"
              aria-label="Close Video"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pure 16:9 YouTube Widescreen Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`${getYouTubeEmbedUrl(activeVideo.youtubeUrl || activeVideo.youtubeId)}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedVideo;
