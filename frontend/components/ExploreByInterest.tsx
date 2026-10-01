"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectCards } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { createNoise3D } from "simplex-noise";
import { API_BASE_URL, apiFetch } from "@/lib/config";
import WebGLJellyBackground from "@/components/WebGLJellyBackground";

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

// ─────────────────────────────────────────────────────────────────────────────
// Shape-Preserving Fluid Jelly Blobs with Real-Time Cursor Interaction & Physics
// ─────────────────────────────────────────────────────────────────────────────

const noise3D = createNoise3D();

// ── Original Figma base path points ──────────────────────────────────────────
const LEFT_REST_BASE: [number, number][] = [
  [212.06, 176.61], [105.52, 133.98], [2.83, 188.76],   [-102.05, 238.04],
  [-210.91, 197.51],[-272.04, 96.90], [-352.34, 9.08],  [-447.36, -56.73],
  [-550.29, -6.90], [-625.99, 83.05], [-591.12, 189.94],[-510.82, 277.75],
  [-410.24, 330.20],[-305.09, 277.13],[-189.32, 282.95],[-113.21, 369.68],
  [-52.88, 470.02],  [27.43, 557.84],  [115.34, 637.90], [228.76, 635.52],
  [320.30, 558.59],  [392.15, 465.54], [372.36, 353.31], [292.36, 264.43],
];

const RIGHT_REST_BASE: [number, number][] = [
  [505.99, -367.34],[427.94, -279.63],[444.98, -161.78],[455.95, -43.72],
  [379.12, 46.96],  [261.06, 70.81],  [148.65, 117.57], [52.30, 186.15],
  [64.49, 302.51],  [124.74, 406.62], [239.71, 410.20], [352.13, 363.44],
  [437.55, 284.88], [423.02, 165.25], [468.85, 55.86],  [578.75, 12.77],
  [696.28, -10.43], [808.70, -57.19], [916.29, -113.96],[953.41, -223.94],
  [911.19, -338.77],[846.61, -440.24],[731.74, -460.19], [618.41, -414.10],
];

/** Subdivide base points with smooth Catmull-Rom interpolation for organic density */
function subdividePoints(pts: [number, number][], factor: number = 2): [number, number][] {
  const n = pts.length;
  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let k = 0; k < factor; k++) {
      const t = k / factor;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );
      result.push([x, y]);
    }
  }
  return result;
}

const LEFT_REST = subdividePoints(LEFT_REST_BASE, 3);
const RIGHT_REST = subdividePoints(RIGHT_REST_BASE, 3);

const LEFT_CX = LEFT_REST.reduce((s, p) => s + p[0], 0) / LEFT_REST.length;
const LEFT_CY = LEFT_REST.reduce((s, p) => s + p[1], 0) / LEFT_REST.length;

const RIGHT_CX = RIGHT_REST.reduce((s, p) => s + p[0], 0) / RIGHT_REST.length;
const RIGHT_CY = RIGHT_REST.reduce((s, p) => s + p[1], 0) / RIGHT_REST.length;

function buildNormals(pts: [number, number][], cx: number, cy: number): { normals: [number, number][]; angles: number[]; dists: number[] } {
  const normals: [number, number][] = [];
  const angles: number[] = [];
  const dists: number[] = [];
  pts.forEach(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    normals.push([dx / len, dy / len]);
    angles.push(Math.atan2(dy, dx));
    dists.push(len);
  });
  return { normals, angles, dists };
}

const LEFT_META = buildNormals(LEFT_REST, LEFT_CX, LEFT_CY);
const RIGHT_META = buildNormals(RIGHT_REST, RIGHT_CX, RIGHT_CY);

