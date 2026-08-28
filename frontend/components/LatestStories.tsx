"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "./ui/Button";

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

const defaultStories: Story[] = [
  {
    id: "1",
    category: "DRAMA",
    badgeTextColor: "text-[#D97706]",
    title: "Ramachi",
    author: "By Vinoy Thomas",
    imageSrc: "/images/stories/ramachi.jpg",
  },
  {
    id: "2",
    category: "DRAMA",
    badgeTextColor: "text-[#D97706]",
    title: "Autorikshawkkarante Bharya",
    author: "By M. Mukundan",
    imageSrc: "/images/stories/autorikshaw.jpg",
  },
  {
    id: "3",
    category: "THRILLER",
    badgeTextColor: "text-[#0284C7]",
    title: "Chavukali",
    author: "By E. Santhosh Kumar",
    imageSrc: "/images/stories/chavukali.jpg",
  },
  {
    id: "4",
    category: "COMEDY",
    badgeTextColor: "text-[#9333EA]",
    title: "Penmaaraattam",
    author: "By Benyamin",
    imageSrc: "/images/stories/penmaaraattam.jpg",
  },
  {
    id: "5",
    category: "SUSPENSE",
    badgeTextColor: "text-[#E11D48]",
    title: "Aadujeevitham",
    author: "By Benyamin",
    imageSrc: "/images/stories/aadujeevitham.jpg",
  },
];

export const LatestStories: React.FC<LatestStoriesProps> = ({
  title = "Latest Stories",
  viewAllHref = "#stories",
  stories = defaultStories,
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

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
                            className="group px-6 py-2.5 text-sm font-medium shadow-xs"
                          >
                           View latest stories
                          </Button>
                     
          </Link>
        </div>

        {/* Stories Swiper Carousel */}
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
            {stories.map((story) => (
              <SwiperSlide key={story.id} className="h-auto">
                <div className="flex flex-col h-full group/card cursor-pointer">
                  {/* Image Card Container */}
                  <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-gray-100 mb-4 shadow-xs">
                    <Image
                      src={story.imageSrc}
                      alt={story.title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 30vw"
                      className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />

                    {/* Category Badge overlay on bottom left */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <span
                        className={`bg-white ${
                          story.badgeTextColor || "text-[#D97706]"
                        } font-bold text-[11px] sm:text-xs tracking-wider uppercase px-3.5 py-1.5 rounded-xl `}
                      >
                        {story.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Author Below Card */}
                  <h3 className="text-lg sm:text-xl font-semibold text-dark-text tracking-tight leading-snug mb-1 group-hover/card:text-gray-700 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#646464] font-normal">
                    {story.author}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Bottom Navigation Arrows */}
        <div className="flex items-center gap-3 pt-4 sm:pt-6">
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
      </div>
    </section>
  );
};

export default LatestStories;
