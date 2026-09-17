"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectCards } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { API_BASE_URL, apiFetch } from "@/lib/config";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-cards";

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
  backgroundColor?: string;
  slug?: string;
  href?: string;
}

export interface ExploreByInterestProps {
  title?: string;
  categories?: CategoryItem[];
}

const FALLBACK_CARD_COLORS = [
  "#E5F3A6", // Pale Lime Yellow
  "#EAB8B8", // Dusty Rose
  "#C49BF7", // Pastel Purple
  "#E57CE7", // Vibrant Magenta
  "#9CDAF0", // Sky Blue
  "#EDB46B", // Warm Amber
];

const normalizeCategories = (raw: any[]): CategoryItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: item.id || String(item.slug || Math.random()),
    title: item.title || item.name || "Community",
    description: item.description || "Engaging stories and rhymes to inspire young readers.",
    color: item.color || item.bgColor || item.backgroundColor || "",
    bgColor: item.bgColor || item.color || item.backgroundColor || "",
    slug: item.slug,
    href: item.href,
  }));
};

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

// 24 sampled points along the exact cubic bezier path of the left gradient blob
const LEFT_BLOB_POINTS: { id: number; x0: number; y0: number; pinned: boolean }[] = [
  { id: 0, x0: 212.06, y0: 176.61, pinned: false },
  { id: 1, x0: 105.52, y0: 133.98, pinned: false },
  { id: 2, x0: 2.83, y0: 188.76, pinned: true },
  { id: 3, x0: -102.05, y0: 238.04, pinned: true },
  { id: 4, x0: -210.91, y0: 197.51, pinned: true },
  { id: 5, x0: -272.04, y0: 96.90, pinned: true },
  { id: 6, x0: -352.34, y0: 9.08, pinned: true },
  { id: 7, x0: -447.36, y0: -56.73, pinned: true },
  { id: 8, x0: -550.29, y0: -6.90, pinned: true },
  { id: 9, x0: -625.99, y0: 83.05, pinned: true },
  { id: 10, x0: -591.12, y0: 189.94, pinned: true },
  { id: 11, x0: -510.82, y0: 277.75, pinned: true },
  { id: 12, x0: -410.24, y0: 330.20, pinned: true },
  { id: 13, x0: -305.09, y0: 277.13, pinned: true },
  { id: 14, x0: -189.32, y0: 282.95, pinned: true },
  { id: 15, x0: -113.21, y0: 369.68, pinned: true },
  { id: 16, x0: -52.88, y0: 470.02, pinned: true },
  { id: 17, x0: 27.43, y0: 557.84, pinned: false },
  { id: 18, x0: 115.34, y0: 637.90, pinned: false },
  { id: 19, x0: 228.76, y0: 635.52, pinned: false },
  { id: 20, x0: 320.30, y0: 558.59, pinned: false },
  { id: 21, x0: 392.15, y0: 465.54, pinned: false },
  { id: 22, x0: 372.36, y0: 353.31, pinned: false },
  { id: 23, x0: 292.36, y0: 264.43, pinned: false },
];

// 24 sampled points along the exact cubic bezier path of the right gradient blob
const RIGHT_BLOB_POINTS: { id: number; x0: number; y0: number; pinned: boolean }[] = [
  { id: 0, x0: 505.99, y0: -367.34, pinned: true },
  { id: 1, x0: 427.94, y0: -279.63, pinned: true },
  { id: 2, x0: 444.98, y0: -161.78, pinned: true },
  { id: 3, x0: 455.95, y0: -43.72, pinned: true },
  { id: 4, x0: 379.12, y0: 46.96, pinned: true },
  { id: 5, x0: 261.06, y0: 70.81, pinned: false },
  { id: 6, x0: 148.65, y0: 117.57, pinned: false },
  { id: 7, x0: 52.30, y0: 186.15, pinned: false },
  { id: 8, x0: 64.49, y0: 302.51, pinned: false },
  { id: 9, x0: 124.74, y0: 406.62, pinned: false },
  { id: 10, x0: 239.71, y0: 410.20, pinned: false },
  { id: 11, x0: 352.13, y0: 363.44, pinned: true },
  { id: 12, x0: 437.55, y0: 284.88, pinned: true },
  { id: 13, x0: 423.02, y0: 165.25, pinned: true },
  { id: 14, x0: 468.85, y0: 55.86, pinned: true },
  { id: 15, x0: 578.75, y0: 12.77, pinned: true },
  { id: 16, x0: 696.28, y0: -10.43, pinned: true },
  { id: 17, x0: 808.70, y0: -57.19, pinned: true },
  { id: 18, x0: 916.29, y0: -113.96, pinned: true },
  { id: 19, x0: 953.41, y0: -223.94, pinned: true },
  { id: 20, x0: 911.19, y0: -338.77, pinned: true },
  { id: 21, x0: 846.61, y0: -440.24, pinned: true },
  { id: 22, x0: 731.74, y0: -460.19, pinned: true },
  { id: 23, x0: 618.41, y0: -414.10, pinned: true },
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

function useJellyPhysics(
  initialPoints: { id: number; x0: number; y0: number; pinned: boolean }[],
  center: { x: number; y: number },
  maxPullDistance: number = 65
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pointsRef = useRef<BubblePoint[]>(
    initialPoints.map((p) => ({ ...p, x: p.x0, y: p.y0, vx: 0, vy: 0 }))
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

        // Dynamic taper near anchored base points
        const prevPinned = points[(i - 1 + n) % n].pinned;
        const nextPinned = points[(i + 1) % n].pinned;
        const prev2Pinned = points[(i - 2 + n) % n].pinned;
        const next2Pinned = points[(i + 2) % n].pinned;

        let taper = 1.0;
        if (prevPinned || nextPinned) taper = 0.55;
        else if (prev2Pinned || next2Pinned) taper = 0.85;

        // 1. Gentle, slow organic ambient fluid waves
        const current1 = Math.sin(time * 0.45 - i * 0.38) * 3.8;
        const current2 = Math.cos(time * 0.32 + i * 0.28) * 2.6;
        const current3 = Math.sin(time * 0.65 - i * 0.48) * 1.5;
        const fluidWave = (current1 + current2 + current3) * taper;

        const radX = pt.x0 - center.x;
        const radY = pt.y0 - center.y;
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
            const pull = Math.pow(1 - normDist, 2.2) * maxPullDistance * cursor.intensity * taper;
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
  }, [center.x, center.y, maxPullDistance]);

  return {
    svgRef,
    pathRef,
    pointsRef,
  };
}

