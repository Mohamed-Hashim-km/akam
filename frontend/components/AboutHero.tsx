"use client";

import React from "react";

export interface AboutHeroProps {
  headline?: string;
  subheadline?: string;
}

export const AboutHero: React.FC<AboutHeroProps> = ({
  headline = "Preserving Heritage,\nChampioning Modern Voices",
  subheadline = "At our core, we believe that literature is the mirror of a society's soul. Rooted in the rich linguistic tradition of Malayalam, our platform brings together classic perspectives and contemporary narratives. Through curated interviews, critical essays, and storytelling, we bridge the past and the future—offering a space where writers, thinkers, and cultural enthusiasts can meet, reflect, and share.",
}) => {
  return (
    <section className="relative w-full bg-[#DBF4FF] py-16 sm:py-24 lg:py-28 font-poppins flex items-center justify-center min-h-[420px] sm:min-h-[480px]">
      <div className="container px-4 mx-auto text-center relative z-10 ">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl  font-semibold text-dark-text text-center mb-8 lg:mb-10 font-poppins whitespace-pre-line leading-[1.25] sm:leading-[1.3] lg:leading-[1.35] tracking-tight">
          {headline}
        </h1>

        <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed text-center w-[80%] mx-auto font-poppins">
          {subheadline}
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
