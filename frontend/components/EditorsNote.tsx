"use client";

import React from "react";
import Image from "next/image";

export interface EditorsNoteProps {
  title?: string;
  note?: string;
  bgImageSrc?: string;
  bgImageAlt?: string;
}

export const EditorsNote: React.FC<EditorsNoteProps> = ({
  title = "Editor's Note",
  note = "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
  bgImageSrc = "/images/home/editorialNot.webp",
  bgImageAlt = "Editor's workspace desk with laptop, open notebook and books",
}) => {
  return (
    <section className="relative w-full overflow-hidden min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] flex items-center py-12 lg:py-16 font-poppins">
      {/* Full-width Background Image */}
      <Image
        src={bgImageSrc}
        alt={bgImageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center pointer-events-none"
      />

      {/* Soft Ambient Overlay for maximum readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

      {/* Container aligned for Content Card */}
      <div className="container px-4 mx-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-7 sm:p-9 md:p-11 max-w-lg lg:max-w-xl shadow-xl border border-white/50 my-4">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-dark-bg tracking-tight">
            {title}
          </h3>

          <p className="text-sm sm:text-base lg:text-lg text-dark-bg/85 font-normal leading-relaxed mt-4 sm:mt-5">
            {note}
          </p>
        </div>
      </div>
    </section>
  );


};

export default EditorsNote;
