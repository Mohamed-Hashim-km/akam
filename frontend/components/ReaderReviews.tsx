"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

import "swiper/css";

export interface ReviewItem {
  id: string;
  name: string;
  role?: string | null;
  quote: string;
  image?: string | null;
  isPublished?: boolean;
}

export interface ReaderReviewsProps {
  title?: string;
  reviews?: ReviewItem[];
}

export const ReaderReviews: React.FC<ReaderReviewsProps> = ({
  title = "How Akam\nMakes A\nDifference",
  reviews: initialReviews,
}) => {
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(
    initialReviews !== undefined ? initialReviews : []
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialReviews !== undefined) {
      setReviewsList(initialReviews);
      return;
    }

    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/reviews`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.data;
          if (Array.isArray(items) && isMounted) {
            setReviewsList(items);
          }
        }
      } catch (err) {
        console.error("Failed to fetch reader reviews:", err);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [initialReviews]);

  if (reviewsList.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      {/* Decorative Gradient Blob on Bottom Left */}
      <div className="absolute bottom-0 left-0 pointer-events-none z-0 w-[180px] sm:w-[250px] md:w-[337px] h-auto overflow-hidden">
        <svg
          viewBox="0 0 337 325"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto max-w-[337px]"
        >
          <path
            d="M239.66 297.49C300.687 274.308 365.491 191.673 321.701 86.8538C317.198 75.7771 284.169 12.6794 204.046 1.18649C109.35 -9.62177 32.1652 54.2766 27.7575 157.801C16.9609 201.323 3.31777 218.38 -26.2949 238.678C-71.6034 262.638 -100.998 260.22 -138.671 243.497C-175.69 221.306 -250.667 224.234 -289.645 281.124C-319.125 325.844 -327.748 383.625 -269.463 441.903C-208.399 488.059 -119.984 474.818 -81.8159 394.533C-68.9099 349.212 -69.6303 311.131 -2.52576 274.254C46.9769 259.822 72.9869 265.185 116.985 293.309C160.972 311.327 187.646 313.053 239.66 297.49Z"
            fill="url(#paint0_linear_243_113)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_243_113"
              x1="317.222"
              y1="80.2167"
              x2="-285.952"
              y2="426.06"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#28ABE0" />
              <stop offset="0.288092" stopColor="#25B0A3" />
              <stop offset="0.520371" stopColor="#2DB76E" />
              <stop offset="0.6875" stopColor="#56C15B" />
              <stop offset="0.797922" stopColor="#74C84D" />
              <stop offset="1" stopColor="#C7DB28" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ">
          {/* Left Column: Section Title */}
          <div className="lg:col-span-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text leading-[1.2]">
              {title}
            </h2>
          </div>

          {/* Right Column: Review Cards Carousel & Controls */}
          <div className="lg:col-span-9  flex flex-col items-end w-full">
            <div className="w-full">
              <Swiper
                modules={[Navigation, Autoplay]}
                onSwiper={(s) => setSwiperInstance(s)}
                autoplay={{
                  delay: 6000,
                  disableOnInteraction: false,
                }}
                spaceBetween={24}
                slidesPerView={1}
                className="reader-reviews-swiper w-full !pb-2 [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
              >
                {reviewsList.map((item) => {
                  const photoUrl = item.image ? formatAssetUrl(item.image) : null;

                  return (
                    <SwiperSlide key={item.id} className="!h-auto flex flex-col">
                      <div className="bg-[#F7F8F7] rounded-[24px] overflow-hidden flex-1 flex flex-col-reverse md:flex-row border border-gray-100/80 md:min-h-[480px] w-full justify-between">
                        {/* Left Side of Card: Quote, Name & Role */}
                        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between flex-1 md:w-3/5">
                          {/* Quote Content */}
                          <div>
                            <p className="text-base sm:text-lg italic text-gray-800 font-normal leading-relaxed">
                              &ldquo;{item.quote}&rdquo;
                            </p>
                          </div>

                          {/* Reviewer Details */}
                          <div className="mt-6 sm:mt-8 pt-2 sm:pt-4">
                            <h4 className="text-base sm:text-lg font-semibold text-dark-text">
                              {item.name}
                            </h4>
                            {item.role && (
                              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                                {item.role}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Side of Card: Reviewer Photo */}
                        <div className="relative w-full md:w-2/5 h-[260px] sm:h-[320px] md:h-auto md:min-h-full overflow-hidden bg-gray-100 shrink-0">
                          {photoUrl ? (
                            <Image
                              src={photoUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              className="object-cover object-center"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full min-h-[260px] flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-900 font-bold text-2xl">
                              {item.name[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Circular Navigation Arrow Buttons (Bottom Right) */}
            <div className="flex items-center gap-3 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Previous Review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Next Review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReaderReviews;
