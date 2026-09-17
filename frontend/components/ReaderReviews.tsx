"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

import "swiper/css";

export interface ReviewItem {
  id: string;
  name: string;
  role?: string | null;
  quote: string;
  image?: string | null;
  isPublished?: boolean;
}

interface BubblePoint {
  id: number;
  x0: number;
  y0: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

// 24 sampled points along the exact cubic bezier path of the ReaderReviews bottom-left blob
const REVIEWS_BLOB_POINTS: { id: number; x0: number; y0: number; pinned: boolean }[] = [
  { id: 0, x0: 239.66, y0: 297.49, pinned: false },
  { id: 1, x0: 293.75, y0: 260.33, pinned: false },
  { id: 2, x0: 330.39, y0: 195.96, pinned: false },
  { id: 3, x0: 329.99, y0: 110.87, pinned: false },
  { id: 4, x0: 302.97, y0: 57.11, pinned: false },
  { id: 5, x0: 227.86, y0: 6.43, pinned: false },
  { id: 6, x0: 142.03, y0: 5.19, pinned: false },
  { id: 7, x0: 78.14, y0: 40.14, pinned: false },
  { id: 8, x0: 37.66, y0: 103.64, pinned: false },
  { id: 9, x0: 18.09, y0: 187.94, pinned: false },
  { id: 10, x0: -31.53, y0: 241.36, pinned: true },
  { id: 11, x0: -106.30, y0: 254.37, pinned: true },
  { id: 12, x0: -172.27, y0: 232.03, pinned: true },
  { id: 13, x0: -247.85, y0: 244.23, pinned: true },
  { id: 14, x0: -301.74, y0: 302.94, pinned: true },
  { id: 15, x0: -310.51, y0: 371.69, pinned: true },
  { id: 16, x0: -265.29, y0: 444.94, pinned: true },
  { id: 17, x0: -194.39, y0: 468.35, pinned: true },
  { id: 18, x0: -124.48, y0: 446.72, pinned: true },
  { id: 19, x0: -78.40, y0: 381.66, pinned: true },
  { id: 20, x0: -54.74, y0: 318.04, pinned: true },
  { id: 21, x0: 18.70, y0: 269.03, pinned: false },
  { id: 22, x0: 88.76, y0: 277.38, pinned: false },
  { id: 23, x0: 162.39, y0: 306.80, pinned: false },
];

function buildSvgPath(points: BubblePoint[]): string {
  const n = points.length;
  if (n === 0) return "";
  const m0x = (points[0].x + points[1].x) / 2;
  const m0y = (points[0].y + points[1].y) / 2;
  let d = `M ${m0x.toFixed(2)} ${m0y.toFixed(2)}`;

  for (let i = 1; i < n; i++) {
    const next = (i + 1) % n;
    const mx = (points[i].x + points[next].x) / 2;
    const my = (points[i].y + points[next].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }

  d += ` Q ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} ${m0x.toFixed(2)} ${m0y.toFixed(2)} Z`;
  return d;
}

const ReviewsJellyBlob: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const pointsRef = useRef<BubblePoint[]>(
    REVIEWS_BLOB_POINTS.map((p) => ({
      ...p,
      x: p.x0,
      y: p.y0,
      vx: 0,
      vy: 0,
    }))
  );

  const cursorRef = useRef<{
    svgX: number | null;
    svgY: number | null;
    prevSvgX: number | null;
    prevSvgY: number | null;
    hasCursor: boolean;
    intensity: number;
  }>({
    svgX: null,
    svgY: null,
    prevSvgX: null,
    prevSvgY: null,
    hasCursor: false,
    intensity: 0,
  });

  const getSvgCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  // ── Global Pointer Tracking for Hover & Proximity Reactions ──
  useEffect(() => {
    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const coords = getSvgCoordinates(e.clientX, e.clientY);
      const cursor = cursorRef.current;
      cursor.prevSvgX = cursor.svgX ?? coords.x;
      cursor.prevSvgY = cursor.svgY ?? coords.y;
      cursor.svgX = coords.x;
      cursor.svgY = coords.y;
      cursor.hasCursor = true;
    };

    const handlePointerLeaveGlobal = () => {
      const cursor = cursorRef.current;
      cursor.hasCursor = false;
      cursor.svgX = null;
      cursor.svgY = null;
    };

    window.addEventListener("pointermove", handlePointerMoveGlobal, { passive: true });
    window.addEventListener("pointercancel", handlePointerLeaveGlobal);
    window.addEventListener("mouseleave", handlePointerLeaveGlobal);

    return () => {
      window.removeEventListener("pointermove", handlePointerMoveGlobal);
      window.removeEventListener("pointercancel", handlePointerLeaveGlobal);
      window.removeEventListener("mouseleave", handlePointerLeaveGlobal);
    };
  }, []);

