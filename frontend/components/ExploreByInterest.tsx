"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  color: string;
  href?: string;
}

export interface ExploreByInterestProps {
  title?: string;
  categories?: CategoryItem[];
}

const defaultCategories: CategoryItem[] = [
  {
    id: "1",
    title: "Children's Literature",
    description: "Engaging stories and rhymes to inspire young readers.",
    imageSrc: "/images/categories/childrens.jpg",
    imageAlt: "Children's Literature storybooks",
    color: "#29ABE1",
  },
  {
    id: "2",
    title: "Fiction & Serialized Novels",
    description: "Captivating multi-part stories and rich immersive long-form fiction.",
    imageSrc: "/images/categories/fiction.jpg",
    imageAlt: "Fiction & Serialized Novels",
    color: "#21B573",
  },
  {
    id: "3",
    title: "Malayalam Literature",
    description: "Classic works, essays, and deep cultural literary studies.",
    imageSrc: "/images/categories/malayalam-lit.jpg",
    imageAlt: "Malayalam Literature books",
    color: "#DF882B",
  },
  {
    id: "4",
    title: "Novella",
    description: "Deep short-novel stories offering rich, concise narrative arcs.",
    imageSrc: "/images/categories/novella.jpg",
    imageAlt: "Novella short novels",
    color: "#D9DF20",
  },
  {
    id: "5",
    title: "Poetry & Masika",
    description: "Expressive verse, contemporary poems, and digital magazine editions.",
    imageSrc: "/images/categories/poetry.jpg",
    imageAlt: "Poetry & Masika open book",
    color: "#29ABE1",
  },
  {
    id: "6",
    title: "Tech & Digital Culture",
    description: "Insightful essays exploring technology, society, and cyber culture.",
    imageSrc: "/images/categories/tech-culture.jpg",
    imageAlt: "Tech & Digital Culture laptop",
    color: "#21B573",
  },
  {
    id: "7",
    title: "Translations",
    description: "Translated literary works connecting Malayalam with world literature.",
    imageSrc: "/images/categories/translations.jpg",
    imageAlt: "Translations of literary works",
    color: "#DF882B",
  },
];

export const ExploreByInterest: React.FC<ExploreByInterestProps> = ({
  title = "Explore By Interest",
  categories = defaultCategories,
}) => {
  const [activeId, setActiveId] = useState<string>("1");

  return (
    <section className="relative w-full bg-white py-14 lg:py-24 font-poppins overflow-hidden">
      {/* Decorative Dots */}
      
      <div className="container px-4 mx-auto relative z-10">
        {/* Centered Section Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-center text-dark-text tracking-tight mb-10 lg:mb-14">
          {title}
        </h2>

        {/* Expanding Accordion Container */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 lg:gap-4 h-auto sm:h-[420px] lg:h-[460px] w-full">
          {categories.map((cat) => {
            const isActive = cat.id === activeId;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveId(cat.id)}
                onClick={() => setActiveId(cat.id)}
                className={`relative rounded-[22px] sm:rounded-[28px] overflow-hidden transition-all duration-500 ease-in-out cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "flex-[4.5] min-w-0 min-h-[320px] sm:min-h-0 shadow-lg"
                    : "flex-1 min-h-[70px] sm:min-h-0"
                }`}
                style={{
                  backgroundColor: isActive ? "#29ABE1" : cat.color,
                }}
              >
                {/* Expanded Card View (Reveals smoothly with fixed width text box) */}
                <div
                  className={`absolute inset-0 w-full h-full p-6 sm:p-8 lg:p-10 flex flex-col justify-end z-10 transition-opacity duration-300 ${
                    isActive ? "opacity-100 pointer-events-auto delay-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {/* Background Image */}
                  <Image
                    src={cat.imageSrc}
                    alt={cat.imageAlt || cat.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center z-0"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#29ABE1]/95 via-[#29ABE1]/80 to-[#29ABE1]/40 z-0" />

                  {/* Fixed-width Content Container prevents text from wrapping word-by-word during flex expansion */}
                  <div className="relative z-10 w-[260px] sm:w-[320px] lg:w-[380px]">
                    <h3 className="text-2xl sm:text-3xl lg:text-3xl font-semibold text-white tracking-tight mb-2 whitespace-normal">
                      {cat.title} 
                    </h3>

                    <p className="text-xs sm:text-sm lg:text-base text-white/90 font-normal leading-relaxed mb-5 lg:mb-6 whitespace-normal">
                      {cat.description}
                    </p>

                    <Link href={cat.href || `#category-${cat.id}`}>
                     <Button
                                  variant="primary"
                                  size="md"
                                  icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                                  iconPosition="right"
                                  className="group px-6 py-2.5 text-sm font-medium shadow-xs"
                                >
                        Join Community
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Collapsed Vertical Strip View */}
                <div
                  className={`w-full h-full flex items-start justify-center px-3 py-8 transition-opacity duration-300 ${
                    isActive ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                  }`}
                >
                  <span
                    className="text-dark-text font-semibold text-sm sm:text-base lg:text-lg tracking-wide whitespace-nowrap select-none hidden sm:block"
                    style={{
                      writingMode: "vertical-lr",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {cat.title}
                  </span>
                  <span className="text-dark-text font-medium text-sm tracking-wide whitespace-nowrap select-none block sm:hidden">
                    {cat.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExploreByInterest;
