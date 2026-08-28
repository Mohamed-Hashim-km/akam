"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, PenTool } from "lucide-react";

export interface FooterProps {
  headline?: string;
  subheadline?: string;
  startWritingHref?: string;
  editorialGuidelinesHref?: string;
  masikaHref?: string;
  eventsHref?: string;
  mediaHref?: string;
  aboutHref?: string;
  contactHref?: string;
}

export const Footer: React.FC<FooterProps> = ({
  headline = "Share Your Stories with India’s Digital Literary Audience",
  subheadline = "Write multi-part serialized novels, poetry cycles, or cultural essays. Every submission is read by the AKAM editorial board before reaching our reader community.",
  startWritingHref = "#start-writing",
  editorialGuidelinesHref = "#editorial-guidelines",
  masikaHref = "/masika",
  eventsHref = "/events",
  mediaHref = "/media",
  aboutHref = "/about",
  contactHref = "/contact",
}) => {
  return (
    <footer className="w-full bg-[#22B573] py-12 lg:py-16 px-4 sm:px-6 lg:px-12 font-poppins text-white">
      <div className="container px-4 mx-auto">
        {/* Top Call To Action Banner Row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 pb-10 lg:pb-12">
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
              {headline}
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-normal leading-relaxed">
              {subheadline}
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link href={startWritingHref}>
              <button className="bg-white text-dark-bg hover:bg-slate-100 font-medium px-6 py-3 rounded-full text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md group">
                <PenTool className="w-4 h-4 text-dark-bg" />
                <span>Start Writing Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <Link href={editorialGuidelinesHref}>
              <button className="border border-white/80 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-full text-sm sm:text-base transition-all">
                Editorial Guidelines
              </button>
            </Link>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-b border-white/25 w-full my-4" />

        {/* Bottom Bar: Copyright + Nav Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs sm:text-sm text-white/90">
          <p className="font-normal text-center sm:text-left">
            &copy; {new Date().getFullYear()} Akam &middot; India&apos;s First Digital Literary Channel &mdash; every story here passed editorial review
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5 sm:gap-6 font-medium">
           
            <Link href={aboutHref} className="hover:text-white hover:underline transition-colors">
              About Akam
            </Link>
            <Link href={contactHref} className="hover:text-white hover:underline transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