  // ── Fluid Simulation Loop with Bouncy Jelly Hover & Return Wobble ──
  useEffect(() => {
    let animId: number;
    let time = 0;

    const tick = () => {
      time += 0.0022;
      const points = pointsRef.current;
      const cursor = cursorRef.current;

      // Smooth cursor presence intensity (gentle fade in / out)
      const targetIntensity = cursor.hasCursor ? 1 : 0;
      cursor.intensity += (targetIntensity - cursor.intensity) * 0.025;

      const cursorVx =
        cursor.svgX !== null && cursor.prevSvgX !== null
          ? cursor.svgX - cursor.prevSvgX
          : 0;
      const cursorVy =
        cursor.svgY !== null && cursor.prevSvgY !== null
          ? cursor.svgY - cursor.prevSvgY
          : 0;
      cursor.prevSvgX = cursor.svgX;
      cursor.prevSvgY = cursor.svgY;

      const n = points.length;

      for (let i = 0; i < n; i++) {
        const pt = points[i];
        if (pt.pinned) continue;

        // Taper near anchored base points
        let taper = 1.0;
        if (i === 9 || i === 21) taper = 0.55;
        else if (i === 8 || i === 22) taper = 0.85;

        // 1. Gentle, slow organic ambient fluid waves
        const current1 = Math.sin(time * 0.45 - i * 0.38) * 3.8;
        const current2 = Math.cos(time * 0.32 + i * 0.28) * 2.6;
        const current3 = Math.sin(time * 0.65 - i * 0.48) * 1.5;
        const fluidWave = (current1 + current2 + current3) * taper;

        // Direction normal from internal core (-100, 350)
        const radX = pt.x0 - (-100);
        const radY = pt.y0 - 350;
        const radLen = Math.hypot(radX, radY) || 1;
        const normX = radX / radLen;
        const normY = radY / radLen;

        let targetX = pt.x0 + normX * fluidWave;
        let targetY = pt.y0 + normY * fluidWave;

        // 2. Smooth, graceful jelly bulge when cursor approaches
        if (cursor.intensity > 0.01 && cursor.svgX !== null && cursor.svgY !== null) {
          const cdx = cursor.svgX - pt.x0;
          const cdy = cursor.svgY - pt.y0;
          const cdist = Math.hypot(cdx, cdy);
          const radius = 260;
          if (cdist < radius && cdist > 1) {
            const normDist = cdist / radius;
            const pull = Math.pow(1 - normDist, 2.2) * 42 * cursor.intensity * taper;
            targetX += (cdx / cdist) * pull;
            targetY += (cdy / cdist) * pull;

            // Subtle fluid inertia when cursor drifts across
            const speed = Math.hypot(cursorVx, cursorVy);
            if (speed > 0.5) {
              const impulse = Math.min(speed, 18) * Math.pow(1 - normDist, 2) * 0.035 * taper;
              pt.vx += (cursorVx / (speed || 1)) * impulse;
              pt.vy += (cursorVy / (speed || 1)) * impulse;
            }
          }
        }

        // 3. Slow, silky spring relaxation & gentle harmonic return wobble
        const springK = 0.024;
        const damping = 0.92;
        const fx = (targetX - pt.x) * springK;
        const fy = (targetY - pt.y) * springK;

        pt.vx = (pt.vx + fx) * damping;
        pt.vy = (pt.vy + fy) * damping;

        pt.x += pt.vx;
        pt.y += pt.vy;
      }

      // 4. Surface tension smoothing pass across neighbors for fluid cohesion
      for (let i = 0; i < n; i++) {
        const pt = points[i];
        if (pt.pinned) continue;
        const prev = points[(i - 1 + n) % n];
        const next = points[(i + 1) % n];
        const avgX = (prev.x + next.x) / 2;
        const avgY = (prev.y + next.y) / 2;
        const tension = 0.22;
        pt.x = pt.x * (1 - tension) + avgX * tension;
        pt.y = pt.y * (1 - tension) + avgY * tension;
      }

      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildSvgPath(points));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="hidden md:block absolute bottom-0 left-0 pointer-events-none select-none z-20 w-[180px] sm:w-[250px] md:w-[337px] h-auto overflow-visible">
      <svg
        ref={svgRef}
        viewBox="0 0 337 325"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[337px] overflow-visible select-none pointer-events-none"
      >
        <path
          ref={pathRef}
          d={buildSvgPath(pointsRef.current)}
          fill="url(#paint0_linear_243_113)"
          className="transition-colors duration-150"
        />
        <defs>
          <linearGradient
            id="paint0_linear_243_113"
            x1="317.222"
            y1="80.2167"
            x2="-285.952"
            y2="426.06"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#28ABE0" />
            <stop offset="0.288092" stopColor="#25B0A3" />
            <stop offset="0.520371" stopColor="#2DB76E" />
            <stop offset="0.6875" stopColor="#56C15B" />
            <stop offset="0.797922" stopColor="#74C84D" />
            <stop offset="1" stopColor="#C7DB28" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export interface ReaderReviewsProps {
  title?: string;
  reviews?: ReviewItem[];
}

export const ReaderReviews: React.FC<ReaderReviewsProps> = ({
  title = "How Akam\nMakes A\nDifference",
  reviews: initialReviews,
}) => {
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(
    initialReviews !== undefined ? initialReviews : []
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialReviews !== undefined) {
      setReviewsList(initialReviews);
      return;
    }

    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/reviews`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.data;
          if (Array.isArray(items) && isMounted) {
            setReviewsList(items);
          }
        }
      } catch (err) {
        console.error("Failed to fetch reader reviews:", err);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [initialReviews]);

  if (reviewsList.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      {/* ── Decorative Gradient Jelly Bubble Blob on Bottom Left ── */}
      <ReviewsJellyBlob />

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ">
          {/* Left Column: Section Title */}
          <div className="lg:col-span-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text leading-[1.2]">
              {title}
            </h2>
          </div>

          {/* Right Column: Review Cards Carousel & Controls */}
          <div className="lg:col-span-9  flex flex-col items-end w-full">
            <div className="w-full">
              <Swiper
                modules={[Navigation, Autoplay]}
                onSwiper={(s) => setSwiperInstance(s)}
                autoplay={{
                  delay: 6000,
                  disableOnInteraction: false,
                }}
                spaceBetween={24}
                slidesPerView={1}
                className="reader-reviews-swiper w-full !pb-2 [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
              >
                {reviewsList.map((item) => {
                  const photoUrl = item.image ? formatAssetUrl(item.image) : null;

                  return (
                    <SwiperSlide key={item.id} className="!h-auto flex flex-col">
                      <div className="bg-[#F7F8F7] rounded-[24px] overflow-hidden flex-1 flex flex-col-reverse md:flex-row border border-gray-100/80 md:min-h-[480px] w-full justify-between">
                        {/* Left Side of Card: Quote, Name & Role */}
                        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between flex-1 md:w-3/5">
                          {/* Quote Content */}
                          <div>
                            <p className="text-base sm:text-lg italic text-gray-800 font-normal leading-relaxed">
                              &ldquo;{item.quote}&rdquo;
                            </p>
                          </div>

                          {/* Reviewer Details */}
                          <div className="mt-6 sm:mt-8 pt-2 sm:pt-4">
                            <h4 className="text-base sm:text-lg font-semibold text-dark-text">
                              {item.name}
                            </h4>
                            {item.role && (
                              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                                {item.role}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Side of Card: Reviewer Photo */}
                        <div className="relative w-full md:w-2/5 h-[260px] sm:h-[320px] md:h-auto md:min-h-full overflow-hidden bg-gray-100 shrink-0">
                          {photoUrl ? (
                            <Image
                              src={photoUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              className="object-cover object-center"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full min-h-[260px] flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-900 font-bold text-2xl">
                              {item.name[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Circular Navigation Arrow Buttons (Bottom Right) */}
            <div className="flex items-center gap-3 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Previous Review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Next Review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReaderReviews;
