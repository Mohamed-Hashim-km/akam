"use client";

import React from "react";

export interface ContactSectionProps {
  title?: string;
  email?: string;
  address?: string;
  phone?: string;
  mapEmbedSrc?: string;
  mapUrl?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "Get in Touch",
  email = "contact@akam.in",
  address = "Kairali Books Building, Kannur, Kerala",
  phone = "+91 9383748193",
  mapEmbedSrc = "https://maps.google.com/maps?q=11.874128087481653,75.36285108465643+(Kairali%20Books)&t=&z=17&ie=UTF8&iwloc=&output=embed",
  mapUrl = "https://maps.app.goo.gl/ABjSw3ZFVQc2bW2J7",
}) => {
  return (
    <section className="relative w-full bg-white pt-16 sm:pt-20 lg:pt-28 pb-12 sm:pb-16 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Header & Contact Information */}
        <div className="text-center mx-auto mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold text-dark-text tracking-tight mb-6 sm:mb-8 font-poppins">
            {title}
          </h1>

          <div className="flex flex-col items-center gap-2.5 text-xs sm:text-sm text-gray-500 font-normal font-poppins">
            {/* Line 1: Email Us & Call Us side by side */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <p>
                <span className="text-[#04070661]">Email Us:</span>{" "}
                <a
                  href={`mailto:${email}`}
                  className="font-semibold text-[#040706BF] underline hover:text-black transition-colors"
                >
                  {email}
                </a>
              </p>

              <p>
                <span className="text-[#04070661]">Call Us:</span>{" "}
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="font-semibold text-[#040706BF] underline hover:text-black transition-colors"
                >
                  {phone}
                </a>
              </p>
            </div>

            {/* Line 2: Visit Us centered */}
            <p>
              <span className="text-[#04070661]">Visit Us:</span>{" "}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#040706BF]  hover:text-black hover:underline transition-colors"
              >
                {address}
              </a>
            </p>
          </div>
        </div>

      </div>

      {/* Interactive Location Map Container */}
      <div className="w-full mx-auto h-[380px] sm:h-[460px] lg:h-[700px] overflow-hidden border border-gray-100 relative bg-gray-100">
        <iframe
          title="Kairali Books Location Map"
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
