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
    <section className="relative w-full bg-[#F9F9F9] py-16 lg:pt-16 lg:pb-24 font-poppins">
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
              className="rounded-3xl overflow-hidden  transition-all duration-300 group cursor-pointer border border-black/5 bg-[#FDF0EC]"
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

      {/* Bottom Right Decorative SVG doodle overlapping next component */}
      <div className="absolute -bottom-20 right-0 sm:right-0 lg:right-0 z-20 pointer-events-none  origin-bottom-right">
        <svg width="150" height="143" viewBox="0 0 195 143" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M153.333 80.3722L153.761 80.3118C154.042 82.3616 154.171 84.3855 154.171 86.3878C154.171 90.9274 153.505 95.3592 152.425 99.7608C149.696 110.86 142.545 119.762 132.441 125.087C125.818 128.578 118.831 130.494 111.395 131.642C107.4 132.259 103.37 132.635 99.384 132.635C90.1058 132.635 81.0352 130.594 73.1491 124.781L73.4042 124.436L73.7414 124.703C71.6099 127.396 68.2895 131.029 63.5207 134.438C61.8 135.668 58.7044 137.852 54.1733 139.703C46.7326 142.745 40.3209 142.883 36.0449 142.978C35.5175 142.991 34.9987 143 34.4755 143C32.6942 143 30.8611 142.909 28.5956 142.564C14.8123 140.467 7.09054 130.084 3.56258 117.216L3.97762 117.104L3.56688 117.242C2.01475 112.715 0 105.375 0 96.8696C0 93.4907 0.319941 89.9263 1.11114 86.2799C2.62868 79.3064 5.19251 75.237 5.91453 74.141C8.71615 69.8602 12.5338 66.2613 17.1902 63.5728C23.0831 60.1724 29.4516 58.0493 36.2179 56.9791L49.0543 54.9423L49.1235 55.3695L48.6955 55.4212C48.3409 52.379 48.1464 49.4057 48.1464 46.4713C48.1464 42.2596 48.5485 38.1256 49.4477 33.9699C52.0159 22.0943 59.5647 12.592 70.4513 7.17633C76.8803 3.9787 83.586 2.12312 90.7457 1.03567C94.9136 0.401319 99.0122 0 103.128 0C105.856 0 108.589 0.176929 111.356 0.582567C133.241 3.77156 143.907 19.7252 147.842 40.3997L147.418 40.4817L147.353 40.0545L160.047 38.1903C162.49 37.8321 164.915 37.6552 167.323 37.6552C170.497 37.6552 173.649 37.9616 176.796 38.57C195.586 42.3934 202.849 57.3157 205.396 75.0342C206.222 80.7304 207 86.3748 207 92.0969C207 94.5221 206.862 96.9602 206.52 99.4199C205.024 110.29 195.988 118.705 185.253 120.306L171.988 122.282L174.154 113.108L175.482 102.385C175.767 99.9809 175.893 97.5946 175.893 95.2125C175.893 90.6815 175.43 86.1763 174.686 81.5935C174.094 77.9298 173.402 74.5509 171.85 71.3145C169.096 65.6096 164.582 63.8274 159.156 63.8059C156.649 63.8059 153.959 64.2029 151.218 64.8027L151.128 64.3798L151.556 64.3194L153.743 80.3118L153.315 80.3722L152.887 80.4327L150.648 64.0432L151.037 63.9569C153.817 63.3527 156.558 62.9385 159.161 62.9385C164.764 62.9169 169.766 64.9106 172.637 70.9347C174.245 74.292 174.95 77.7658 175.547 81.4467C176.295 86.0598 176.766 90.6124 176.766 95.2039C176.766 97.6161 176.636 100.037 176.347 102.479L175.011 113.25L173.13 121.229L185.132 119.439C195.504 117.894 204.237 109.742 205.668 99.2905C206.001 96.8739 206.14 94.4746 206.14 92.0839C206.14 86.4439 205.37 80.834 204.544 75.1421C201.972 57.5314 194.946 43.1486 176.623 39.3986L176.71 38.9757L176.627 39.3986C173.532 38.7987 170.436 38.4967 167.319 38.4967C164.95 38.4967 162.572 38.6693 160.168 39.0231L147.063 40.9478L146.986 40.5421C143.038 20.0402 132.679 4.57421 111.222 1.41973C108.502 1.02273 105.809 0.845793 103.12 0.845793C99.0598 0.845793 95.0044 1.2428 90.8668 1.87283C83.7719 2.95166 77.1613 4.78134 70.8274 7.9315C60.1614 13.2393 52.8071 22.5085 50.2865 34.1339C49.4002 38.2248 49.0024 42.2985 49.0024 46.4541C49.0024 49.3496 49.1927 52.2883 49.5472 55.3047L49.5948 55.7147L36.3476 57.8162C29.6764 58.8735 23.4117 60.9664 17.6182 64.3064C13.0742 66.9301 9.36037 70.4298 6.63657 74.5984C5.94914 75.6513 3.44583 79.6041 1.95423 86.4525C1.176 90.0299 0.860396 93.5339 0.860396 96.8566C0.860396 105.228 2.84918 112.478 4.3797 116.953V116.966L4.38835 116.979C7.89903 129.679 15.3571 139.656 28.7166 141.701C30.9346 142.038 32.7115 142.128 34.4625 142.128C34.977 142.128 35.4915 142.12 36.0147 142.111C40.282 142.016 46.5424 141.878 53.8318 138.9C58.272 137.084 61.2984 134.952 63.0062 133.731C67.6929 130.378 70.9571 126.809 73.054 124.164L73.3134 123.836L73.6507 124.082C81.3551 129.756 90.2183 131.763 99.3711 131.767C103.305 131.767 107.287 131.396 111.248 130.783C118.624 129.644 125.507 127.754 132.022 124.319C141.923 119.098 148.897 110.415 151.569 99.5537C152.636 95.2039 153.289 90.8411 153.289 86.3878C153.289 84.42 153.164 82.4393 152.887 80.4283L153.315 80.3679L153.333 80.3722ZM117.828 45.3192L117.404 45.4055C116.617 41.4785 115.532 38.2637 113.82 35.1394C111.109 30.2674 106.505 27.195 100.928 26.8411C100.249 26.7893 99.57 26.7634 98.8955 26.7634C95.6313 26.7634 92.4535 27.3762 89.3752 28.6017C81.5367 31.8037 78.908 38.6995 78.895 46.6181C78.895 48.137 78.9945 49.6862 79.1761 51.2527L78.748 51.3001L78.6832 50.8729L117.772 44.8963L117.837 45.3235L117.902 45.7507L78.3719 51.7964L78.32 51.3519C78.1384 49.7596 78.0347 48.1759 78.0347 46.6181C78.0174 38.5398 80.8147 31.1477 89.0552 27.8034C92.233 26.539 95.5232 25.9047 98.8955 25.9047C99.5916 25.9047 100.292 25.9306 100.992 25.9867L100.958 26.4182L100.984 25.9867C106.855 26.3491 111.745 29.6245 114.577 34.7294C116.336 37.9443 117.452 41.2585 118.252 45.2458L118.343 45.6903L117.897 45.7593L117.832 45.3321L117.828 45.3192ZM44.9557 116.267L44.9211 115.835C48.3799 115.563 51.8343 114.886 54.0653 112.582L59.1756 107.313L59.4869 107.615L59.0891 107.783C56.8669 102.544 55.1288 97.1975 54.2252 91.4971L52.3488 79.6386L43.8445 80.9807C41.6439 81.3259 39.508 82.1976 37.5581 83.2592L37.3506 82.8794L37.5841 83.2419C33.0833 86.1202 31.7949 90.2025 31.782 94.9838C31.782 97.0336 32.0284 99.2042 32.3743 101.418C33.7016 109.647 35.872 115.74 44.9557 115.831V116.262L44.9167 115.831L44.9513 116.262V116.694C35.3056 116.655 32.7461 109.772 31.5182 101.547C31.1724 99.3077 30.9173 97.0983 30.9173 94.9795C30.9043 90.0601 32.3224 85.5506 37.1172 82.5083L37.1301 82.4997L37.1431 82.491C39.1492 81.3993 41.3715 80.4888 43.7062 80.1176L53.0622 78.6418L55.0726 91.3503C55.9589 96.9602 57.6754 102.238 59.876 107.433L59.9884 107.697L54.6792 113.168C52.1802 115.736 48.4923 116.401 44.9859 116.685H44.9686H44.9513V116.254L44.9557 116.267ZM122.523 93.5382L122.104 93.4303C122.804 90.7721 123.181 88.0793 123.181 85.3434C123.181 83.9065 123.077 82.4565 122.861 80.998L121.174 69.6142L82.8035 75.4658L84.455 86.1763C85.0949 90.319 86.4525 94.1768 88.5796 97.724C91.1781 102.044 95.2076 104.879 100.21 105.517C101.273 105.651 102.354 105.72 103.431 105.72C111.68 105.712 119.817 101.742 122.108 93.426L122.523 93.5425L122.938 93.659C120.504 102.462 111.922 106.596 103.427 106.588C102.311 106.588 101.196 106.519 100.093 106.376C94.8184 105.707 90.5382 102.691 87.8274 98.1685C85.6397 94.5221 84.2432 90.5563 83.5903 86.3101L81.8091 74.7451L121.896 68.6303L123.712 80.8728C123.937 82.3745 124.041 83.8676 124.041 85.3478C124.041 88.1613 123.652 90.9274 122.938 93.6504V93.6547L122.523 93.5382Z" fill="url(#paint0_linear_114_289)" />
          <defs>
            <linearGradient id="paint0_linear_114_289" x1="-3.05702" y1="82.1045" x2="201.977" y2="50.6798" gradientUnits="userSpaceOnUse">
              <stop stopColor="#29ABE2" />
              <stop offset="0.5" stopColor="#22B573" />
              <stop offset="1" stopColor="#D9E021" />
            </linearGradient>
          </defs>
        </svg>
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
