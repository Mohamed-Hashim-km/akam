"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, PenTool } from "lucide-react";
import AuthModal from "./AuthModal";

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
  whatsappHref?: string;
  facebookHref?: string;
  instagramHref?: string;
  youtubeHref?: string;
}

export const Footer: React.FC<FooterProps> = ({
  headline = "Share Your Stories with India’s Digital Literary Audience",
  subheadline = "Write multi-part serialized novels, poetry cycles, or cultural essays. Every submission is read by the AKAM editorial board before reaching our reader community.",
  startWritingHref = "/submit",
  editorialGuidelinesHref = "/editorial-guidelines",
  masikaHref = "/masika",
  eventsHref = "/events",
  mediaHref = "/media",
  aboutHref = "/about",
  contactHref = "/contact",
  whatsappHref = "#",
  facebookHref = "#",
  instagramHref = "#",
  youtubeHref = "#",
}) => {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("akam_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    loadUser();
    window.addEventListener("akam_user_updated", loadUser);
    return () => window.removeEventListener("akam_user_updated", loadUser);
  }, []);

  const handleStartWriting = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user || (typeof window !== "undefined" && localStorage.getItem("akam_user"))) {
      router.push(startWritingHref);
    } else {
      setAuthModalOpen(true);
    }
  };
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
            {/* Social Icons */}
            <div className="flex items-center gap-5 pt-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hover:opacity-80 transition-opacity inline-flex items-center justify-center"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.34452 19.9336C1.29739 18.0708 0.700195 15.9213 0.700195 13.6322C0.700195 6.51951 6.51982 0.699944 13.6325 0.699944C20.7451 0.699944 26.5647 6.51951 26.5647 13.6322C26.5647 20.7448 20.7451 26.5645 13.6325 26.5645C11.3434 26.5645 9.19384 25.9672 7.33106 24.9201L0.700195 26.5645L2.34452 19.9336Z" stroke="white" strokeWidth="1.4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.116 15.1468C11.5822 14.6113 9.43981 12.2338 10.2194 11.4542C10.4337 11.24 11.2904 10.6547 11.6247 10.3205C12.763 9.18218 11.457 7.77283 10.6195 6.93535C10.5511 6.86693 9.26187 5.47942 7.55031 7.19104C4.4903 10.2511 8.85201 15.7379 10.1819 17.0808C11.5249 18.4108 17.0117 22.7725 20.0718 19.7125C21.7834 18.0009 20.3958 16.7117 20.3274 16.6433C19.49 15.8059 18.0806 14.4999 16.9423 15.6382C16.6081 15.9724 16.0229 16.8291 15.8085 17.0434C15.029 17.823 12.6515 15.6806 12.116 15.1468Z" stroke="white" strokeWidth="1.4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              <a
                href={facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:opacity-80 transition-opacity inline-flex items-center justify-center"
              >
                <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6119 21.9456V13.9045H17.0419L17.7046 10.5908H14.6119V7.27717H17.7046V3.96353H14.6119C12.7818 3.96353 11.2982 5.44711 11.2982 7.27717V10.5908H8.86823V13.9045H11.2982V21.9456M21.9461 19.2946C21.9461 20.7526 20.7532 21.9456 19.2951 21.9456H3.3013C1.8433 21.9456 0.650391 20.7526 0.650391 19.2946V3.3008C0.650391 1.8428 1.8433 0.649885 3.3013 0.649885H19.2951C20.7532 0.649885 21.9461 1.8428 21.9461 3.3008V19.2946Z" stroke="white" strokeWidth="1.3" strokeMiterlimit="10"/>
                </svg>
              </a>

              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:opacity-80 transition-opacity inline-flex items-center justify-center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.1898 11.9537C23.1874 12.9558 23.1761 13.9579 23.1624 14.96C23.1458 16.169 23.1271 17.3785 22.8239 18.5667C22.506 19.8128 21.8789 20.8874 20.9033 21.683C19.8752 22.5214 18.6326 22.9621 17.2914 23.0436C15.5125 23.1518 13.7329 23.1946 11.9533 23.1904C10.1737 23.1946 8.39403 23.1518 6.61521 23.0436C5.27401 22.9621 4.03137 22.5214 3.00328 21.683C2.02767 20.8874 1.40059 19.8128 1.08262 18.5667C0.77941 17.3785 0.760746 16.169 0.744224 14.96C0.730511 13.9579 0.71913 12.9558 0.716797 11.9537C0.71913 10.9516 0.730511 9.94948 0.744224 8.94744C0.760746 7.73846 0.77941 6.52896 1.08262 5.3407C1.40059 4.09464 2.02767 3.01998 3.00328 2.22439C4.03137 1.386 5.27401 0.945331 6.61521 0.863768C8.39403 0.755588 10.1737 0.71283 11.9533 0.71702C13.7329 0.71283 15.5125 0.755588 17.2914 0.863768C18.6326 0.945331 19.8752 1.386 20.9033 2.22439C21.8789 3.01998 22.506 4.09464 22.8239 5.3407C23.1271 6.52896 23.1458 7.73846 23.1624 8.94744C23.1761 9.94948 23.1874 10.9516 23.1898 11.9537Z" stroke="white" strokeWidth="1.43336" strokeMiterlimit="10"/>
                  <path d="M16.9048 11.9534C16.9048 14.7145 14.6665 16.9529 11.9053 16.9529C9.14417 16.9529 6.90582 14.7145 6.90582 11.9534C6.90582 9.19223 9.14417 6.95388 11.9053 6.95388C14.6665 6.95388 16.9048 9.19223 16.9048 11.9534Z" stroke="white" strokeWidth="1.43336" strokeMiterlimit="10"/>
                  <path d="M19.9523 5.52396C19.9523 6.31284 19.3127 6.95239 18.5238 6.95239C17.735 6.95239 17.0954 6.31284 17.0954 5.52396C17.0954 4.73509 17.735 4.09554 18.5238 4.09554C19.3127 4.09554 19.9523 4.73509 19.9523 5.52396Z" stroke="white" strokeWidth="1.43336" strokeMiterlimit="10"/>
                </svg>
              </a>

              <a
                href={youtubeHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:opacity-80 transition-opacity inline-flex items-center justify-center"
              >
                <svg width="31" height="24" viewBox="0 0 31 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7321 16.1004L19.6475 11.5947L11.7321 7.08896V16.1004Z" stroke="white" strokeWidth="1.3" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M29.3897 11.6099C29.3897 14.0144 29.1765 16.2057 28.9332 17.9239C28.6171 20.1558 26.8142 21.8792 24.5708 22.0989C22.1905 22.3319 18.8273 22.5698 15.02 22.5698C11.2128 22.5698 7.84958 22.3319 5.46928 22.0989C3.22585 21.8792 1.42294 20.1558 1.10687 17.9239C0.863562 16.2057 0.650391 14.0144 0.650391 11.6099C0.650391 9.20544 0.863562 7.01413 1.10687 5.29592C1.42294 3.06406 3.22585 1.34061 5.46928 1.12099C7.84958 0.887968 11.2128 0.650018 15.02 0.650018C18.8273 0.650018 22.1905 0.887968 24.5708 1.12099C26.8142 1.34061 28.6171 3.06406 28.9332 5.29592C29.1765 7.01413 29.3897 9.20544 29.3897 11.6099Z" stroke="white" strokeWidth="1.3" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={handleStartWriting}
              className="bg-white text-dark-bg hover:bg-slate-100 font-medium px-6 py-3 rounded-full text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md group cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-dark-bg" />
              <span>Start Writing Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <Link href={editorialGuidelinesHref}>
              <button className="border border-white/80 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-full text-sm sm:text-base transition-all cursor-pointer">
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={startWritingHref}
        onSuccess={(u) => {
          setUser(u);
        }}
      />
    </footer>
  );
};

export default Footer;