const LeftJellyBlob: React.FC = () => {
  const { svgRef, pathRef, pointsRef } = useJellyPhysics(
    LEFT_BLOB_POINTS,
    { x: -150, y: 300 },
    42
  );

  return (
    <div
      className="hidden md:block absolute -left-16 sm:-left-24 md:-left-32 top-1/2 w-64 sm:w-80 md:w-[440px] h-auto pointer-events-none select-none z-0 opacity-95 overflow-visible"
      style={{ transform: "translateY(-50%)" }}
    >
      <svg
        ref={svgRef}
        className="w-full h-auto overflow-visible select-none"
        width="452"
        height="748"
        viewBox="0 0 452 748"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="paint0_linear_352_41"
            x1="-649.126"
            y1="146.239"
            x2="740.261"
            y2="455.259"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E0892B" />
            <stop offset="0.29" stopColor="#B22222" />
            <stop offset="0.48" stopColor="#8123DB" />
            <stop offset="0.8" stopColor="#CF25D8" />
            <stop offset="1" stopColor="#CF25D8" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={buildSvgPath(pointsRef.current)}
          fill="url(#paint0_linear_352_41)"
          fillOpacity={0.34}
        />
      </svg>
    </div>
  );
};

const RightJellyBlob: React.FC = () => {
  const { svgRef, pathRef, pointsRef } = useJellyPhysics(
    RIGHT_BLOB_POINTS,
    { x: 550, y: -100 },
    42
  );

  return (
    <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-80 lg:w-[420px] h-auto pointer-events-none select-none z-0 overflow-visible">
      <svg
        ref={svgRef}
        width="420"
        height="494"
        viewBox="0 0 420 494"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient
            id="paint0_linear_352_49"
            x1="217.098"
            y1="487.335"
            x2="997.282"
            y2="-742.306"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E0892B" />
            <stop offset="0.29" stopColor="#B22222" />
            <stop offset="0.48" stopColor="#8123DB" />
            <stop offset="0.8" stopColor="#CF25D8" />
            <stop offset="1" stopColor="#CF25D8" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={buildSvgPath(pointsRef.current)}
          fill="url(#paint0_linear_352_49)"
          fillOpacity={0.31}
        />
      </svg>
    </div>
  );
};

