"use client";

import React from "react";
import Image from "next/image";

export interface EditionItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
}

export interface PreviousEditionsProps {
  title?: string;
  editions?: EditionItem[];
}

const defaultEditions: EditionItem[] = [
  {
    id: "1",
    title: "Akam-September 2025",
    imageSrc: "/images/editions/akam-sep-2025.jpg",
    imageAlt: "Akam September 2025 Edition",
  },
  {
    id: "2",
    title: "Akam-September 2024",
    imageSrc: "/images/editions/akam-sep-2024.jpg",
    imageAlt: "Akam September 2024 Edition",
  },
  {
    id: "3",
    title: "Akam-September 2023",
    imageSrc: "/images/editions/akam-sep-2023.jpg",
    imageAlt: "Akam September 2023 Edition",
  },
];

export const PreviousEditions: React.FC<PreviousEditionsProps> = ({
  title = "Previous Editions",
  editions = defaultEditions,
}) => {
  return (
    <section className="relative w-full bg-white py-12 lg:py-20 font-poppins overflow-hidden">
      {/* Decorative Accent Orbs */}
     
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12 text-left">
          {title}
        </h2>

        {/* Editions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 items-start">
          {editions.map((edition) => (
            <div key={edition.id} className="flex flex-col group cursor-pointer">
              {/* Cover Image Container */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden  transition-all duration-300 bg-gray-100">
                <Image
                  src={edition.imageSrc}
                  alt={edition.imageAlt || edition.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-dark-text tracking-tight mt-4 group-hover:text-black transition-colors">
                {edition.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PreviousEditions;
