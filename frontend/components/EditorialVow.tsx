"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface EditorialAuthor {
  id: string;
  name: string;
  role: string;
  imageSrc: string;
}

export interface EditorialVowProps {
  title?: string;
  paragraph1?: string;
  paragraph2?: string;
  authors?: EditorialAuthor[];
}

const DEFAULT_AUTHORS: EditorialAuthor[] = [
  {
    id: "1",
    name: "T. Padmanabhan",
    role: "Iconic master of Malayalam short stories",
    imageSrc: "/images/about/padmanabhan.jpg",
  },
  {
    id: "2",
    name: "Sunandha Nair",
    role: "Iconic master of Malayalam poems",
    imageSrc: "/images/about/sunandha.jpg",
  },
  {
    id: "3",
    name: "Reena Padmarajan",
    role: "Iconic master of Malayalam contemporary prose",
    imageSrc: "/images/about/reena.jpg",
  },
  {
    id: "4",
    name: "K. Sachidanandan",
    role: "Iconic master of Malayalam poetry & criticism",
    imageSrc: "/images/about/sachidanandan.jpg",
  },
];

export const EditorialVow: React.FC<EditorialVowProps> = ({
  title = "Our Editorial Vow",
  paragraph1 = "At Akam, we believe true literature exists to illuminate the human condition. Our editorial mission is centered on depth over brevity, nuance over noise, and authenticity over trends.",
  paragraph2 = "We curate works that honor Kerala's rich literary lineage—from classic poetry and regional dialects to contemporary prose and critical commentary. By providing an unhurried space for essayists, poets, and thinkers, we aim to nourish the intellectual and cultural life of the Malayalam-speaking world across generations.",
  authors = DEFAULT_AUTHORS,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll]);

  const handlePrev = () => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 24
      : 300;
    scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 24
      : 300;
    scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
  };

  return (
    <section className="relative w-full bg-white py-14 sm:py-18 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
          
          {/* Left Side: Editorial Mission Text */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-6 sm:mb-8 text-left font-poppins leading-tight">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed mb-4 sm:mb-6 font-poppins">
              {paragraph1}
            </p>

            <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed font-poppins">
              {paragraph2}
            </p>
          </div>

          {/* Right Side: Authors Carousel */}
          <div className="lg:col-span-7 flex flex-col min-w-0 w-full pt-0">
            {/* Horizontal Scroll Track */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth pb-4 pt-0 no-scrollbar select-none"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="w-[240px] sm:w-[270px] md:w-[290px] shrink-0 flex flex-col group cursor-pointer"
                >
                  {/* Portrait Card Image */}
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100 rounded-sm">
                    <Image
                      src={author.imageSrc}
                      alt={author.name}
                      fill
                      sizes="(max-width: 640px) 240px, (max-width: 768px) 270px, 290px"
                      className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
                    />
                  </div>

                  {/* Author Name and Subtitle */}
                  <div className="mt-3.5 sm:mt-4 text-left">
                    <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight leading-snug font-poppins group-hover:text-emerald-800 transition-colors">
                      {author.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed mt-0.5 font-poppins">
                      {author.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Navigation Buttons (Bottom Right) */}
            <div className="flex items-center justify-end gap-3 mt-4 sm:mt-6 pr-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canScrollLeft}
                aria-label="Previous authors"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? "border-gray-400 text-gray-800 hover:border-gray-950 hover:bg-gray-100 cursor-pointer active:scale-95"
                    : "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canScrollRight}
                aria-label="Next authors"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight
                    ? "border-gray-400 text-gray-800 hover:border-gray-950 hover:bg-gray-100 cursor-pointer active:scale-95"
                    : "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                }`}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default EditorialVow;
