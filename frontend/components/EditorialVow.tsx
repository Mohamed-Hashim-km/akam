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
  imageSrc = "/images/about/editorial.png",
  imageAlt = "Akam Editorial Team",
}) => {
  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-stretch mx-auto">

          {/* Left Side Text Content */}
          <div className="lg:col-span-5 flex flex-col md:py-10 justify-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-6 sm:mb-8 text-left font-poppins">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed mb-6 font-poppins">
              {paragraph1}
            </p>

            <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed font-poppins">
              {paragraph2}
            </p>
          </div>

          {/* Right Side Team Image */}
          <div className="lg:col-span-7 relative w-full min-h-[280px] sm:min-h-[340px] h-full rounded-3xl overflow-hidden bg-gray-100 shadow-xs">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-fill object-center"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default EditorialVow;
