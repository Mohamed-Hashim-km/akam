"use client";

import React from "react";

export interface ContactSectionProps {
  title?: string;
  email?: string;
  address?: string;
  phone?: string;
  mapEmbedSrc?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "Get in Touch",
  email = "contact@akam.in",
  address = "Kairali Books Building, Kannur, Kerala",
  phone = "+91 9383748193",
  mapEmbedSrc = "https://maps.google.com/maps?q=Kairali%20Books%20Building,%20Kannur,%20Kerala&t=&z=15&ie=UTF8&iwloc=&output=embed",
}) => {
  return (
    <section className="relative w-full bg-white pt-16 sm:pt-20 lg:pt-28 pb-12 sm:pb-16 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Header & Contact Information */}
        <div className="text-center  mx-auto mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-gray-950 tracking-tight mb-6 sm:mb-8 font-poppins">
            {title}
          </h1>

          <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 font-medium font-poppins">
            <p>
              <span className="font-semibold text-gray-900">Email Us:</span>{" "}
              <a
                href={`mailto:${email}`}
                className="hover:text-black transition-colors"
              >
                {email}
              </a>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Visit Us:</span>{" "}
              {address}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Call Us:</span>{" "}
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="hover:text-black transition-colors"
              >
                {phone}
              </a>
            </p>
          </div>
        </div>

        {/* Interactive Location Map Container */}
   

      </div>
           <div className="w-full  mx-auto h-[380px] sm:h-[460px] lg:h-[700px]  overflow-hidden border border-gray-100  relative bg-gray-100">
          <iframe
            title="AKAM Location Map"
            src={mapEmbedSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full grayscale-[0.1] contrast-[1.02]"
          />
        </div>
    </section>
  );
};

export default ContactSection;
