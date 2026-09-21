"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import Button from "./ui/Button";

import { useRouter } from "next/navigation";

export interface AboutDigitalEditionProps {
  title?: string;
  description?: string;
  showExploreButton?: boolean;
  onSubscribe?: () => void;
  onStudentApply?: () => void;
  isLoggedIn?: boolean;
}

export const AboutDigitalEdition: React.FC<AboutDigitalEditionProps> = ({
  title = "About The Digital Edition",
  description = "Akam E-Magazine's digital edition brings the richness of contemporary Malayalam literature directly to your screens. Designed for optimal readability across desktop, tablet, and mobile devices, each monthly issue delivers an interactive, high-resolution reading experience complete with printable PDF archives, original cover artwork, and curated literary audio features.",
  showExploreButton = true,
  onSubscribe,
  onStudentApply,
  isLoggedIn,
}) => {
  const router = useRouter();


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

  const studentFeatures = [
    "Complete access to monthly Masika digital magazine",

    "Verified student scholarship pass (100% Free)",
  ];

  const premiumFeatures = [
    "Full access to monthly Masika digital magazine",
    "Read exclusive subscriber-only stories & deep dives",
  ];

  return (
    <section className="relative w-full bg-white py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start relative z-10">
        
        {/* Left Side: About Text & Key Features */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            {description}
          </p>

          {/* <div className="pt-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-950 tracking-tight mb-4">
              Key Features
            </h3>

            <ul className="space-y-3.5">
              {keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-3 shrink-0" />
                  <span>
                    <strong className="font-semibold text-gray-900 mr-1">{feat.title}</strong>
                    {feat.text}
                  </span>
                </li>
              ))}
            </ul>
          </div> */}
        </div>

        {/* Right Side: Pricing / Plan Selection Container */}
        <div className="lg:col-span-8 xl:col-span-8 w-full">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-xs relative">
            
            {/* Top Pass Guarantee Banner */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-50 border border-gray-200/90 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="w-2 h-2 rounded-full bg-[#22B573] animate-pulse" />
                <span>Akam Digital Pass — 6 Months Unlimited Reading for ₹399</span>
              </div>
            </div>

            {/* 3 Pricing Cards Grid: Free, Student Pass, 6-Month Digital Pass */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
              
              {/* CARD 1: READER MEMBER (FREE) */}
              <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between bg-white hover:border-gray-300 transition-all shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                      Reader Member
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Community
                    </span>
                  </div>

                  <div className="mt-3 mb-1.5 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">Free</span>
                    <span className="text-xs text-gray-400 font-medium ml-1">/ forever</span>
                  </div>

                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    Explore curated public stories, author discussions, and open reader circles.
                  </p>
                </div>

                <div>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-2">
                      Includes
                    </span>
                    <ul className="space-y-2">
                      {freeFeatures.map((item, idx) => (
                        <li key={idx} className="flex items-start text-xs text-gray-600 leading-snug">
                          <Check className="w-3.5 h-3.5 text-[#22B573] stroke-[3] mr-2 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                 
                </div>
              </div>

              {/* CARD 2: STUDENT SPECIAL PASS (100% FREE - WITH ID VERIFICATION) */}
              <div className="border-2 border-[#0FA975]/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-[#F0FBF6] to-white relative shadow-xs hover:border-[#0FA975] transition-all">
                {/* Highlight Ribbon */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#0FA975] text-white text-[9px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs uppercase tracking-wider whitespace-nowrap">
                  <GraduationCap className="w-3 h-3" /> Student Scholarship
                </div>

                <div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] font-bold text-[#0FA975] tracking-wider uppercase">
                      Student Pass
                    </span>
                    <span className="bg-emerald-100 text-[#0FA975] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      100% Free
                    </span>
                  </div>

                  <div className="mt-3 mb-1.5 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">₹0</span>
                    <span className="text-xs text-emerald-700 font-medium ml-1.5">/ with verified ID</span>
                  </div>

                  <p className="text-xs text-gray-600 font-normal leading-relaxed">
                    Sponsored 6-month reading grant for enrolled college & university students.
                  </p>
                </div>

                <div>
                  <div className="mt-5 border-t border-emerald-100 pt-4">
                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-2">
                      Includes (Free Access)
                    </span>
                    <ul className="space-y-2">
                      {studentFeatures.map((item, idx) => (
                        <li key={idx} className="flex items-start text-xs text-gray-700 leading-snug">
                          <Check className="w-3.5 h-3.5 text-[#0FA975] stroke-[3] mr-2 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

               
                </div>
              </div>

              {/* CARD 3: 6-MONTH DIGITAL PASS */}
              <div className="bg-[#22B573] rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-white shadow-md hover:bg-[#1fa769] transition-all relative">
                {/* Highlight Ribbon */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[9px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs uppercase tracking-wider whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Best Value
                </div>

                <div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] font-bold text-white/90 tracking-wider uppercase">
                      Digital Pass
                    </span>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      All-Access
                    </span>
                  </div>

                  <div className="mt-3 mb-1.5 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      ₹399
                    </span>
                    <span className="text-xs text-white/80 font-medium ml-1.5">/ 6 months (~₹66/mo)</span>
                  </div>

                  <p className="text-xs text-white/95 font-normal leading-relaxed">
                    Complete unhindered access to every edition, subscriber audio recitals, and offline PDFs.
                  </p>
                </div>

                <div>
                  <div className="mt-5 border-t border-white/20 pt-4">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-2">
                      Includes
                    </span>
                    <ul className="space-y-2">
                      {premiumFeatures.map((item, idx) => (
                        <li key={idx} className="flex items-start text-xs text-white leading-snug">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3] mr-2 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>

            {/* Link to Full Comparison Table */}
            {showExploreButton && (
              <div className="mt-8 flex justify-center">
                <Link href="/plans">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                    iconPosition="right"
                    className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
                  >
                    <span>Explore full plans & comparison</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Decorative Bottom-Right SVG Motif */}
      <div className="absolute bottom-0 hidden lg:block right-0 z-0 pointer-events-none">
        <svg width="97" height="114" viewBox="0 0 97 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M75.1727 6.21742L75.0187 6.5403C75.4845 6.76814 75.9496 7.001 76.4189 7.23965C76.5117 7.28722 76.6075 7.33266 76.6974 7.38236C78.9882 8.55421 81.2553 9.81482 83.5303 11.1588C83.641 11.2245 83.7487 11.2923 83.8665 11.3616C83.9772 11.4273 84.0835 11.4873 84.187 11.5493C90.3862 15.1902 96.0913 18.9941 101.032 24.154C101.296 24.4279 101.54 24.7117 101.805 24.9985C101.873 25.0731 101.931 25.1282 101.973 25.1732C102.029 25.2304 102.089 25.3064 102.166 25.3925C102.487 25.7496 102.799 26.1079 103.106 26.4705C103.346 26.7535 103.581 27.0308 103.81 27.3122C104.11 27.6841 104.4 28.0595 104.687 28.437C104.823 28.6221 104.963 28.795 105.093 28.9714L105.11 28.9945L105.161 29.0639C115.615 43.2822 114.621 59.1403 107.607 74.8983C107.481 75.187 107.343 75.4763 107.208 75.7713C106.967 76.3015 106.715 76.83 106.458 77.3578C106.272 77.7399 106.092 78.1178 105.904 78.492C105.545 79.2068 105.173 79.9172 104.793 80.629C104.605 80.9773 104.413 81.3278 104.217 81.6775L104.208 81.6839L104.214 81.6796C103.882 82.2806 103.542 82.883 103.195 83.4816C103.107 83.6351 103.032 83.78 102.952 83.9141C102.914 83.9776 102.87 84.0504 102.826 84.1232C102.784 84.1988 102.742 84.2695 102.701 84.3351C102.622 84.4692 102.532 84.6068 102.44 84.7595C102.085 85.3545 101.722 85.943 101.357 86.5235C101.144 86.863 100.931 87.2025 100.719 87.537C100.283 88.2145 99.8399 88.8883 99.389 89.5455C99.1545 89.8919 98.9099 90.2368 98.6654 90.5818C98.3286 91.0614 97.9876 91.5353 97.6444 92.0063C97.4536 92.267 97.2657 92.5257 97.0764 92.7764C93.3704 97.7059 89.2733 101.965 84.7412 105.3C76.5862 111.301 67.0399 114.305 55.7689 112.818C55.5475 112.789 55.3197 112.752 55.0811 112.718C54.6118 112.649 54.1425 112.579 53.6705 112.494C53.316 112.43 52.9572 112.359 52.6013 112.287C52.1358 112.193 51.669 112.09 51.2 111.985C51.0883 111.96 50.993 111.946 50.9164 111.926C50.857 111.912 50.7812 111.888 50.6874 111.863C50.3087 111.772 49.9435 111.693 49.5785 111.596C42.6772 109.764 36.5895 106.608 30.41 102.939C30.3065 102.877 30.2029 102.815 30.0973 102.75C29.9795 102.681 29.8639 102.614 29.7532 102.548C27.4782 101.204 25.2745 99.8304 23.143 98.3852C23.0567 98.3284 22.9733 98.2694 22.8891 98.2155C22.4539 97.9205 22.0217 97.6234 21.5952 97.322L21.5888 97.3133L21.5931 97.3191C16.6056 93.8252 12.1708 89.9514 8.56145 85.0467C7.48035 83.5775 6.47246 82.0144 5.54585 80.338L5.2324 80.5107L5.451 80.7956L5.48564 80.7701L5.4943 80.7638L5.73831 80.5753L5.58916 80.3061C1.22092 72.3443 -0.277523 63.2693 1.36162 53.9227C1.39849 53.7128 1.4527 53.4901 1.4999 53.2459L1.49778 53.243C2.5422 47.1337 4.76071 41.3016 7.62193 35.6475C7.76561 35.359 7.91429 35.0712 8.0601 34.7856C8.38225 34.1652 8.71231 33.5433 9.04662 32.9273C9.25851 32.544 9.46537 32.16 9.68152 31.7825C9.96981 31.2672 10.2602 30.7548 10.5557 30.2431C10.6386 30.1019 10.7295 29.9592 10.8226 29.8015C10.9178 29.6467 10.9972 29.4947 11.0823 29.3563C11.3849 28.8483 11.6917 28.3461 12.0036 27.8447C12.2319 27.4716 12.4644 27.1043 12.697 26.737C13.0742 26.1429 13.4556 25.5547 13.8413 24.9721C14.0207 24.7019 14.1993 24.4368 14.3808 24.1694C17.9344 18.9241 21.9547 14.1557 26.7889 10.2817C26.9796 10.1236 27.1445 9.9666 27.3134 9.83336C27.8341 9.41009 28.3625 9.00341 28.8965 8.61042C35.9083 3.45053 43.9792 0.787967 52.4085 0.759307L52.7112 0.759473L52.7589 0.461364L52.7636 0.413336L52.4083 0.353797L52.4103 0.713393C60.6888 0.715537 67.9056 3.07259 75.0143 6.55246L75.1704 6.23249L75.3294 5.91039C68.1658 2.40413 60.8303 0.000687877 52.4105 9.96203e-06L52.1078 -0.000118529L52.0572 0.300071L52.0525 0.348111L52.4078 0.407638L52.4058 0.0480359C43.828 0.0744941 35.6003 2.79006 28.473 8.03492C27.9303 8.43429 27.3933 8.84733 26.864 9.27697C26.6683 9.43435 26.5005 9.59344 26.3337 9.72957L26.5638 10.006L26.3395 9.72532C21.4352 13.6553 17.37 18.4836 13.7873 23.7681C13.6058 24.0354 13.4235 24.3077 13.2441 24.5779C12.8548 25.1676 12.4705 25.758 12.0925 26.3571C11.8571 26.7265 11.6238 27.0988 11.3926 27.474C11.0779 27.9776 10.7702 28.4848 10.4677 28.9928C10.3746 29.1504 10.293 29.2996 10.2101 29.4409C10.1271 29.5822 10.0384 29.7277 9.94533 29.8854C9.64701 30.3991 9.35368 30.9136 9.06464 31.434C8.84773 31.8165 8.63798 32.2027 8.4261 32.5859C8.08814 33.2091 7.75305 33.8302 7.43014 34.4557C7.28144 34.7434 7.13201 35.0362 6.98833 35.3247C4.10525 41.0216 1.85813 46.9238 0.80006 53.1234L1.1525 53.185L0.800819 53.1183C0.76106 53.3304 0.704003 53.5552 0.658932 53.8023C-1.00799 63.2986 0.517705 72.5497 4.96439 80.6544L5.27784 80.4817L5.05924 80.1968L5.0246 80.2223L5.01594 80.2286L4.77194 80.4171L4.92109 80.6863C5.86183 82.388 6.88598 83.9793 7.98411 85.4715C11.6509 90.4544 16.1542 94.3848 21.1787 97.9049C21.6073 98.2092 22.0445 98.5071 22.4818 98.805C22.5681 98.8618 22.6516 98.9208 22.7379 98.9776C24.8836 100.43 27.0988 101.814 29.386 103.162C29.5038 103.231 29.6173 103.295 29.7279 103.361C29.8293 103.42 29.9328 103.482 30.0384 103.547C36.2445 107.227 42.3928 110.424 49.3928 112.281C49.78 112.384 50.1502 112.463 50.5189 112.553C50.5783 112.567 50.6542 112.592 50.7529 112.617C50.8668 112.645 50.962 112.66 51.0436 112.68C51.5219 112.791 51.9967 112.892 52.4671 112.987C52.8281 113.061 53.189 113.134 53.5535 113.2C54.0356 113.287 54.5149 113.357 54.9863 113.43C55.2119 113.464 55.4448 113.502 55.6841 113.531C67.1349 115.051 76.8999 111.975 85.1768 105.88C89.7782 102.494 93.9217 98.1829 97.6575 93.2092C97.8533 92.9492 98.0441 92.6885 98.2291 92.4319C98.5751 91.9588 98.9219 91.4807 99.2595 90.9961C99.5011 90.6533 99.7486 90.3062 99.9897 89.9505C100.444 89.2862 100.89 88.6102 101.327 87.9277C101.545 87.589 101.758 87.2495 101.969 86.9071C102.334 86.3215 102.699 85.7281 103.059 85.1288C103.138 84.9947 103.231 84.8549 103.318 84.7015C103.36 84.6258 103.402 84.5552 103.443 84.4896C103.48 84.4261 103.525 84.3533 103.569 84.2806C103.659 84.125 103.738 83.9779 103.817 83.8438C104.168 83.238 104.511 82.6335 104.844 82.0275C105.038 81.6749 105.235 81.3252 105.424 80.9719C105.809 80.2559 106.182 79.5354 106.545 78.8185C106.739 78.435 106.92 78.0521 107.105 77.6751C107.363 77.1422 107.615 76.6086 107.86 76.0764C107.994 75.7864 108.13 75.4942 108.263 75.1962C115.347 59.3234 116.387 43.1026 105.738 28.6441L105.689 28.5776L105.672 28.5545C105.534 28.3665 105.394 28.1885 105.259 28.0114C104.97 27.631 104.676 27.2498 104.37 26.8693C104.134 26.5791 103.894 26.2961 103.657 26.016C103.348 25.6505 103.031 25.2863 102.701 24.9228C102.647 24.8605 102.584 24.7817 102.505 24.6976C102.436 24.623 102.378 24.5679 102.336 24.523L102.33 24.5143L102.338 24.5258C102.083 24.2456 101.833 23.961 101.554 23.6719C96.542 18.4395 90.7734 14.5976 84.5507 10.9429C84.4401 10.8772 84.3358 10.8202 84.2323 10.7581C84.1238 10.6953 84.0139 10.6246 83.8961 10.5553C81.6118 9.20476 79.3304 7.93683 77.0254 6.75765C76.9304 6.70719 76.8346 6.66175 76.7418 6.61417C76.2725 6.37553 75.8031 6.13687 75.3294 5.91039L75.1725 6.23538L75.1727 6.21742ZM39.6557 41.5597L39.38 41.3302C38.3695 42.533 37.484 43.7909 36.7124 45.0765C35.9593 46.3752 35.293 47.7616 34.73 49.2279L34.7272 49.2301L34.7293 49.2329C33.8203 51.7832 33.4517 54.3904 33.765 56.9327L33.7693 56.9385C34.1142 59.3907 35.0928 61.7243 36.6358 63.821C36.9443 64.2403 37.2795 64.6535 37.632 65.0539L37.6362 65.0597C37.9953 65.4508 38.3722 65.8421 38.7937 66.2274C40.0753 67.3885 41.4227 68.4877 42.8209 69.523L42.8251 69.5287L42.8301 69.5295C44.4201 70.6197 46.0861 71.6138 47.7965 72.6198C49.3799 73.55 50.934 74.4525 52.5305 75.2615L52.5348 75.2673L52.5448 75.2688C54.1427 76.001 55.772 76.661 57.4229 77.2294C57.9615 77.417 58.4855 77.5485 58.9952 77.6728L58.9995 77.6785C61.3487 78.1921 63.6854 78.2291 65.8965 77.7566L65.8994 77.7545C66.0618 77.7152 66.2435 77.684 66.4391 77.6292L66.3451 77.2838L66.4333 77.6335C66.5799 77.5969 66.7173 77.5538 66.851 77.5178L66.8539 77.5157C68.5036 77.0061 70.0402 76.2097 71.4373 75.1815C71.8357 74.8884 72.2242 74.5757 72.5999 74.2458L72.6057 74.2415L72.6115 74.2373C72.7278 74.1293 72.8579 74.0158 72.9902 73.8872C74.373 72.513 75.5912 71.0058 76.6085 69.4191L76.6113 69.417C76.7277 69.2243 76.8412 69.0339 76.9525 68.8405L76.6413 68.6594L76.9468 68.8447C77.0631 68.6521 77.1744 68.4587 77.2858 68.2653L77.2887 68.2632C78.1839 66.6014 78.9074 64.8029 79.4371 62.9285C79.4873 62.7489 79.5232 62.5799 79.5617 62.4267L79.5604 62.4187C80.0376 60.213 80.0919 57.9708 79.6378 55.7996L79.6335 55.7938C79.6002 55.6578 79.5726 55.5176 79.5329 55.3729L79.1857 55.4635L79.5343 55.3809C79.4872 55.1837 79.4262 55.0102 79.3787 54.8489L79.3745 54.8432C78.8612 53.1479 78.0352 51.5356 76.9392 50.0463C76.6349 49.6327 76.3111 49.229 75.9649 48.8373L75.9607 48.8315C75.6038 48.4433 75.2348 48.0506 74.8104 47.6674C73.5124 46.4961 72.1485 45.3866 70.734 44.3412L70.7297 44.3355L70.7226 44.3318C69.2432 43.3252 67.7028 42.3991 66.1253 41.4647C64.4206 40.4545 62.7423 39.4739 61.0207 38.6098L61.0164 38.6041L61.0064 38.6025C59.4228 37.8777 57.812 37.2308 56.1754 36.6697C55.6361 36.4871 55.1107 36.3476 54.5939 36.2198L54.5917 36.2169C51.47 35.5183 48.4049 35.7009 45.6331 36.7598C44.4499 37.2382 43.3357 37.8709 42.2907 38.6399C41.2429 39.411 40.2671 40.3163 39.3742 41.3344L39.3714 41.3366L39.3685 41.3387L39.6442 41.5682L39.9134 41.807C40.7779 40.8231 41.7176 39.9533 42.7193 39.2162C43.7181 38.4811 44.7818 37.8767 45.9045 37.425L45.7702 37.0914L45.8966 37.4263C48.5295 36.4206 51.4454 36.2408 54.4454 36.913L54.5215 36.5628L54.4354 36.9115C54.9401 37.0349 55.4432 37.1684 55.9533 37.3414C57.5634 37.8907 59.1541 38.5345 60.7163 39.2484L60.8632 38.9219L60.7042 39.244C62.3972 40.0934 64.0591 41.0638 65.7637 42.074C67.3392 43.0055 68.8703 43.9251 70.324 44.9149L70.5251 44.6198L70.3118 44.9105C71.7078 45.9428 73.056 47.0371 74.3334 48.1923C74.7285 48.5479 75.0819 48.9254 75.4367 49.3107L75.6991 49.0686L75.4296 49.3071C75.7621 49.6865 76.0732 50.0728 76.3647 50.469C77.416 51.8976 78.2018 53.437 78.6892 55.0488L79.0308 54.9445L78.6849 55.043C78.7365 55.2279 78.7932 55.3957 78.8293 55.5475L78.8335 55.5533C78.8655 55.6814 78.8966 55.8145 78.9292 55.9554L79.2799 55.8757L78.9278 55.9475C79.3599 58.0102 79.3115 60.1455 78.8522 62.2667L79.2023 62.3434L78.8537 62.2567C78.8121 62.43 78.7778 62.5889 78.735 62.7364C78.22 64.5642 77.512 66.3112 76.6444 67.9259L76.9601 68.0949L76.6481 67.9188C76.5425 68.1079 76.4319 68.2963 76.3192 68.4818L76.3163 68.4839C76.2079 68.6752 76.0952 68.8606 75.9825 69.0461L76.29 69.2344L75.9882 69.0419C74.9978 70.5865 73.8144 72.0503 72.4678 73.389C72.3564 73.4977 72.235 73.6048 72.1064 73.7263L72.3488 73.9892L72.1129 73.717C71.7495 74.0335 71.3783 74.3333 70.9973 74.6137C69.6579 75.5994 68.1933 76.3606 66.6299 76.8424L66.7347 77.1844L66.6357 76.8382C66.4962 76.8784 66.3646 76.9173 66.2417 76.9498L66.2388 76.9519C66.0864 76.9927 65.9147 77.0255 65.7235 77.0681L65.8067 77.417L65.7314 77.0667C63.6318 77.5151 61.4019 77.4843 59.1392 76.9917L59.0632 77.3419L59.1493 76.9932C58.6396 76.869 58.1407 76.7413 57.6407 76.5698C56.012 76.0074 54.4041 75.3584 52.8276 74.6372L52.6808 74.9637L52.8419 74.6445C51.274 73.8502 49.729 72.9542 48.1507 72.0248C46.4424 71.0217 44.7907 70.0349 43.2264 68.9615L43.0253 69.2566L43.2407 68.9688C41.8611 67.9467 40.5294 66.8626 39.2685 65.7175C38.869 65.3561 38.5077 64.9801 38.1551 64.5976L37.8927 64.8397L38.1622 64.6013C37.8204 64.2153 37.503 63.8203 37.2072 63.4183C35.7302 61.4113 34.8017 59.188 34.4736 56.8616L34.1196 56.9126L34.475 56.8694C34.1756 54.455 34.5247 51.9603 35.3999 49.4973L35.0617 49.3762L35.3963 49.5044C35.946 48.0745 36.597 46.7217 37.3326 45.4537L37.0213 45.2726L37.3297 45.4558C38.0789 44.2002 38.9469 42.973 39.9299 41.7993L39.6542 41.5698L39.6557 41.5597Z"
            fill="url(#paint0_linear_255_2745)"
          />
          <defs>
            <linearGradient id="paint0_linear_255_2745" x1="29.6635" y1="103.489" x2="84.4769" y2="10.643" gradientUnits="userSpaceOnUse">
              <stop stopColor="#29ABE2" />
              <stop offset="0.5" stopColor="#22B573" />
              <stop offset="1" stopColor="#D9E021" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default AboutDigitalEdition;
