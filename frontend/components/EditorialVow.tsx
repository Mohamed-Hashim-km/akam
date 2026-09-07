"use client";

import React from "react";
import Image from "next/image";

export interface EditorialVowProps {
  title?: string;
  paragraph1?: string;
  paragraph2?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const EditorialVow: React.FC<EditorialVowProps> = ({
  title = "Our Editorial Vow",
  paragraph1 = "At Akam, we believe true literature exists to illuminate the human condition. Our editorial mission is centered on depth over brevity, nuance over noise, and authenticity over trends.",
  paragraph2 = "We curate works that honor Kerala's rich literary lineage—from classic poetry and regional dialects to contemporary prose and critical commentary. By providing an unhurried space for essayists, poets, and thinkers, we aim to nourish the intellectual and cultural life of the Malayalam-speaking world across generations.",
  imageSrc = "/images/about/editorialTeam.webp",
  imageAlt = "Akam Editorial Team",
}) => {
  return (
    <section className="relative w-full bg-white py-12 sm:py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 sm:px-6 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Side Text Content */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-5 sm:mb-6 text-left font-poppins">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed mb-4 sm:mb-6 font-poppins">
              {paragraph1}
            </p>

            <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed font-poppins">
              {paragraph2}
            </p>
          </div>

          {/* Right Side Team Image Container */}
          <div className="lg:col-span-6 w-full relative group">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[420px] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialVow;
