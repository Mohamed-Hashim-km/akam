"use client";

import React from "react";
import { Mail } from "lucide-react";

export interface ContactSectionProps {
  title?: string;
  email?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "Get in Touch",
  email = "akamliveconnect@gmail.com",
}) => {
  return (
    <section className="relative w-full bg-white pt-12 sm:pt-16 lg:pt-20 pb-0 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10 text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-semibold text-dark-text tracking-tight mb-3 font-poppins">
          {title}
        </h1>

        <p className="text-sm sm:text-base text-gray-500 font-normal leading-relaxed">
          Have questions regarding submissions, subscriptions, or feedback?
        </p>

        <p className="text-sm sm:text-base text-gray-600 font-medium mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Email us directly at</span>
          <a
            href={`mailto:${email}`}
            className="font-semibold text-gray-950 underline underline-offset-4 hover:text-emerald-700 transition-colors"
          >
            {email}
          </a>
        </p>
      </div>
    </section>
  );
};

export default ContactSection;
