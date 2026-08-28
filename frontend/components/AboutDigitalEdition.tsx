"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export interface AboutDigitalEditionProps {
  title?: string;
  description?: string;
}

export const AboutDigitalEdition: React.FC<AboutDigitalEditionProps> = ({
  title = "About The Digital Edition",
  description = "Akam Masika's digital edition brings the richness of contemporary Malayalam literature directly to your screens. Designed for optimal readability across desktop, tablet, and mobile devices, each monthly issue delivers an interactive, high-resolution reading experience complete with printable PDF archives, original cover artwork, and curated literary audio features.",
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const keyFeatures = [
    {
      title: "Multi-Format Access:",
      text: "Read online via our web viewer or download offline PDFs for on-the-go reading.",
    },
    {
      title: "Interactive Media:",
      text: "Enjoy embedded audio recitals, author commentaries, and visual art accompanying selected works.",
    },
    {
      title: "Complete Archives:",
      text: "Instant access to every past edition, serialized fiction installment, and poetry collection.",
    },
  ];

  const freeFeatures = [
    "Unlimited access to all free stories",
    "Save bookmarks to personal library",
    "Participate in community discussion threads",
  ];

  const premiumFeatures = [
    "Full access to monthly Masika digital magazine",
    "Read exclusive subscriber-only stories & deep dives",
    "Offline reading / PDF download access",
  ];

  return (
    <section className="relative w-full bg-white py-16 lg:py-24 font-poppins overflow-hidden">
      {/* Ambient Accent Orbs */}
      
      <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">

        {/* Left Side: About Text & Key Features */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            {description}
          </p>

          <div className="pt-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-950 tracking-tight mb-4">
              Key Features
            </h3>

            <ul className="space-y-4">
              {keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-3 shrink-0" />
                  <span>
                    <strong className="font-semibold text-gray-900 mr-1">{feat.title}</strong>
                    {feat.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Pricing / Plan Selection Container */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs relative">

            {/* Billing Toggle Switch */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-full inline-flex items-center gap-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                    billingCycle === "annual"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Annual Billing <span className="text-[#22B573] font-bold ml-1">(Save 30%)</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Free Reader Member Card */}
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between bg-white hover:border-gray-300 transition-all">
                <div>
                  <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                    Reader Member
                  </span>

                  <div className="mt-4 mb-2 flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight">Free</span>
                    <span className="text-xs text-gray-400 font-medium ml-1">/ forever</span>
                  </div>

                  <p className="text-xs text-gray-500 font-normal leading-normal min-h-[36px]">
                    Explore baseline articles and join public conversations.
                  </p>

                  <button className="w-full mt-6 py-2.5 px-4 rounded-full border border-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-50 transition-all text-center">
                    Current Plan
                  </button>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-3">
                    Includes
                  </span>
                  <ul className="space-y-2.5">
                    {freeFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-600 leading-snug">
                        <Check className="w-3.5 h-3.5 text-[#22B573] stroke-[3] mr-2 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Masika Pass Premium Card */}
              <div className="bg-[#22B573] rounded-2xl p-6 flex flex-col justify-between text-white shadow-lg hover:bg-[#1fa769] transition-all">
                <div>
                  <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
                    Masika Pass
                  </span>

                  <div className="mt-4 mb-2 flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {billingCycle === "monthly" ? "₹149" : "₹104"}
                    </span>
                    <span className="text-xs text-white/80 font-medium ml-1">/ month</span>
                  </div>

                  <p className="text-xs text-white/90 font-normal leading-normal min-h-[36px]">
                    Unlock complete digital access to every monthly edition.
                  </p>

                  <button className="w-full mt-6 py-2.5 px-4 rounded-full bg-white text-gray-950 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm group">
                    <span>Activate Premium Pass</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-950 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="mt-8 border-t border-white/20 pt-6">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">
                    Includes
                  </span>
                  <ul className="space-y-2.5">
                    {premiumFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-start text-xs text-white/95 leading-snug">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] mr-2 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutDigitalEdition;
