"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface Story {
  id: string;
  category: string;
  categoryColor: string;
  bgColor: string;
  title: string;
  author: string;
  readTime?: string;
  href?: string;
  featuredButton?: boolean;
}

export interface LatestStoriesProps {
  title?: string;
  viewAllHref?: string;
  stories?: Story[];
}

const defaultStories: Story[] = [
  {
    id: "1",
    category: "SUSPENSE",
    categoryColor: "text-red-500",
    bgColor: "bg-[#FCD3D1]", // Soft pastel red
    title: "The Secret That Changed Everything",
    author: "By Arjun Malhotra",
    featuredButton: true, // Solid black button like in screenshot
  },
  {
    id: "2",
    category: "CRIME",
    categoryColor: "text-amber-600",
    bgColor: "bg-[#FBE4C4]", // Soft pastel peach/yellow
    title: "A Case That Refused to Stay Buried",
    author: "By Maya Menon",
    featuredButton: false,
  },
  {
    id: "3",
    category: "COMEDY",
    categoryColor: "text-purple-600",
    bgColor: "bg-[#E3CAFF]", // Soft pastel lavender
    title: "Nothing Went According to Plan",
    author: "By Rohan Kapoor",
    featuredButton: false,
  },
  {
    id: "4",
    category: "CRIME",
    categoryColor: "text-fuchsia-600",
    bgColor: "bg-[#F7CEF7]", // Soft pastel pink/magenta
    title: "Behind Every Choice Lies a Story",
    author: "By Ananya Rao",
    featuredButton: false,
  },
  {
    id: "5",
    category: "THRILLER",
    categoryColor: "text-sky-600",
    bgColor: "bg-[#CBEBFB]", // Soft pastel cyan/blue
    title: "Some Truths Are Better Left Hidden",
    author: "By Vikram Shetty",
    featuredButton: false,
  },
  {
    id: "6",
    category: "ROMANCE",
    categoryColor: "text-emerald-600",
    bgColor: "bg-[#C7F4D9]", // Soft pastel mint green
    title: "When Two Paths Cross Again",
    author: "By Neha Kulkarni",
    featuredButton: false,
  },
];

export const LatestStories: React.FC<LatestStoriesProps> = ({
  title = "Latest Stories",
  viewAllHref = "#releases",
  stories = defaultStories,
}) => {
  return (
    <section className="relative w-full bg-white py-16 lg:py-24  overflow-hidden font-poppins">
      {/* Background Decorative Glowing Ambient Orbs */}
      <div className="absolute top-6 -left-0 w-32 h-32 bg-[#D365D8] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-0 w-32 h-32 bg-[#6FC7E6] rounded-full filter blur-3xl pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-bg tracking-tight">
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
              View All Releases
            </Button>
          </Link>
        </div>

        {/* Stories Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {stories.map((story) => (
            <div
              key={story.id}
              className={`${story.bgColor} rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group min-h-[220px]`}
            >
              {/* Top Category Badge with subtle divider */}
              <div>
                <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
                  <span className={`text-xs font-semibold tracking-wider uppercase ${story.categoryColor}`}>
                    {story.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-semibold text-dark-bg tracking-tight leading-snug mb-4 group-hover:text-black/85 transition-colors">
                  {story.title}
                </h3>
              </div>

              {/* Card Footer: Author + Read Story Button */}
              <div className="flex items-center justify-between gap-3 pt-4">
                <span className="text-sm font-medium text-dark-bg/70">
                  {story.author}
                </span>

                <Link href={story.href || `#story-${story.id}`}>
                  <button className="bg-white/50 border border-black/20 text-dark-bg px-4 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-all duration-300 group-hover:bg-dark-bg group-hover:text-white group-hover:border-dark-bg group/btn shadow-xs">
                    <span>Read Story</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestStories;
