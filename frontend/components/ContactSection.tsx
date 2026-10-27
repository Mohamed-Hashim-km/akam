"use client";

import React from "react";
import { Mail, MapPin } from "lucide-react";

export interface ContactSectionProps {
  title?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "Get in Touch",
  email = "akamliveconnect@gmail.com",
  address = "Kairali Books Building, Kannur, Kerala",
  mapUrl = "https://maps.app.goo.gl/ABjSw3ZFVQc2bW2J7",
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

        <div className="text-sm sm:text-base text-gray-600 font-medium mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <p className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Email us directly at</span>
            <a
              href={`mailto:${email}`}
              className="font-semibold text-gray-950 underline underline-offset-4 hover:text-emerald-700 transition-colors"
            >
              {email}
            </a>
          </p>

          <p className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Visit us:</span>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-950 underline underline-offset-4 hover:text-emerald-700 transition-colors"
            >
              {address}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
