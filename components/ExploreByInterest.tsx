"use client";

import React from "react";
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
  href?: string;
  featured?: boolean;
}

export interface ExploreByInterestProps {
  title?: string;
  exploreAllHref?: string;
  categories?: CategoryItem[];
}

const defaultCategories: CategoryItem[] = [
  {
    id: "1",
    title: "Children's Literature",
    description: "Engaging stories and rhymes to inspire young readers.",
    imageSrc: "/images/categories/children.jpg",
    imageAlt: "Children's Literature storybooks",
    featured: true,
  },
  {
    id: "2",
    title: "Fiction & Serialized Novels",
    description: "Captivating multi-part stories and rich immersive long-form fiction.",
    imageSrc: "/images/categories/fiction.jpg",
    imageAlt: "Fiction & Serialized Novels",
    featured: false,
  },
  {
    id: "3",
    title: "Malayalam Literature",
    description: "Classic works, essays, and deep cultural literary studies.",
    imageSrc: "/images/categories/malayalam-lit.jpg",
    imageAlt: "Malayalam Literature books",
    featured: false,
  },
  {
    id: "4",
    title: "Novella",
    description: "Deep short-novel stories offering rich, concise narrative arcs.",
    imageSrc: "/images/categories/novella.jpg",
    imageAlt: "Novella short novels",
    featured: false,
  },
  {
    id: "5",
    title: "Poetry & Masika",
    description: "Expressive verse, contemporary poems, and digital magazine editions.",
    imageSrc: "/images/categories/poetry.jpg",
    imageAlt: "Poetry & Masika open book",
    featured: false,
  },
  {
    id: "6",
    title: "Tech & Digital Culture",
    description: "Insightful essays exploring technology, society, and cyber culture.",
    imageSrc: "/images/categories/tech-culture.jpg",
    imageAlt: "Tech & Digital Culture laptop",
    featured: false,
  },
];

export const ExploreByInterest: React.FC<ExploreByInterestProps> = ({
  title = "Explore By Interest",
  exploreAllHref = "#collectives",
  categories = defaultCategories,
}) => {
  return (
    <section className="relative w-full bg-white py-16 lg:py-24  font-poppins overflow-hidden">
      {/* Floating Accent Color Circles matching design screenshot */}
      <div className="absolute top-16 right-8 w-4 h-4 bg-[#E4F953] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -left-3 w-4 h-4 bg-purple-400 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-12 w-3 h-3 bg-pink-400 rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 -right-3 w-5 h-5 bg-sky-400 rounded-full pointer-events-none" />
      <div className="absolute bottom-12 left-1/3 w-3.5 h-3.5 bg-emerald-400 rounded-full pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
            {title}
          </h2>

          <Link href={exploreAllHref}>
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group px-6 py-2.5 text-sm font-medium shadow-xs"
            >
              Explore All Collectives
            </Button>
          </Link>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-black/10 flex flex-col group bg-white"
            >
              {/* Top Image Container */}
              <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-slate-100">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt || item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Bottom Card Content Box */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 bg-white group-hover:bg-accent-yellow transition-colors duration-300">
                <div>
                  <h3 className="text-xl sm:text-2xl font-medium text-dark-bg tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-dark-bg/75 font-normal leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link href={item.href || `#category-${item.id}`}>
                    <button className="w-full py-2.5 px-5 rounded-full text-sm font-medium inline-flex items-center justify-between transition-all duration-300 bg-white/80 border border-black/20 text-dark-bg group-hover:bg-dark-bg group-hover:text-white group-hover:border-dark-bg shadow-xs group/btn">
                      <span>Join Community</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </Link>
                </div>
              </div>


            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreByInterest;