export const ExploreByInterest: React.FC<ExploreByInterestProps> = ({
  title = "Explore By Interest",
  categories: initialPropCategories,
}) => {
  const router = useRouter();
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(
    initialPropCategories && initialPropCategories.length > 0
      ? normalizeCategories(initialPropCategories)
      : []
  );
  const [loading, setLoading] = useState<boolean>(!initialPropCategories || initialPropCategories.length === 0);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  useEffect(() => {
    if (initialPropCategories && initialPropCategories.length > 0) {
      setCategoriesList(normalizeCategories(initialPropCategories));
    }

    let isMounted = true;
    const fetchLiveCommunities = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/communities`, { cache: "no-store" });
        if (res.ok) {
          const liveData: any[] = await res.json();
          const list = Array.isArray(liveData) ? liveData : (liveData as any).data || [];
          if (Array.isArray(list) && list.length > 0 && isMounted) {
            setCategoriesList(normalizeCategories(list));
          }
        }
      } catch (err) {
        console.error("Failed to fetch communities", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveCommunities();
    return () => {
      isMounted = false;
    };
  }, [initialPropCategories]);

  if (!loading && categoriesList.length === 0) {
    return null;
  }

  const getSlug = (cat: CategoryItem) =>
    cat.slug || (cat.title ? cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "community");

  const visibleCategories = showAll ? categoriesList : categoriesList.slice(0, 7);

  const renderCard = (cat: CategoryItem, index: number) => {
    const slug = getSlug(cat);
    // Prioritize API background color dynamically, fallback to preset palette if missing
    const bgColor =
      cat.color ||
      cat.bgColor ||
      cat.backgroundColor ||
      FALLBACK_CARD_COLORS[index % FALLBACK_CARD_COLORS.length];

    return (
      <div className="relative w-full h-full group select-none">
        {/* Physical Stack Model Layer Underlay (Simulates layered cards stacked underneath) */}
        {/* <div className="absolute -bottom-2 -right-1.5 w-full h-full rounded-[24px] bg-black/[0.08] -z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1 pointer-events-none" />
        <div className="absolute -bottom-3.5 -right-3 w-full h-full rounded-[24px] bg-black/[0.03] -z-20 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5 pointer-events-none" /> */}

        <div
          key={cat.id}
          onClick={() => router.push(cat.href || `/communities/${slug}`)}
          className="relative rounded-[22px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 border border-black/[0.06] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] group-hover:shadow-[0_22px_40px_-8px_rgba(0,0,0,0.2)] cursor-pointer w-full min-h-[210px] h-full"
          style={{ backgroundColor: bgColor }}
        >
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight leading-snug mb-2 font-poppins">
              {cat.title}
            </h3>
            <p className="text-xs text-gray-800/85 font-normal leading-relaxed mb-5 font-poppins">
              {cat.description}
            </p>
          </div>

          <Link
            href={cat.href || `/communities/${slug}`}
            className="w-full bg-white text-gray-950 rounded-full px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer group-hover:bg-white/95"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-800 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  };

  // Serpentine Snake Pattern: Left to Right across 4 columns (0 -> 1 -> 2 -> 3), then Right to Left (3 -> 2 -> 1 -> 0)
  const getSnakeColumnIndex = (index: number, numCols: number = 4): number => {
    const cycleLen = (numCols - 1) * 2; // for 4 cols, cycleLen = 6
    const pos = index % cycleLen;
    if (pos < numCols) return pos;
    return cycleLen - pos;
  };


  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
      {/* ── Left Background Decorative Graphic (Interactive Jelly Blob) ── */}
      <LeftJellyBlob />

      {/* ── Top-Right Background Decorative Graphic (Interactive Jelly Blob) ── */}
      <RightJellyBlob />
      <div className="container px-6 mx-auto relative z-10 max-w-[1280px]">
        {/* Section Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-3xl sm:text-4xl lg:text-5xl font-medium text-center text-dark-text tracking-tight mb-12 sm:mb-16 font-poppins"
        >
          {title}
        </motion.h2>

        {/* Loading Skeleton */}
        {loading && categoriesList.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[22px] bg-gray-100 animate-pulse min-h-[210px] p-6"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Staggered Serpentine Diagonal Snake Layout with Card Stack Model Animation */}
            <div className="hidden md:grid md:grid-cols-4 gap-5 lg:gap-6 md:auto-rows-[95px] lg:auto-rows-[105px] w-full items-start pb-10 lg:pb-14">
              {visibleCategories.map((cat, index) => {
                const colIndex = getSnakeColumnIndex(index);
                return (
                  <motion.div
                    key={cat.id}
                    initial={{
                      opacity: 0,
                      y: 70,
                      scale: 0.9,
                      rotate: index % 2 === 0 ? -2.5 : 2.5,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                    }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.6,
                      delay: (index % 4) * 0.1 + Math.floor(index / 4) * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{
                      y: -12,
                      scale: 1.03,
                      zIndex: 35,
                      transition: { duration: 0.25, ease: "easeOut" },
                    }}
                    className="w-full relative"
                    style={{
                      gridColumnStart: colIndex + 1,
                      gridRowStart: index + 1,
                      gridRowEnd: "span 2",
                    }}
                  >
                    {renderCard(cat, index)}
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile Card Stack Swiper Slider */}
            <div className="block md:hidden w-full  px-2 py-2">
              <Swiper
                modules={[EffectCards, Navigation]}
                effect="cards"
                grabCursor={true}
                cardsEffect={{
                  perSlideOffset: 10,
                  perSlideRotate: 2.5,
                  rotate: true,
                  slideShadows: false,
                }}
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                className="w-[88%] max-w-[340px] mx-auto py-4 [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
              >
                {categoriesList.map((cat, index) => (
                  <SwiperSlide key={cat.id} className="!h-auto !flex !flex-col">
                    {renderCard(cat, index)}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Mobile Carousel Navigation Arrows & Stack Indicator */}
              <div className="flex items-center justify-end pt-5 max-w-[340px] mx-auto px-1">
               
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => swiperInstance?.slidePrev()}
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                    aria-label="Previous Category"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => swiperInstance?.slideNext()}
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer shadow-xs active:scale-95"
                    aria-label="Next Category"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* View More / Show Less Button (Desktop) */}
        {categoriesList.length > 7 && (
          <div className="hidden md:flex justify-center mt-8 sm:mt-10 lg:mt-12 relative z-30">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all text-xs font-semibold shadow-md cursor-pointer active:scale-98 relative z-30"
            >
              {showAll ? "Show less" : "View more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreByInterest;
