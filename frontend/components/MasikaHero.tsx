"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface MasikaHeroProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
  imageAlt?: string;
  editionLabel?: string;
  onReadLatest?: () => void;
  latestEditionTitle?: string;
}

export const MasikaHero: React.FC<MasikaHeroProps> = ({
  headline = "Akam Masika",
  subheadline = "The official digital journal of AKAM. Each edition gathers the editorial board's handpicked selection of contemporary Malayalam serialized fiction, poetry, and cultural essays — elevated above community feeds into a curated publication.",
  ctaText = "Read Latest Edition",
  ctaHref = "#latest-edition",
  imageSrc = "/images/masika/masika2.webp",
  imageAlt = "Akam Masika Digital Journal Cover",
  editionLabel = "Digital Journal Edition - 2026",
  onReadLatest,
  latestEditionTitle,
}) => {
  const finalImageSrc = "/images/masika/masika2.webp";

  return (
    <section className="relative w-full bg-[#FAF5ED] overflow-hidden -mt-[90px] min-h-[560px] lg:min-h-[90vh] flex items-stretch font-poppins">
      
      {/* Left Column Text Content (inside container px-4 mx-auto) */}
      <div className="container px-4 mx-auto relative z-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full pt-[85px] pb-12 lg:pt-[105px] lg:pb-16">
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-8 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-950 tracking-tight leading-[1.12]">
              {headline}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-xl">
              {subheadline}
            </p>

            <div className="pt-2">
              {onReadLatest ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                  iconPosition="right"
                  onClick={onReadLatest}
                  className="group px-6 py-3 text-sm font-medium shadow-xs cursor-pointer"
                >
                  {ctaText}
                </Button>
              ) : (
                <Link href={ctaHref}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                    iconPosition="right"
                    className="group px-6 py-3 text-sm font-medium shadow-xs"
                  >
                    {ctaText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Full Book Image Overlapping Navbar (UNCROPPED) */}
      <div className="hidden lg:flex absolute top-0 right-0 bottom-0 items-center justify-end pointer-events-none z-0">
        <div className="relative w-full h-full flex items-center justify-end">
          <Image
            src={finalImageSrc}
            alt={imageAlt}
            width={1400}
            height={1050}
            priority
            className="w-full h-full object-contain object-right-top"
          />
        </div>
      </div>

   

    </section>
  );
};

export default MasikaHero;
