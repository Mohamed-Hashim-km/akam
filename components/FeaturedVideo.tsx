"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";

export interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnailSrc: string;
  videoUrl?: string; // YouTube / Vimeo / MP4 video link
  thumbnailAlt?: string;
}

export interface FeaturedVideoProps {
  title?: string;
  videos?: VideoItem[];
}

const defaultVideos: VideoItem[] = [
  {
    id: "1",
    title: "Akam Kuttikkoottam: Magical Tales of Kerala",
    subtitle: "കുട്ടികൾക്കായുള്ള കഥകളും കവിതകളും.",
    thumbnailSrc: "/images/featured-videos/video-1.jpg",
    thumbnailAlt: "Akam Kuttikkoottam story telling session with children",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "2",
    title: "Akam Kuttikkoottam: Magical Tales of Kerala",
    subtitle: "കുട്ടികൾക്കായുള്ള കഥകളും കവിതകളും.",
    thumbnailSrc: "/images/featured-videos/video-2.jpg",
    thumbnailAlt: "Grandmother reading stories to children",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

export const FeaturedVideo: React.FC<FeaturedVideoProps> = ({
  title = "Featured Video",
  videos = defaultVideos,
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  return (
    <section className="relative w-full bg-white py-16 lg:py-24  font-poppins overflow-hidden">
      {/* Ambient background glow dots */}
      <div className="absolute top-10 right-4 w-40 h-40 bg-yellow-200/30 rounded-full filter blur-3xl pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Title */}
        <div className="mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
            {title}
          </h2>
        </div>

        {/* 2-Column Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 group cursor-pointer border border-black/5 bg-[#FDF0EC]"
            >
              {/* Top Video Thumbnail Container with Centered Play Button Overlay */}
              <div className="relative w-full h-64 sm:h-72 lg:h-80 overflow-hidden bg-slate-200 flex items-center justify-center">
                <Image
                  src={video.thumbnailSrc}
                  alt={video.thumbnailAlt || video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Translucent Glassmorphism Play Button Overlay */}
                <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-white/60 transition-all duration-300">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white ml-1" />
                </div>
              </div>

              {/* Bottom Pastel Pink Content Box */}
              <div className="p-6 sm:p-7 bg-[#FDF0EC]">
                <h3 className="text-lg sm:text-xl font-semibold text-dark-bg tracking-tight leading-snug">
                  {video.title}
                </h3>
                <p className="text-xs sm:text-sm text-dark-bg/70 mt-2 font-medium">
                  {video.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Popup */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player */}
            <div className="relative w-full aspect-video">
              <iframe
                src={activeVideo.videoUrl}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedVideo;