/** Smooth closed SVG path using Catmull-Rom → cubic bezier */
function buildFluidPath(pts: [number, number][]): string {
  const n = pts.length;
  const cp: [number, number, number, number][] = [];
  const alpha = 1 / 6;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    cp.push([
      p1[0] + alpha * (p2[0] - p0[0]),
      p1[1] + alpha * (p2[1] - p0[1]),
      p2[0] - alpha * (p3[0] - p1[0]),
      p2[1] - alpha * (p3[1] - p1[1]),
    ]);
  }
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [c1x, c1y, c2x, c2y] = cp[i];
    const nxt = pts[(i + 1) % n];
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${nxt[0].toFixed(2)},${nxt[1].toFixed(2)}`;
  }
  return d + " Z";
}

interface FluidConfig {
  rest: [number, number][];
  normals: [number, number][];
  angles: number[];
  amplitude: number;
  timeScale: number;
  phase: number;
  interactionRadius: number;
  pushStrength: number;
}

const LEFT_FLUID_CONFIG: FluidConfig = {
  rest: LEFT_REST,
  normals: LEFT_META.normals,
  angles: LEFT_META.angles,
  amplitude: 70,
  timeScale: 0.00038,
  phase: 0,
  interactionRadius: 420,
  pushStrength: 75,
};

const RIGHT_FLUID_CONFIG: FluidConfig = {
  rest: RIGHT_REST,
  normals: RIGHT_META.normals,
  angles: RIGHT_META.angles,
  amplitude: 64,
  timeScale: 0.00032,
  phase: 43.2,
  interactionRadius: 380,
  pushStrength: 65,
};

/**
 * Interactive fluid hook combining multi-octave 3D noise + viscous spring-mass surface wave physics
 * driven by silky-smooth cursor proximity and fluid wake momentum.
 */
function useInteractiveFluidBlob(cfg: FluidConfig) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const { rest, normals, angles, amplitude, timeScale, phase, interactionRadius, pushStrength } = cfg;
    const n = rest.length;

    // Physics state for jelly recoil & ripples
    const displacements = new Float32Array(n);
    const velocities = new Float32Array(n);
    const cursorTension = new Float32Array(n);

    // Mouse tracking in SVG coordinate space
    let targetMouseX = -9999;
    let targetMouseY = -9999;
    let smoothMouseX = -9999;
    let smoothMouseY = -9999;
    let mouseVx = 0;
    let mouseVy = 0;
    let lastClientX = -9999;
    let lastClientY = -9999;
    let lastMoveTime = 0;

    const onPointerMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      lastMoveTime = now;

      if (lastClientX !== -9999) {
        const rawVx = (e.clientX - lastClientX) / (dt * 0.001);
        const rawVy = (e.clientY - lastClientY) / (dt * 0.001);
        mouseVx = mouseVx * 0.75 + rawVx * 0.25;
        mouseVy = mouseVy * 0.75 + rawVy * 0.25;
      }
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      // Convert client coords into SVG viewBox coordinate space
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(ctm.inverse());
        targetMouseX = svgPt.x;
        targetMouseY = svgPt.y;
      } else {
        const rect = svg.getBoundingClientRect();
        targetMouseX = ((e.clientX - rect.left) / (rect.width || 1)) * 452;
        targetMouseY = ((e.clientY - rect.top) / (rect.height || 1)) * 748;
      }
    };

    const onPointerLeave = () => {
      targetMouseX = -9999;
      targetMouseY = -9999;
      lastClientX = -9999;
      lastClientY = -9999;
      mouseVx = 0;
      mouseVy = 0;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave, { passive: true });

    let rafId: number;
    let lastTs = performance.now();

    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTs) * 0.001, 0.04); // cap delta time
      lastTs = ts;

      const t = ts * timeScale;

      // Viscous mouse smoothing (exponential low-pass filter)
      if (targetMouseX > -5000) {
        if (smoothMouseX < -5000) {
          smoothMouseX = targetMouseX;
          smoothMouseY = targetMouseY;
        } else {
          const lerpFactor = 1 - Math.exp(-dt * 9.0);
          smoothMouseX += (targetMouseX - smoothMouseX) * lerpFactor;
          smoothMouseY += (targetMouseY - smoothMouseY) * lerpFactor;
        }
      } else {
        smoothMouseX = -9999;
        smoothMouseY = -9999;
      }

      // Smooth decay for velocity
      mouseVx *= Math.exp(-dt * 5.0);
      mouseVy *= Math.exp(-dt * 5.0);

      const pts: [number, number][] = new Array(n);

      // Viscous spring-mass constants with strong surface tension coupling
      const kSpring = 12.5;
      const cDamping = 5.8;
      const cCoupling = 22.0;

      for (let i = 0; i < n; i++) {
        const [x0, y0] = rest[i];
        const [nx, ny] = normals[i];
        const angle = angles[i];

        // 1. Slow, Graceful, Living Liquid Swell & Bubble Motion
        const n1 = noise3D(
          Math.cos(angle + t * 0.35) * 1.25 + phase,
          Math.sin(angle + t * 0.35) * 1.25 + phase,
          t * 0.45
        );
        const n2 = noise3D(
          Math.cos(2 * angle - t * 0.22) * 1.75 + phase + 8.0,
          Math.sin(2 * angle - t * 0.22) * 1.75 + phase + 8.0,
          t * 0.65
        );
        const n3 = noise3D(
          Math.cos(3 * angle + t * 0.15) * 2.2,
          Math.sin(3 * angle + t * 0.15) * 2.2,
          t * 0.25
        );
        // Soft continuous organic bubbling swells
        const bubbleLobe =
          Math.sin(angle * 2.0 + t * 0.40) * 0.28 +
          Math.sin(angle * 3.0 - t * 0.28) * 0.20;

        const noiseDisp = (n1 * 0.48 + n2 * 0.26 + n3 * 0.10 + bubbleLobe * 0.32) * amplitude;

        // 2. Smooth C2 Continuous Quintic Potential Field for Cursor Interaction
        let targetPush = 0;
        let impulse = 0;

        if (smoothMouseX > -5000) {
          const dx = x0 - smoothMouseX;
          const dy = y0 - smoothMouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < interactionRadius) {
            const u = dist / interactionRadius;
            // Quintic C2 continuous curve: (1 - u^2)^3 with 0 derivative at boundary and center
            const w = Math.pow(1 - u * u, 3);

            const len = dist || 1;
            const uX = dx / len;
            const uY = dy / len;

            // Alignment with outward normal
            const normalAlignment = uX * nx + uY * ny;
            targetPush = normalAlignment * w * pushStrength;

            // Velocity wake momentum transferred to fluid
            const dotVel = (mouseVx * nx + mouseVy * ny) * 0.012;
            impulse = dotVel * w * 14.0;
          }
        }

        // Viscous relaxation towards target push
        cursorTension[i] += (targetPush - cursorTension[i]) * Math.min(1, dt * 10.0);

        // 3. Fluid Surface Wave Simulation (Laplacian Neighbor Coupling)
        const prevDisp = displacements[(i - 1 + n) % n];
        const nextDisp = displacements[(i + 1) % n];
        const laplacian = prevDisp + nextDisp - 2 * displacements[i];

        const netForce = impulse - kSpring * (displacements[i] - cursorTension[i]) - cDamping * velocities[i] + cCoupling * laplacian;
        velocities[i] += netForce * dt;
        displacements[i] += velocities[i] * dt;

        // Total smooth displaced point position
        const totalNormalDisp = noiseDisp + displacements[i];
        pts[i] = [
          x0 + nx * totalNormalDisp,
          y0 + ny * totalNormalDisp,
        ];
      }

      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildFluidPath(pts));
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseleave", onPointerLeave);
    };
  }, [cfg]);

  return { pathRef, svgRef };
}

// ── Left Jelly Blob ──────────────────────────────────────────────────────────
const LeftJellyBlob: React.FC = () => {
  const { pathRef, svgRef } = useInteractiveFluidBlob(LEFT_FLUID_CONFIG);
  return (
    <div
      className="absolute -left-12 sm:-left-16 md:-left-20 top-1/2 w-48 sm:w-60 md:w-72 lg:w-[320px] h-auto pointer-events-none select-none z-0 overflow-visible opacity-60"
      style={{ transform: "translateY(-50%)" }}
    >
      <svg
        ref={svgRef}
        className="w-full h-auto overflow-visible select-none pointer-events-none"
        width="452" height="748" viewBox="0 0 452 748"
        fill="none" xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="jelly-grad-left"
            x1="-649.126" y1="146.239" x2="740.261" y2="455.259"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F1DCFA" />
            <stop offset="1" stopColor="#E8CCF8" />
          </linearGradient>
        </defs>
        <path ref={pathRef} fill="url(#jelly-grad-left)" fillOpacity={0.45} />
      </svg>
    </div>
  );
};

// ── Right Jelly Blob ─────────────────────────────────────────────────────────
const RightJellyBlob: React.FC = () => {
  const { pathRef, svgRef } = useInteractiveFluidBlob(RIGHT_FLUID_CONFIG);
  return (
    <div className="absolute top-0 right-0 w-36 sm:w-48 md:w-60 lg:w-[290px] h-auto pointer-events-none select-none z-0 overflow-visible opacity-60">
      <svg
        ref={svgRef}
        width="420" height="494" viewBox="0 0 420 494"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible select-none pointer-events-none"
      >
        <defs>
          <linearGradient
            id="jelly-grad-right"
            x1="217.098" y1="487.335" x2="997.282" y2="-742.306"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F8EAE4" />
            <stop offset="1" stopColor="#F3DED5" />
          </linearGradient>
        </defs>
        <path ref={pathRef} fill="url(#jelly-grad-right)" fillOpacity={0.45} />
      </svg>
    </div>
  );
};

export const ExploreByInterest: React.FC<ExploreByInterestProps> = ({
  title = "Explore By Interest",
  categories: initialPropCategories,
}) => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
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
    <section
      ref={sectionRef}
      className="relative w-full bg-white py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden"
    >
      {/* ── Standard Three.js WebGL Interactive Fluid Canvas (<canvas data-engine="three.js" class="gl">) ── */}
      <WebGLJellyBackground containerRef={sectionRef} className="hidden md:block z-0" />

      {/* ── Mobile Fallback Fluid Jelly Graphic ── */}
      <div className="block md:hidden">
        <LeftJellyBlob />
        <RightJellyBlob />
      </div>
      <div className="container px-6 mx-auto relative z-10 ">
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
            <div className="hidden md:grid md:grid-cols-4 gap-5 lg:gap-12 md:auto-rows-[95px] lg:auto-rows-[105px] w-full items-start pb-10 lg:pb-14">
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