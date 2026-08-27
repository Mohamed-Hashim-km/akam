"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

export interface HeroSectionProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  headline = "Malayalam's\nmodern voice.\nYour literary home.",
  subheadline = "Discover stories, voices, and ideas that celebrate the richness of Malayalam literature and culture.",
  ctaText = "Explore Stories",
  ctaHref = "#explore",
  imageSrc = "/images/home/hero.webp",
  imageAlt = "Malayalam literary readers",
}) => {
  // 1. Changed py-12 lg:py-20 to pt-12 lg:pt-20 pb-0 to remove bottom padding
  return (
    <section className="relative w-full bg-accent-yellow overflow-hidden pt-12 lg:pt-20 pb-0 px-4 sm:px-6 lg:px-12">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-[15%] -left-6 w-24 h-24 bg-[#6FC7E6] rounded-full filter blur-xl pointer-events-none animate-float" />
      <div className="absolute top-[10%] left-1/2 w-32 h-32 bg-[#D1B6FF] rounded-full filter blur-xl pointer-events-none animate-float-delayed" />
      <div className="absolute top-12 -right-5 w-20 h-20 bg-[#D365D8] rounded-full filter blur-xl pointer-events-none animate-float" />
      <div className="absolute bottom-10 right-[10%] w-20 h-20 bg-[#D365D8] rounded-full filter blur-xl pointer-events-none" />
      <div className="absolute bottom-[15%] -left-6 w-24 h-24 bg-[#C1FFE3] rounded-full filter blur-xl pointer-events-none animate-float" />

      {/* Floating Accent Color Circles matching design screenshot */}
      <div className="absolute top-20 left-[22%] w-3 h-3 bg-purple-600 rounded-full animate-bounce duration-1000" />
      <div className="absolute top-14 right-[48%] w-4 h-4 bg-pink-500 rounded-full" />
      <div className="absolute top-24 right-[15%] w-3.5 h-3.5 bg-emerald-500 rounded-full" />
      <div className="absolute top-1/2 right-[3%] w-4 h-4 bg-sky-400 rounded-full" />
      <div className="absolute bottom-20 left-[5%] w-4 h-4 bg-sky-400/80 rounded-full" />
      <div className="absolute bottom-16 left-[34%] w-3 h-3 bg-red-500 rounded-full" />

      {/* 2. Changed items-center to items-stretch so columns can align themselves */}
      <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch relative z-10">

        {/* Left Column: Headlines & CTA */}
        {/* 3. Added flex flex-col justify-center and pb-12 lg:pb-20 so the text remains vertically centered and keeps its bottom padding */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-8 flex flex-col justify-center pb-12 lg:pb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium text-dark-bg tracking-tight leading-[1.1] whitespace-pre-line font-poppins">
            {headline}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-dark-bg/85 max-w-lg font-normal leading-relaxed">
            {subheadline}
          </p>

          <div className="pt-2">
            <a href={ctaHref}>
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                className="group px-6 py-2.5 text-sm font-medium shadow-xs"
              >
                {ctaText}
              </Button>
            </a>
          </div>
        </div>

        {/* Right Column: Seamless Cutout Hero Image */}
        {/* 4. Added self-end to push this specific column flush to the bottom of the section */}
        <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end items-end self-end pt-8 lg:pt-12">
          <div className="relative w-full max-w-xl lg:max-w-3xl xl:max-w-4xl flex justify-center lg:justify-end">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1100}
              height={1100}
              priority
              className="w-full h-auto object-cover max-h-[480px] sm:max-h-[580px] lg:max-h-[660px] xl:max-h-[720px] transform lg:scale-110 xl:scale-115 lg:origin-bottom transition-transform mix-blend-multiply"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;