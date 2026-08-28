"use client";

import React from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";

export interface PastEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
}

export interface PastEventArchiveProps {
  title?: string;
  events?: PastEventItem[];
}

const defaultEvents: PastEventItem[] = [
  {
    id: "1",
    title: "Akam Annual Literary Meet 2025",
    description:
      "A recording of the inaugural annual convention celebrating classic Malayalam novelists, featuring keynote addresses and live readings.",
    location: "Trivandrum Public Library Auditorium",
    imageSrc: "/images/past-events/annual-literary-meet.jpg",
  },
  {
    id: "2",
    title: "Poetry in Translation: Crossing Boundaries",
    description:
      "Archived panel discussion on the nuances of translating traditional Malayalam verse into global languages without losing rhythmic essence.",
    location: "Calicut Town Hall & Online Stream",
    imageSrc: "/images/past-events/poetry-translation.jpg",
  },
];

export const PastEventArchive: React.FC<PastEventArchiveProps> = ({
  title = "Past Event Archive",
  events = defaultEvents,
}) => {
  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      {/* Decorative Orbs */}
    
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12 text-left">
          {title}
        </h2>

        {/* Past Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mx-auto">
          {events.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 hover:bg-[#FFE9E4] hover:border-transparent rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 group cursor-pointer"
            >
              {/* Header Image */}
              <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt || item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
              </div>

              {/* Card Body */}
              <div className="p-7 sm:p-8 flex flex-col justify-between flex-1">
                <div>
                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-semibold text-dark-text tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed mt-3 mb-6">
                    {item.description}
                  </p>

                  {/* Location Meta */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5A6560C2] font-medium">
                    <MapPin className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PastEventArchive;
