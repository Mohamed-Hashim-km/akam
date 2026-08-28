"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface MediaCardItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  category: string;
}

export interface MediaSectionProps {
  title?: string;
}

const mediaCategories = [
  { id: "interviews", label: "Interviews" },
  { id: "conversations", label: "Conversations" },
  { id: "cultural", label: "Cultural Programmes" },
  { id: "recordings", label: "Event Recordings" },
];

const mediaData: Record<string, MediaCardItem[]> = {
  interviews: [
    {
      id: "1",
      category: "interviews",
      title: "Sambhashanangal",
      description:
        "Unraveling Malayalam literature, art, and heritage through candid dialogues with regional thinkers and visionaries.",
      imageSrc: "/images/media/sambhashanangal.jpg",
    },
    {
      id: "2",
      category: "interviews",
      title: "Vagmozhii",
      description:
        "Deep dives into Kerala's rich literary traditions, oral histories, and contemporary cultural discourse.",
      imageSrc: "/images/media/vagmozhii.jpg",
    },
  ],
  conversations: [
    {
      id: "3",
      category: "conversations",
      title: "Literary Dialogues 2026",
      description:
        "In-depth conversations with contemporary poets and novelists exploring form, narrative style, and regional identity.",
      imageSrc: "/images/media/dialogues.jpg",
    },
    {
      id: "4",
      category: "conversations",
      title: "Voices of Kerala",
      description:
        "Exploration of contemporary Malayalam essays, culture, and artistic heritage with guest critics.",
      imageSrc: "/images/media/voices.jpg",
    },
  ],
  cultural: [
    {
      id: "5",
      category: "cultural",
      title: "Kavya Sandhya",
      description:
        "An evening of traditional and modern Malayalam poetry recitals and musical renditions.",
      imageSrc: "/images/media/kavya.jpg",
    },
    {
      id: "6",
      category: "cultural",
      title: "Natyakalarangam",
      description:
        "Exploring theatrical adaptations of classic Malayalam literature and stage performances.",
      imageSrc: "/images/media/natya.jpg",
    },
  ],
  recordings: [
    {
      id: "7",
      category: "recordings",
      title: "Akam Annual Summit Keynote",
      description:
        "Full video recording of the keynote session from the Akam Annual Summit celebrating regional authors.",
      imageSrc: "/images/media/summit.jpg",
    },
    {
      id: "8",
      category: "recordings",
      title: "Malayalam Authors Panel",
      description:
        "Panel discussion on digital publication trends, independent writing, and archiving literary heritage.",
      imageSrc: "/images/media/panel.jpg",
    },
  ],
};

export const MediaSection: React.FC<MediaSectionProps> = ({
  title = "Media",
}) => {
  const [activeTab, setActiveTab] = useState("interviews");

  const currentCards = mediaData[activeTab] || mediaData.interviews;

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-dark-text tracking-tight text-center mb-12 lg:mb-16 font-poppins">
          {title}
        </h1>

        {/* Main Content Layout (Sidebar Tabs + Cards Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start  mx-auto">

          {/* Left Sidebar Category Tabs */}
          <div className="lg:col-span-3 flex flex-col space-y-6 relative pt-2">
            {mediaCategories.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <div key={cat.id} className="relative flex flex-col">
                  {/* Accent Dot on Active Tab */}
                

                  <button
                    onClick={() => setActiveTab(cat.id)}
                    className={`text-left text-lg sm:text-xl transition-all duration-200 pb-3 border-b border-gray-100 ${
                      isActive
                        ? "font-medium text-gray-950"
                        : "font-medium text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </button>

                  {/* Multi-color 2px Linear Gradient Underline on Active Tab */}
                  {isActive && (
                    <div className="h-[3px] w-full rounded-full bg-[linear-gradient(to_right,#29ACD8,#26AFB1,#23B47B,#57C15C,#7FCA49,#D8E021)] -mt-[1px]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side Media Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {currentCards.map((item) => (
              <div key={item.id} className="flex flex-col group cursor-pointer">
                {/* Header Image */}
                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden  bg-gray-100">
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 40vw"
                    className="object-cover object-center group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                {/* Card Title */}
                <h3 className="text-xl font-semibold text-gray-950 tracking-tight mt-4 group-hover:text-black transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed mt-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default MediaSection;
