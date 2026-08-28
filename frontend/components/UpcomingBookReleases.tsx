"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface BookReleaseItem {
  id: string;
  title: string;
  author: string;
  editionTag?: string;
  description: string;
  preorderHref?: string;
}

export interface UpcomingBookReleasesProps {
  title?: string;
  viewAllHref?: string;
  releases?: BookReleaseItem[];
}

const defaultReleases: BookReleaseItem[] = [
  {
    id: "1",
    title: "Before Darkness Falls",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
  },
  {
    id: "2",
    title: "Without the Sea Knowing",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
  },
  {
    id: "3",
    title: "Before Darkness Falls",
    author: "By Priyanka Menon",
    editionTag: "Print Edition",
    description: "The novel published on Akam is now available as a book.",
  },
];

export const UpcomingBookReleases: React.FC<UpcomingBookReleasesProps> = ({
  title = "Upcoming Book Releases",
  viewAllHref = "#releases",
  releases = defaultReleases,
}) => {
  return (
    <section className="relative w-full bg-gradient-to-b from-[#EBE0FF] to-white py-16 lg:py-24  font-poppins overflow-hidden">
      {/* Soft Ambient Background Orbs */}


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

        {/* 3-Column Releases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {releases.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between w-full h-full shadow-xs hover:shadow-lg transition-all duration-300 group border border-purple-100/80 min-h-[280px]"
            >
              <div>
                {/* Header: Title + Tag */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-dark-bg tracking-tight leading-tight">
                    {item.title}
                  </h3>
                  {item.editionTag && (
                    <span className="bg-[#F5EDFF] text-[#8122DB] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0">
                      {item.editionTag}
                    </span>
                  )}
                </div>

                {/* Author Name */}
                <p className="text-sm font-medium text-dark-bg/60 mb-4">
                  {item.author}
                </p>

                {/* Light Purple Divider */}
                <div className="border-b-2 border-[#EBE0FF] mt-12 mb-5" />

                {/* Description */}
                <p className="text-sm sm:text-base text-dark-bg/75 leading-relaxed font-normal mb-6">
                  {item.description}
                </p>
              </div>

              {/* Bottom Pre-order Button */}
              <div className="pt-2">
                <Link href={item.preorderHref || `#preorder-${item.id}`}>
                  <button className="w-full bg-white border border-black/20 text-dark-bg py-2.5 px-5 rounded-full text-sm font-medium inline-flex items-center justify-between transition-all duration-300 group-hover:bg-dark-bg group-hover:text-white group-hover:border-dark-bg shadow-xs group/btn">
                    <span>Pre-order</span>
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

export default UpcomingBookReleases;
