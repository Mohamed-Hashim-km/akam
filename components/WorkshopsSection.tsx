"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  imageSrc: string;
  imageAlt?: string;
  bgColor?: string;
  isPrimaryButton?: boolean;
}

export interface WorkshopsSectionProps {
  title?: string;
  workshops?: WorkshopItem[];
}

const defaultWorkshops: WorkshopItem[] = [
  {
    id: "1",
    title: "Malayalam Creative Writing Masterclass",
    description:
      "A hands-on interactive session on character development, narrative pacing, and modern storytelling techniques led by published authors.",
    location: "Calicut Town Hall & Online Stream",
    time: "02:00 PM",
    day: "21",
    monthYear: "Oct 2026",
    imageSrc: "/images/workshops/writing-masterclass.jpg",
  },
  {
    id: "2",
    title: "Literary Translation & Craft Workshop",
    description:
      "Practical exercises and guidance on translating Malayalam prose and poetry into global languages while preserving nuanced cultural themes.",
    location: "Calicut Town Hall & Online Stream",
    time: "02:00 PM",
    day: "29",
    monthYear: "Oct 2026",
    imageSrc: "/images/workshops/translation-workshop.jpg",
  },
];

export const WorkshopsSection: React.FC<WorkshopsSectionProps> = ({
  title = "Workshops",
  workshops = defaultWorkshops,
}) => {
  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12 text-left">
          {title}
        </h2>

        {/* Workshops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mx-auto">
          {workshops.map((item) => (
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

                  {/* Meta details (Location & Time) */}
                  <div className="space-y-2.5 text-xs sm:text-sm text-[#5A6560C2] font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5A6560C2] shrink-0" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Divider & Registration Button */}
                <div className="mt-6">
                  <div className="border-b border-gray-200/60 mb-6 w-full" />

                  <div className="flex items-center justify-between">
                    {/* Date */}
                    <div className="flex flex-col">
                      <span className="text-3xl sm:text-4xl font-semibold text-dark-text tracking-tight leading-none">
                        {item.day}
                      </span>
                      <span className="text-xs text-[#5A6560C2] font-normal mt-1">
                        {item.monthYear}
                      </span>
                    </div>

                    {/* Registration Button using shared Button component */}
                    <Button
                      variant="outline"
                      size="md"
                      icon={<ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />}
                      iconPosition="right"
                      className="px-5 py-2 text-xs sm:text-sm font-semibold border-gray-300 text-gray-900 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300"
                    >
                      Register Now
                    </Button>
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

export default WorkshopsSection;
