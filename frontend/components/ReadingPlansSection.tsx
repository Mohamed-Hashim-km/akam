"use client";

import React, { useState } from "react";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import Button from "./ui/Button";
import { AboutDigitalEdition } from "./AboutDigitalEdition";

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

// 22 sampled points along the exact cubic bezier path of the bottom-left gradient blob
const INITIAL_POINTS: { id: number; x0: number; y0: number; pinned: boolean }[] = [
  { id: 0, x0: -127.39, y0: 174.55, pinned: true },
  { id: 1, x0: -209.44, y0: 250.86, pinned: true },
  { id: 2, x0: -211.19, y0: 389.71, pinned: true },
  { id: 3, x0: -180.06, y0: 433.3, pinned: true },
  { id: 4, x0: -91.01, y0: 477.21, pinned: true },
  { id: 5, x0: 33.62, y0: 441.02, pinned: true },
  { id: 6, x0: 89.07, y0: 317.24, pinned: false },
  { id: 7, x0: 109.47, y0: 267.03, pinned: false },
  { id: 8, x0: 144.28, y0: 234.62, pinned: false },
  { id: 9, x0: 204.6, y0: 216.58, pinned: false },
  { id: 10, x0: 259.07, y0: 229.7, pinned: false },
  { id: 11, x0: 335.43, y0: 240.78, pinned: false },
  { id: 12, x0: 413.28, y0: 191.27, pinned: false },
  { id: 13, x0: 436.59, y0: 114.34, pinned: false },
  { id: 14, x0: 392.67, y0: 27.04, pinned: false },
  { id: 15, x0: 288.06, y0: 2.8, pinned: false },
  { id: 16, x0: 200.99, y0: 75.42, pinned: false },
  { id: 17, x0: 181.26, y0: 140.09, pinned: false },
  { id: 18, x0: 120.0, y0: 198.28, pinned: false },
  { id: 19, x0: 56.85, y0: 204.85, pinned: false },
  { id: 20, x0: -2.08, y0: 178.82, pinned: true },
  { id: 21, x0: -61.66, y0: 163.82, pinned: true },
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

const JellyBubbleBlob: React.FC = () => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const pathRef = React.useRef<SVGPathElement | null>(null);

  // Mutable physics points for the spline edge
  const pointsRef = React.useRef<BubblePoint[]>(
    INITIAL_POINTS.map((p) => ({
      ...p,
      x: p.x0,
      y: p.y0,
      vx: 0,
      vy: 0,
    }))
  );

  const cursorRef = React.useRef<{
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

  // Convert pointer event to SVG viewBox coordinate system
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
  React.useEffect(() => {
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
  React.useEffect(() => {
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

        // Dynamic taper near anchored corner base points
        let taper = 1.0;
        if (i === 1 || i === 11) taper = 0.55;
        else if (i === 2 || i === 10) taper = 0.85;

        // 1. Gentle, slow organic ambient fluid waves
        const current1 = Math.sin(time * 0.45 - i * 0.38) * 3.8;
        const current2 = Math.cos(time * 0.32 + i * 0.28) * 2.6;
        const current3 = Math.sin(time * 0.65 - i * 0.48) * 1.5;
        const fluidWave = (current1 + current2 + current3) * taper;

        // Radial direction vector from bottom-left corner anchor (0, 479)
        const radX = pt.x0;
        const radY = pt.y0 - 479;
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

      // Update SVG path directly
      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildSvgPath(points));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="hidden md:block absolute bottom-0 left-0 z-20 pointer-events-none -ml-4 -mb-4 sm:-ml-8 sm:-mb-8 md:-ml-10 md:-mb-10 select-none overflow-visible"
      style={{
        transform: "none",
      }}
    >
      <svg
        ref={svgRef}
        className="w-44 sm:w-60 md:w-80 lg:w-96 h-auto overflow-visible select-none pointer-events-none"
        viewBox="0 0 437 479"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ref={pathRef}
          d={buildSvgPath(pointsRef.current)}
          fill="url(#paint0_linear_255_3473)"
          className="transition-colors duration-150"
        />
        <defs>
          <linearGradient
            id="paint0_linear_255_3473"
            x1="-206.612"
            y1="396.488"
            x2="409.512"
            y2="43.2191"
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

export interface FeatureRow {
  name: string;
  readerMember: boolean;
  masikaPass: boolean;
}

export interface FeatureCategory {
  title: string;
  items: FeatureRow[];
}

export interface ReadingPlansSectionProps {
  title?: string;
  ctaHeadline?: string;
  onSubscribe?: () => void;
  onStudentApply?: () => void;
  className?: string;
}

const defaultCategories: FeatureCategory[] = [
  {
    title: "Reading Access",
    items: [
      { name: "Selected stories & articles", readerMember: true, masikaPass: true },
      { name: "Featured literary content", readerMember: true, masikaPass: true },
      { name: "Full monthly digital edition", readerMember: false, masikaPass: true },
      { name: "Subscriber-only stories", readerMember: false, masikaPass: true },
      { name: "Exclusive literary features", readerMember: false, masikaPass: true },
    ],
  },
  {
    title: "Digital Library",
    items: [
      { name: "Browse AKAM collections", readerMember: true, masikaPass: true },
      { name: "Save favourite stories", readerMember: true, masikaPass: true },
      { name: "Access past editions", readerMember: false, masikaPass: true },
      { name: "Complete digital archive", readerMember: false, masikaPass: true },
      { name: "Downloadable PDF editions", readerMember: false, masikaPass: true },
    ],
  },
  {
    title: "Reader Community",
    items: [
      { name: "Reader discussions", readerMember: true, masikaPass: true },
      { name: "Follow authors & publications", readerMember: true, masikaPass: true },
      { name: "Save reading preferences", readerMember: true, masikaPass: true },
      { name: "Early access to selected content", readerMember: false, masikaPass: true },
    ],
  },
];

export const ReadingPlansSection: React.FC<ReadingPlansSectionProps> = ({
  title = "Make AKAM a part of your reading.",
  ctaHeadline = "Ready To Read Beyond The Ordinary?",
  onSubscribe,
  onStudentApply,
  className = "",
}) => {
  const [categories] = useState<FeatureCategory[]>(defaultCategories);

  const handleSubscribeClick = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      // Scroll smoothly to Masika pass pricing or trigger modal if present
      const target = document.getElementById("masika-pricing-cards");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="masika-pricing-comparison" className={`relative w-full bg-white py-14 sm:py-20 lg:py-24 font-poppins overflow-hidden ${className}`}>
      {/* ── Top Right Dummy SVG Motif (Replaceable) ────────────────── */}
      <div className="hidden sm:block absolute top-0 right-0 sm:top-8 z-0 pointer-events-none">
        <svg className="w-20 sm:w-56 h-auto" viewBox="0 0 219 195" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="path-1-inside-1_255_3470" fill="white">
            <path d="M149.333 114.838L148.976 115.028L131.202 81.6792C129.982 79.3903 128.576 77.3316 126.981 75.4371C125.687 73.8994 124.266 72.4682 122.72 71.121C113.572 63.142 101.954 64.5193 91.288 70.7182L91.0842 70.3695L91.1222 69.9697C94.0353 70.2342 96.6794 70.2731 99.4681 71.0102C103.408 72.0554 106.757 74.2229 109.289 77.2306C110.301 78.4331 111.184 79.7706 111.922 81.2245C115.107 87.4396 115.607 93.2665 111.563 99.2351L111.228 99.0127L111.566 99.2325C109.641 102.209 107.016 104.055 104.212 106.69L103.937 106.395L103.84 106.004C107.374 105.126 110.584 103.9 114.281 103.736C120.717 103.447 125.703 106.212 129.438 110.662C130.773 112.249 131.956 114.048 132.999 116.008C134.631 119.069 136.009 122.066 136.874 125.431C139.896 137.149 134.731 147.15 125.917 154.559C125.352 155.035 124.77 155.503 124.175 155.957C114.762 163.155 101.553 169.761 89.5379 170.127C81.3678 170.373 73.7234 167.434 67.7089 161.924C66.1584 160.502 64.7171 159.01 63.3813 157.423C61.5743 155.276 59.9675 152.966 58.5566 150.444C55.0278 144.14 51.7366 137.899 48.574 131.397C45.8304 125.756 44.168 119.883 43.5628 113.724C42.8847 106.833 44.218 100.383 47.3463 94.0345L47.7054 94.2104L47.8824 94.5711C44.4021 96.2711 41.205 98.2951 38.4354 100.626C31.2495 106.686 26.9341 114.764 27.869 124.686C28.3438 129.693 29.6933 134.442 31.9076 139.078C34.8109 145.147 37.8551 150.913 41.1731 156.785C43.8578 161.535 47.1091 165.986 50.661 170.206C53.7701 173.899 57.1042 177.409 60.4843 180.785C62.6163 182.911 64.7952 184.697 67.3134 186.592L67.8201 186.974L56.6374 192.804C47.0488 197.77 34.1541 192.955 27.2326 184.914C27.0385 184.684 26.8412 184.456 26.6471 184.225C22.6007 179.418 19.2099 174.375 16.1422 168.875C13.0055 163.25 10.1184 157.746 7.27943 151.954C1.38343 139.924 -2.01645 126.071 1.30366 112.824C3.90152 102.493 10.2363 94.1127 18.1992 87.4097C20.4933 85.4786 22.924 83.6847 25.4433 82.0212C31.2193 78.2101 37.1784 75.0803 43.5713 72.4471C50.1718 69.7284 56.872 68.2186 64.1037 67.948L64.1168 68.3521L63.7818 68.1297C66.398 64.2249 69.4619 60.7892 72.9849 57.8237C74.9023 56.2097 76.9532 54.7355 79.1433 53.4016C91.0029 46.1825 105.553 40.624 119.214 45.3032C125.09 47.3197 129.453 50.9985 133.811 55.7372L133.512 56.0094L133.119 56.0936C131.616 49.0193 131.758 42.5574 134.302 36.1656C136.338 31.0461 139.329 26.6525 143.245 22.731C144.493 21.5181 145.766 20.3617 147.075 19.2597C149.718 17.0349 152.509 15.0226 155.532 13.187C166.55 6.49746 178.543 1.01586 191.503 0.111347C205.735 -0.886481 218.2 4.87279 227.63 15.342C228.506 16.3129 229.366 17.2912 230.202 18.2845C232.91 21.5015 235.381 24.8813 237.381 28.7048L249.677 52.1991C252.321 57.2513 253.499 62.7179 253.866 68.2678C254.552 78.572 250.115 87.1943 242.403 93.681C241.973 94.0423 241.533 94.397 241.083 94.745C235.164 99.333 228.562 102.689 221.419 104.876C211.184 108.016 200.576 106.762 192.436 99.5999C190.939 98.2853 189.558 96.8889 188.292 95.385C187.026 93.8811 185.805 92.1666 184.754 90.355C181.856 85.3644 179.221 80.3472 176.779 75.109C174.872 71.0189 173.709 66.8427 173.241 62.4447C172.383 54.4127 175.401 46.8488 181.455 41.7578C182.267 41.0742 183.129 40.4377 184.047 39.8488C187.423 37.6798 190.971 36.1169 194.624 34.477L205.325 29.6673L205.49 30.0328L205.245 30.3551C197.956 24.7988 188.81 24.3056 180.406 26.9816C174.273 28.9392 168.659 31.9464 163.524 35.8542C163.036 36.2277 162.56 36.6079 162.097 36.9977C155.825 42.2821 151.831 49.2696 152.636 57.5829C153.029 61.6345 154.075 65.5094 156.029 69.2404L185.272 125.125L184.94 125.32C175.812 130.677 165.481 131.859 157.043 124.643C155.373 123.216 153.793 121.703 152.367 120.009C151.104 118.508 149.959 116.865 148.974 115.019L149.331 114.829L149.688 114.639C150.643 116.431 151.755 118.028 152.987 119.492C154.377 121.143 155.92 122.625 157.569 124.032C165.7 130.965 175.549 129.868 184.535 124.626L184.739 124.975L184.38 125.162L155.312 69.6175C153.307 65.7879 152.234 61.805 151.831 57.6669C150.992 49.0305 155.169 41.7726 161.576 36.3852C162.051 35.985 162.537 35.597 163.034 35.2157C168.237 31.2565 173.935 28.1991 180.162 26.2151C188.746 23.4771 198.192 23.9697 205.735 29.7161L206.274 30.1243L194.951 35.2104C191.295 36.853 187.788 38.4022 184.48 40.5253C183.592 41.0939 182.757 41.7127 181.973 42.3728C176.125 47.2954 173.215 54.574 174.043 62.3577C174.502 66.6692 175.638 70.7517 177.51 74.7673C179.942 79.9818 182.563 84.9749 185.451 89.9475C186.482 91.7175 187.631 93.346 188.91 94.8652C190.189 96.3845 191.499 97.7035 192.97 98.9931C200.873 105.944 211.144 107.172 221.184 104.102C228.239 101.941 234.751 98.6295 240.59 94.1034C241.032 93.7632 241.463 93.4106 241.883 93.0572C249.445 86.6864 253.723 78.3509 253.061 68.3146C252.696 62.842 251.539 57.4887 248.961 52.565L236.665 29.0706C234.702 25.316 232.267 21.9848 229.583 18.7956C228.754 17.8115 227.899 16.8393 227.026 15.8715C217.726 5.55607 205.529 -0.0720335 191.553 0.904442C178.789 1.79678 166.911 7.20796 155.947 13.8677C152.959 15.6835 150.2 17.6699 147.588 19.8687C146.294 20.9577 145.033 22.1037 143.798 23.3005L143.518 23.0112L143.804 23.2953C139.955 27.1452 137.033 31.4388 135.04 36.4534C132.569 42.674 132.424 48.9441 133.898 55.916L134.203 57.3564L133.206 56.2724C128.882 51.5736 124.637 48.0106 118.939 46.0547C105.665 41.4909 91.3285 46.9015 79.5499 54.0788C77.3958 55.3929 75.3757 56.8411 73.4923 58.4265C70.028 61.3426 67.015 64.7196 64.4383 68.5649L64.3233 68.7353L64.1169 68.7408C56.9801 69.0051 50.3846 70.4951 43.8645 73.1777C37.5159 75.7946 31.6077 78.8972 25.8745 82.6776C23.3825 84.3234 20.9734 86.0991 18.7071 88.0068C10.8307 94.637 4.6198 102.876 2.08371 112.993C-1.17581 125.973 2.15437 139.643 8.00209 151.572C10.8338 157.349 13.7137 162.838 16.8457 168.451C19.8911 173.912 23.2513 178.912 27.2614 183.676C27.453 183.904 27.6471 184.134 27.8418 184.359C34.5505 192.185 47.1862 196.824 56.2652 192.061L66.8814 186.53L67.0672 186.888L66.8246 187.208C64.293 185.304 62.0763 183.491 59.9133 181.329C56.5223 177.946 53.1727 174.418 50.0428 170.7C46.4677 166.453 43.1827 161.961 40.4685 157.157C37.1432 151.271 34.0861 145.489 31.176 139.4C28.9227 134.686 27.5446 129.841 27.0638 124.738C26.0909 114.533 30.5757 106.155 37.9139 99.9882C40.7422 97.6075 43.9939 95.5481 47.5278 93.8239L48.5823 93.3093L48.0639 94.3605C44.9966 100.6 43.7015 106.876 44.3616 113.614C44.9577 119.681 46.5915 125.457 49.2967 131.014C52.452 137.501 55.7359 143.728 59.26 150.02C60.6465 152.494 62.2253 154.765 63.9987 156.871C65.3112 158.431 66.7287 159.901 68.2585 161.299C74.1303 166.676 81.5592 169.529 89.5199 169.291C101.258 168.947 114.384 162.418 123.691 155.287C124.276 154.842 124.849 154.381 125.404 153.913C134.07 146.603 139.016 136.975 136.098 125.606C135.257 122.331 133.913 119.4 132.29 116.363C131.267 114.445 130.114 112.693 128.82 111.156C125.186 106.852 120.492 104.252 114.31 104.516C110.777 104.668 107.624 105.867 104.028 106.76L102.532 107.132L103.657 106.074C106.517 103.399 109.072 101.584 110.886 98.7696L110.889 98.767C114.742 93.0281 114.289 87.6767 111.197 81.5723C110.482 80.1718 109.632 78.8858 108.661 77.7325C106.23 74.8446 103.03 72.7725 99.247 71.7691C96.5786 71.0621 93.9835 71.0187 91.0363 70.7514L89.7797 70.6373L90.8705 70.0029C101.67 63.6923 113.762 62.2204 123.236 70.4926C124.81 71.868 126.258 73.3242 127.583 74.8989C129.212 76.8333 130.65 78.9433 131.894 81.28L149.669 114.629L149.312 114.819L149.333 114.838ZM99.6386 122.189L99.7239 122.585C98.4148 122.872 97.2595 123.298 96.0019 123.879C92.8217 125.352 88.8674 124.898 86.596 122.212C86.3009 121.861 86.0402 121.476 85.8114 121.054L81.8327 113.689C80.1248 110.545 80.9518 107.121 83.4791 105.01C83.8897 104.664 84.3402 104.353 84.8331 104.08C85.3348 103.805 85.8099 103.473 86.2515 103.102C87.4772 102.07 88.426 100.709 88.8534 99.2614C89.4836 97.1335 88.7325 95.0754 87.7121 93.0548C87.1988 92.0314 86.6136 91.142 85.9716 90.3792C82.7925 86.6026 78.0994 85.7715 72.6186 86.6806L72.5534 86.2835L72.9084 86.4734L70.2843 91.3779C69.4568 92.9204 68.6936 94.3826 68.1666 96.019L67.7829 95.8954L68.1799 95.9658C66.735 103.882 69.1375 113.078 72.872 120.197L80.5433 134.831C81.4716 136.598 82.5413 138.22 83.7814 139.693C84.6176 140.687 85.5309 141.615 86.5308 142.471C89.58 145.09 93.4099 146.049 97.3459 145.085C100.686 144.265 103.796 142.676 106.424 140.465C106.665 140.262 106.9 140.053 107.13 139.844C109.706 137.476 110.65 134.123 109.632 130.796C108.99 128.704 108.025 126.7 106.746 125.186C104.971 123.096 102.689 121.933 99.7187 122.578L99.6334 122.183L99.5481 121.787C102.829 121.053 105.486 122.411 107.364 124.661C108.736 126.291 109.739 128.384 110.403 130.552C111.515 134.161 110.474 137.875 107.673 140.432C107.431 140.652 107.189 140.866 106.939 141.077C104.216 143.369 100.992 145.011 97.5319 145.863C93.3557 146.893 89.2268 145.855 85.9997 143.081C84.9683 142.194 84.0259 141.237 83.1613 140.21C81.8798 138.688 80.7774 137.015 79.8273 135.203L72.156 120.568C68.3613 113.322 65.9042 103.998 67.3865 95.8192L67.3916 95.7939L67.3997 95.766C67.9569 94.0464 68.7468 92.5407 69.5748 90.9925L72.2912 85.9157L72.4856 85.8834C78.0927 84.9363 83.1724 85.7942 86.5865 89.8564C87.2726 90.6714 87.8904 91.6121 88.4307 92.6864C89.4651 94.7425 90.348 97.026 89.6259 99.4834C89.1458 101.107 88.1067 102.586 86.7697 103.711C86.2881 104.116 85.7676 104.476 85.2206 104.779C84.773 105.024 84.3622 105.307 83.9947 105.616C81.7393 107.53 81.0186 110.46 82.5393 113.294L86.5181 120.659C86.7225 121.033 86.9525 121.376 87.2114 121.683C89.1831 124.038 92.7577 124.487 95.6638 123.138C96.9544 122.541 98.1778 122.089 99.5512 121.784L99.6365 122.18L99.6386 122.189ZM224.47 79.3085L224.226 78.988C224.382 78.8725 224.53 78.7534 224.672 78.6338C229.548 74.5557 228.02 68.028 225.09 62.3973L217.514 47.8822L216.845 46.4484L209.207 50.7492L206.181 52.4931C205.59 52.8323 205.045 53.2124 204.551 53.6282C201.596 56.1212 200.392 59.8616 201.5 63.7845C202.214 66.2939 203.39 68.6305 204.671 71.036C205.971 73.4831 207.134 75.8616 208.83 77.9131C208.861 77.95 208.892 77.9869 208.923 78.0238C213.151 83.0032 218.789 83.0447 224.223 78.9906L224.466 79.3111L224.71 79.6316C219.105 83.903 212.766 83.8741 208.309 78.541C208.277 78.5041 208.244 78.4642 208.21 78.4242C206.438 76.2747 205.256 73.8433 203.96 71.4137C202.677 68.9994 201.469 66.6115 200.726 64.0053C199.525 59.8031 200.842 55.6892 204.031 53.0101C204.562 52.563 205.147 52.1548 205.776 51.7932L208.805 50.0524L217.204 45.321L218.231 47.5251L225.797 62.0223C228.772 67.6996 230.519 74.7315 225.184 79.2484C225.03 79.3784 224.87 79.5079 224.704 79.6312L224.461 79.3107L224.47 79.3085Z" />
          </mask>
          <path d="M149.333 114.838L148.976 115.028L131.202 81.6792C129.982 79.3903 128.576 77.3316 126.981 75.4371C125.687 73.8994 124.266 72.4682 122.72 71.121C113.572 63.142 101.954 64.5193 91.288 70.7182L91.0842 70.3695L91.1222 69.9697C94.0353 70.2342 96.6794 70.2731 99.4681 71.0102C103.408 72.0554 106.757 74.2229 109.289 77.2306C110.301 78.4331 111.184 79.7706 111.922 81.2245C115.107 87.4396 115.607 93.2665 111.563 99.2351L111.228 99.0127L111.566 99.2325C109.641 102.209 107.016 104.055 104.212 106.69L103.937 106.395L103.84 106.004C107.374 105.126 110.584 103.9 114.281 103.736C120.717 103.447 125.703 106.212 129.438 110.662C130.773 112.249 131.956 114.048 132.999 116.008C134.631 119.069 136.009 122.066 136.874 125.431C139.896 137.149 134.731 147.15 125.917 154.559C125.352 155.035 124.77 155.503 124.175 155.957C114.762 163.155 101.553 169.761 89.5379 170.127C81.3678 170.373 73.7234 167.434 67.7089 161.924C66.1584 160.502 64.7171 159.01 63.3813 157.423C61.5743 155.276 59.9675 152.966 58.5566 150.444C55.0278 144.14 51.7366 137.899 48.574 131.397C45.8304 125.756 44.168 119.883 43.5628 113.724C42.8847 106.833 44.218 100.383 47.3463 94.0345L47.7054 94.2104L47.8824 94.5711C44.4021 96.2711 41.205 98.2951 38.4354 100.626C31.2495 106.686 26.9341 114.764 27.869 124.686C28.3438 129.693 29.6933 134.442 31.9076 139.078C34.8109 145.147 37.8551 150.913 41.1731 156.785C43.8578 161.535 47.1091 165.986 50.661 170.206C53.7701 173.899 57.1042 177.409 60.4843 180.785C62.6163 182.911 64.7952 184.697 67.3134 186.592L67.8201 186.974L56.6374 192.804C47.0488 197.77 34.1541 192.955 27.2326 184.914C27.0385 184.684 26.8412 184.456 26.6471 184.225C22.6007 179.418 19.2099 174.375 16.1422 168.875C13.0055 163.25 10.1184 157.746 7.27943 151.954C1.38343 139.924 -2.01645 126.071 1.30366 112.824C3.90152 102.493 10.2363 94.1127 18.1992 87.4097C20.4933 85.4786 22.924 83.6847 25.4433 82.0212C31.2193 78.2101 37.1784 75.0803 43.5713 72.4471C50.1718 69.7284 56.872 68.2186 64.1037 67.948L64.1168 68.3521L63.7818 68.1297C66.398 64.2249 69.4619 60.7892 72.9849 57.8237C74.9023 56.2097 76.9532 54.7355 79.1433 53.4016C91.0029 46.1825 105.553 40.624 119.214 45.3032C125.09 47.3197 129.453 50.9985 133.811 55.7372L133.512 56.0094L133.119 56.0936C131.616 49.0193 131.758 42.5574 134.302 36.1656C136.338 31.0461 139.329 26.6525 143.245 22.731C144.493 21.5181 145.766 20.3617 147.075 19.2597C149.718 17.0349 152.509 15.0226 155.532 13.187C166.55 6.49746 178.543 1.01586 191.503 0.111347C205.735 -0.886481 218.2 4.87279 227.63 15.342C228.506 16.3129 229.366 17.2912 230.202 18.2845C232.91 21.5015 235.381 24.8813 237.381 28.7048L249.677 52.1991C252.321 57.2513 253.499 62.7179 253.866 68.2678C254.552 78.572 250.115 87.1943 242.403 93.681C241.973 94.0423 241.533 94.397 241.083 94.745C235.164 99.333 228.562 102.689 221.419 104.876C211.184 108.016 200.576 106.762 192.436 99.5999C190.939 98.2853 189.558 96.8889 188.292 95.385C187.026 93.8811 185.805 92.1666 184.754 90.355C181.856 85.3644 179.221 80.3472 176.779 75.109C174.872 71.0189 173.709 66.8427 173.241 62.4447C172.383 54.4127 175.401 46.8488 181.455 41.7578C182.267 41.0742 183.129 40.4377 184.047 39.8488C187.423 37.6798 190.971 36.1169 194.624 34.477L205.325 29.6673L205.49 30.0328L205.245 30.3551C197.956 24.7988 188.81 24.3056 180.406 26.9816C174.273 28.9392 168.659 31.9464 163.524 35.8542C163.036 36.2277 162.56 36.6079 162.097 36.9977C155.825 42.2821 151.831 49.2696 152.636 57.5829C153.029 61.6345 154.075 65.5094 156.029 69.2404L185.272 125.125L184.94 125.32C175.812 130.677 165.481 131.859 157.043 124.643C155.373 123.216 153.793 121.703 152.367 120.009C151.104 118.508 149.959 116.865 148.974 115.019L149.331 114.829L149.688 114.639C150.643 116.431 151.755 118.028 152.987 119.492C154.377 121.143 155.92 122.625 157.569 124.032C165.7 130.965 175.549 129.868 184.535 124.626L184.739 124.975L184.38 125.162L155.312 69.6175C153.307 65.7879 152.234 61.805 151.831 57.6669C150.992 49.0305 155.169 41.7726 161.576 36.3852C162.051 35.985 162.537 35.597 163.034 35.2157C168.237 31.2565 173.935 28.1991 180.162 26.2151C188.746 23.4771 198.192 23.9697 205.735 29.7161L206.274 30.1243L194.951 35.2104C191.295 36.853 187.788 38.4022 184.48 40.5253C183.592 41.0939 182.757 41.7127 181.973 42.3728C176.125 47.2954 173.215 54.574 174.043 62.3577C174.502 66.6692 175.638 70.7517 177.51 74.7673C179.942 79.9818 182.563 84.9749 185.451 89.9475C186.482 91.7175 187.631 93.346 188.91 94.8652C190.189 96.3845 191.499 97.7035 192.97 98.9931C200.873 105.944 211.144 107.172 221.184 104.102C228.239 101.941 234.751 98.6295 240.59 94.1034C241.032 93.7632 241.463 93.4106 241.883 93.0572C249.445 86.6864 253.723 78.3509 253.061 68.3146C252.696 62.842 251.539 57.4887 248.961 52.565L236.665 29.0706C234.702 25.316 232.267 21.9848 229.583 18.7956C228.754 17.8115 227.899 16.8393 227.026 15.8715C217.726 5.55607 205.529 -0.0720335 191.553 0.904442C178.789 1.79678 166.911 7.20796 155.947 13.8677C152.959 15.6835 150.2 17.6699 147.588 19.8687C146.294 20.9577 145.033 22.1037 143.798 23.3005L143.518 23.0112L143.804 23.2953C139.955 27.1452 137.033 31.4388 135.04 36.4534C132.569 42.674 132.424 48.9441 133.898 55.916L134.203 57.3564L133.206 56.2724C128.882 51.5736 124.637 48.0106 118.939 46.0547C105.665 41.4909 91.3285 46.9015 79.5499 54.0788C77.3958 55.3929 75.3757 56.8411 73.4923 58.4265C70.028 61.3426 67.015 64.7196 64.4383 68.5649L64.3233 68.7353L64.1169 68.7408C56.9801 69.0051 50.3846 70.4951 43.8645 73.1777C37.5159 75.7946 31.6077 78.8972 25.8745 82.6776C23.3825 84.3234 20.9734 86.0991 18.7071 88.0068C10.8307 94.637 4.6198 102.876 2.08371 112.993C-1.17581 125.973 2.15437 139.643 8.00209 151.572C10.8338 157.349 13.7137 162.838 16.8457 168.451C19.8911 173.912 23.2513 178.912 27.2614 183.676C27.453 183.904 27.6471 184.134 27.8418 184.359C34.5505 192.185 47.1862 196.824 56.2652 192.061L66.8814 186.53L67.0672 186.888L66.8246 187.208C64.293 185.304 62.0763 183.491 59.9133 181.329C56.5223 177.946 53.1727 174.418 50.0428 170.7C46.4677 166.453 43.1827 161.961 40.4685 157.157C37.1432 151.271 34.0861 145.489 31.176 139.4C28.9227 134.686 27.5446 129.841 27.0638 124.738C26.0909 114.533 30.5757 106.155 37.9139 99.9882C40.7422 97.6075 43.9939 95.5481 47.5278 93.8239L48.5823 93.3093L48.0639 94.3605C44.9966 100.6 43.7015 106.876 44.3616 113.614C44.9577 119.681 46.5915 125.457 49.2967 131.014C52.452 137.501 55.7359 143.728 59.26 150.02C60.6465 152.494 62.2253 154.765 63.9987 156.871C65.3112 158.431 66.7287 159.901 68.2585 161.299C74.1303 166.676 81.5592 169.529 89.5199 169.291C101.258 168.947 114.384 162.418 123.691 155.287C124.276 154.842 124.849 154.381 125.404 153.913C134.07 146.603 139.016 136.975 136.098 125.606C135.257 122.331 133.913 119.4 132.29 116.363C131.267 114.445 130.114 112.693 128.82 111.156C125.186 106.852 120.492 104.252 114.31 104.516C110.777 104.668 107.624 105.867 104.028 106.76L102.532 107.132L103.657 106.074C106.517 103.399 109.072 101.584 110.886 98.7696L110.889 98.767C114.742 93.0281 114.289 87.6767 111.197 81.5723C110.482 80.1718 109.632 78.8858 108.661 77.7325C106.23 74.8446 103.03 72.7725 99.247 71.7691C96.5786 71.0621 93.9835 71.0187 91.0363 70.7514L89.7797 70.6373L90.8705 70.0029C101.67 63.6923 113.762 62.2204 123.236 70.4926C124.81 71.868 126.258 73.3242 127.583 74.8989C129.212 76.8333 130.65 78.9433 131.894 81.28L149.669 114.629L149.312 114.819L149.333 114.838ZM99.6386 122.189L99.7239 122.585C98.4148 122.872 97.2595 123.298 96.0019 123.879C92.8217 125.352 88.8674 124.898 86.596 122.212C86.3009 121.861 86.0402 121.476 85.8114 121.054L81.8327 113.689C80.1248 110.545 80.9518 107.121 83.4791 105.01C83.8897 104.664 84.3402 104.353 84.8331 104.08C85.3348 103.805 85.8099 103.473 86.2515 103.102C87.4772 102.07 88.426 100.709 88.8534 99.2614C89.4836 97.1335 88.7325 95.0754 87.7121 93.0548C87.1988 92.0314 86.6136 91.142 85.9716 90.3792C82.7925 86.6026 78.0994 85.7715 72.6186 86.6806L72.5534 86.2835L72.9084 86.4734L70.2843 91.3779C69.4568 92.9204 68.6936 94.3826 68.1666 96.019L67.7829 95.8954L68.1799 95.9658C66.735 103.882 69.1375 113.078 72.872 120.197L80.5433 134.831C81.4716 136.598 82.5413 138.22 83.7814 139.693C84.6176 140.687 85.5309 141.615 86.5308 142.471C89.58 145.09 93.4099 146.049 97.3459 145.085C100.686 144.265 103.796 142.676 106.424 140.465C106.665 140.262 106.9 140.053 107.13 139.844C109.706 137.476 110.65 134.123 109.632 130.796C108.99 128.704 108.025 126.7 106.746 125.186C104.971 123.096 102.689 121.933 99.7187 122.578L99.6334 122.183L99.5481 121.787C102.829 121.053 105.486 122.411 107.364 124.661C108.736 126.291 109.739 128.384 110.403 130.552C111.515 134.161 110.474 137.875 107.673 140.432C107.431 140.652 107.189 140.866 106.939 141.077C104.216 143.369 100.992 145.011 97.5319 145.863C93.3557 146.893 89.2268 145.855 85.9997 143.081C84.9683 142.194 84.0259 141.237 83.1613 140.21C81.8798 138.688 80.7774 137.015 79.8273 135.203L72.156 120.568C68.3613 113.322 65.9042 103.998 67.3865 95.8192L67.3916 95.7939L67.3997 95.766C67.9569 94.0464 68.7468 92.5407 69.5748 90.9925L72.2912 85.9157L72.4856 85.8834C78.0927 84.9363 83.1724 85.7942 86.5865 89.8564C87.2726 90.6714 87.8904 91.6121 88.4307 92.6864C89.4651 94.7425 90.348 97.026 89.6259 99.4834C89.1458 101.107 88.1067 102.586 86.7697 103.711C86.2881 104.116 85.7676 104.476 85.2206 104.779C84.773 105.024 84.3622 105.307 83.9947 105.616C81.7393 107.53 81.0186 110.46 82.5393 113.294L86.5181 120.659C86.7225 121.033 86.9525 121.376 87.2114 121.683C89.1831 124.038 92.7577 124.487 95.6638 123.138C96.9544 122.541 98.1778 122.089 99.5512 121.784L99.6365 122.18L99.6386 122.189ZM224.47 79.3085L224.226 78.988C224.382 78.8725 224.53 78.7534 224.672 78.6338C229.548 74.5557 228.02 68.028 225.09 62.3973L217.514 47.8822L216.845 46.4484L209.207 50.7492L206.181 52.4931C205.59 52.8323 205.045 53.2124 204.551 53.6282C201.596 56.1212 200.392 59.8616 201.5 63.7845C202.214 66.2939 203.39 68.6305 204.671 71.036C205.971 73.4831 207.134 75.8616 208.83 77.9131C208.861 77.95 208.892 77.9869 208.923 78.0238C213.151 83.0032 218.789 83.0447 224.223 78.9906L224.466 79.3111L224.71 79.6316C219.105 83.903 212.766 83.8741 208.309 78.541C208.277 78.5041 208.244 78.4642 208.21 78.4242C206.438 76.2747 205.256 73.8433 203.96 71.4137C202.677 68.9994 201.469 66.6115 200.726 64.0053C199.525 59.8031 200.842 55.6892 204.031 53.0101C204.562 52.563 205.147 52.1548 205.776 51.7932L208.805 50.0524L217.204 45.321L218.231 47.5251L225.797 62.0223C228.772 67.6996 230.519 74.7315 225.184 79.2484C225.03 79.3784 224.87 79.5079 224.704 79.6312L224.461 79.3107L224.47 79.3085Z" stroke="url(#paint0_linear_255_3470)" strokeWidth="30.0422" mask="url(#path-1-inside-1_255_3470)" />
          <defs>
            <linearGradient id="paint0_linear_255_3470" x1="38.2887" y1="198.055" x2="209.289" y2="-6.46257" gradientUnits="userSpaceOnUse">
              <stop stopColor="#29ABE2" />
              <stop offset="0.524038" stopColor="#22B573" />
              <stop offset="1" stopColor="#D9E021" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        {/* Main Section Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-dark-text tracking-tight leading-[1.12] max-w-2xl text-left mb-8 sm:mb-14">
          {title}
        </h2>

        {/* ── Features Comparison Table Container ────────────────── */}
        <div className="w-full mx-auto bg-white border border-gray-200/90 rounded-[20px] sm:rounded-[28px] overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 items-center px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-gray-200/80">
              <div className="col-span-5">
                <h3 className="text-base sm:text-2xl font-semibold text-dark-bg tracking-tight">
                  Features
                </h3>
              </div>
              <div className="col-span-2 text-center">
                <span className="block text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-normal sm:tracking-wider mb-0.5 sm:mb-1 leading-tight">
                  Reader Member
                </span>
                <div className="text-xs sm:text-base font-semibold text-dark-bg">
                  Free <span className="block sm:inline text-[9px] sm:text-xs text-gray-400 font-normal">/ forever</span>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span className="block text-[10px] sm:text-xs font-bold text-[#0FA975] uppercase tracking-normal sm:tracking-wider mb-0.5 sm:mb-1 leading-tight">
                  Student Pass
                </span>
                <div className="text-xs sm:text-base font-semibold text-emerald-800">
                  ₹0 <span className="block sm:inline text-[9px] sm:text-xs text-emerald-600 font-normal">/ verified ID</span>
                </div>
              </div>
              <div className="col-span-3 text-center">
                <span className="block text-[10px] sm:text-xs font-bold text-[#22B573] uppercase tracking-normal sm:tracking-wider mb-0.5 sm:mb-1 leading-tight">
                  Masika Pass
                </span>
                <div className="text-xs sm:text-base font-semibold text-dark-bg">
                  ₹149 <span className="block sm:inline text-[9px] sm:text-xs text-gray-400 font-normal">/ month</span>
                </div>
              </div>
            </div>

            {/* Categories Rows */}
            {categories.map((category, catIdx) => (
              <div key={catIdx} className="w-full">
                {/* Category Subheader */}
                <div className="bg-gray-50/80 border-y border-gray-200/70 px-4 sm:px-8 py-2.5 sm:py-3 text-[11px] sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {category.title}
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-gray-100">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="grid grid-cols-12 items-center px-4 sm:px-8 py-3 sm:py-3.5 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="col-span-5 text-xs sm:text-sm text-gray-700 font-medium pr-2 sm:pr-0 leading-snug">
                        {item.name}
                      </div>

                      <div className="col-span-2 flex justify-center items-center">
                        {item.readerMember ? (
                          <Check className="w-4 h-4 text-gray-800 stroke-[2.5]" />
                        ) : (
                          <span className="text-gray-300 font-light text-base select-none">—</span>
                        )}
                      </div>

                      <div className="col-span-2 flex justify-center items-center">
                        {item.masikaPass ? (
                          <Check
                            className={`w-4 h-4 stroke-[2.5] ${
                              !item.readerMember ? "text-[#0FA975]" : "text-gray-800"
                            }`}
                          />
                        ) : (
                          <span className="text-gray-300 font-light text-base select-none">—</span>
                        )}
                      </div>

                      <div className="col-span-3 flex justify-center items-center">
                        {item.masikaPass ? (
                          <Check
                            className={`w-4 h-4 stroke-[2.5] ${
                              !item.readerMember ? "text-[#0FA975]" : "text-gray-800"
                            }`}
                          />
                        ) : (
                          <span className="text-gray-300 font-light text-base select-none">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Call To Action Area ────────────────── */}
        <div className="mt-16 sm:mt-24 lg:mt-32 text-center max-w-2xl mx-auto relative z-30">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight leading-tight sm:leading-tight mb-8">
            {ctaHeadline}
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleSubscribeClick}
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="w-full sm:w-auto group px-7 py-3 text-sm font-medium shadow-xs cursor-pointer"
            >
              Subscribe to Masika Pass
            </Button>

            {onStudentApply && (
              <button
                type="button"
                onClick={onStudentApply}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Apply for Free Student Pass</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Left Interactive Draggable Jelly Bubble Blob ────────────────── */}
      <JellyBubbleBlob />

      {/* ── Bottom Right Dummy SVG Motif (Replaceable Circular Outline) ────────────────── */}
      <div className="hidden sm:block absolute bottom-4 right-0 z-0 pointer-events-none">
        <svg className="w-10 md:w-32" viewBox="0 0 152 173" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M168.177 64.1324L167.618 64.2232C167.741 65.0357 167.858 65.8516 167.97 66.6784C167.992 66.8423 168.019 67.008 168.036 67.1701C168.577 71.2119 168.981 75.3029 169.283 79.4795C169.298 79.6829 169.307 79.8845 169.323 80.1005C169.337 80.304 169.355 80.4966 169.367 80.6874C170.22 92.049 170.413 102.914 168.151 114.007C168.032 114.598 167.883 115.173 167.748 115.776C167.713 115.932 167.694 116.058 167.673 116.153C167.648 116.277 167.604 116.424 167.561 116.602C167.385 117.342 167.201 118.073 167.005 118.8C166.853 119.367 166.704 119.924 166.544 120.477C166.331 121.203 166.103 121.919 165.87 122.634C165.752 122.978 165.654 123.317 165.541 123.646L165.526 123.689L165.482 123.818C156.395 150.269 134.839 163.286 107.982 168.371C107.492 168.468 106.99 168.549 106.485 168.64C105.576 168.803 104.66 168.952 103.741 169.094C103.075 169.197 102.42 169.303 101.764 169.396C100.508 169.573 99.247 169.73 97.9772 169.878C97.3532 169.947 96.7237 170.014 96.0908 170.073L96.0747 170.068L96.0854 170.071C95.0029 170.181 93.9114 170.282 92.8182 170.37C92.5395 170.395 92.2823 170.427 92.036 170.445C91.9192 170.453 91.7844 170.461 91.6496 170.469C91.5129 170.482 91.3834 170.492 91.2612 170.498C91.0149 170.516 90.7544 170.522 90.4722 170.54C89.3773 170.616 88.2827 170.673 87.1971 170.722C86.5627 170.751 85.9282 170.78 85.3009 170.805C84.0249 170.849 82.7473 170.88 81.4843 170.886C80.8213 170.893 80.1512 170.885 79.4812 170.878C78.5524 170.872 77.6273 170.856 76.7041 170.834C76.1922 170.821 75.6856 170.809 75.1881 170.789C65.4218 170.41 56.1762 168.917 47.7412 166.023C32.5635 160.816 20.0346 151.091 11.7987 135.067C11.6363 134.753 11.4795 134.422 11.3084 134.081C10.9751 133.407 10.6417 132.733 10.3266 132.041C10.0906 131.521 9.85846 130.99 9.63161 130.461C9.33441 129.77 9.04626 129.069 8.75997 128.364C8.69146 128.196 8.62445 128.058 8.58062 127.941C8.54553 127.851 8.50897 127.73 8.45641 127.586C8.23359 127.01 8.00688 126.463 7.8037 125.9C3.96079 115.257 2.57866 104.478 1.78043 93.1164C1.76783 92.9256 1.75522 92.7347 1.74446 92.5385C1.7285 92.3225 1.71073 92.1119 1.69645 91.9084C1.39386 87.7319 1.19489 83.6209 1.15371 79.5401C1.14985 79.3763 1.15133 79.2144 1.14561 79.056C1.13717 78.2229 1.13408 77.3917 1.14176 76.5641L1.1473 76.5479L1.14361 76.5587C1.19365 66.9083 2.2373 57.6349 5.36903 48.5064C6.30707 45.7721 7.43366 43.0484 8.78119 40.3283L8.27332 40.0758L8.09942 40.6177L8.16389 40.6399L8.18002 40.6454L8.64574 40.7932L8.8618 40.3559C15.2909 27.4797 25.7603 17.3371 39.4153 11.0367C39.722 10.8952 40.061 10.7649 40.4218 10.6059L40.4236 10.6005C49.3247 6.44718 58.9243 4.07349 68.8721 2.69764C69.3776 2.62441 69.8866 2.55842 70.3903 2.49058C71.4893 2.35025 72.5973 2.21897 73.7015 2.09847C74.392 2.02856 75.079 1.95144 75.7658 1.89229C76.6973 1.80277 77.6269 1.71862 78.56 1.6417C78.8189 1.62223 79.0868 1.61185 79.3762 1.59083C79.6638 1.5752 79.9336 1.5414 80.1906 1.52733C81.1254 1.463 82.0566 1.40947 82.9912 1.36316C83.6833 1.32385 84.3717 1.29528 85.06 1.26675C86.1743 1.22189 87.2849 1.1878 88.3918 1.16448C88.9057 1.1543 89.4124 1.14765 89.9244 1.14284C99.9647 1.03796 109.805 1.97134 119.215 4.77235C119.593 4.87801 119.946 4.9511 120.272 5.05093C121.293 5.34716 122.3 5.66845 123.294 6.00944C136.344 10.4865 147.097 18.5972 154.742 29.552L155.015 29.9464L155.446 29.7395L155.513 29.7022L155.27 29.1857L154.803 29.5129C162.272 40.299 165.715 51.8275 167.598 64.2285L168.156 64.1431L168.719 64.0595C166.821 51.5631 163.331 39.838 155.733 28.8692L155.46 28.4747L155.023 28.6799L154.956 28.7171L155.199 29.2336L155.666 28.9064C147.89 17.7562 136.926 9.48916 123.661 4.93835C122.651 4.59183 121.628 4.26502 120.591 3.96325C120.209 3.85038 119.851 3.77543 119.523 3.68099L119.37 4.2303L119.534 3.68468C109.988 0.84297 100.029 -0.0949758 89.9117 0.00747674C89.3996 0.0122705 88.8803 0.020591 88.3664 0.0307827C87.2469 0.0558011 86.1309 0.0880425 85.0094 0.136439C84.3156 0.163134 83.6201 0.195227 82.9227 0.23269C81.9827 0.277177 81.0443 0.334244 80.1095 0.398555C79.82 0.419581 79.5521 0.447991 79.2932 0.467452C79.0343 0.486928 78.7647 0.50271 78.4752 0.523736C77.5367 0.598815 76.6017 0.681082 75.6631 0.774153C74.969 0.836837 74.2766 0.91215 73.5861 0.982059C72.4693 1.10424 71.3578 1.22826 70.2516 1.37214C69.7425 1.43813 69.2263 1.50769 68.7208 1.58092C58.6974 2.96696 48.9807 5.36662 39.9497 9.58369L40.1875 10.0984L39.9569 9.58014C39.6448 9.71972 39.3005 9.84828 38.9379 10.0126C25.0628 16.412 14.3886 26.749 7.84419 39.8564L8.35207 40.1088L8.52597 39.5669L8.4615 39.5448L8.44536 39.5393L7.97963 39.3915L7.76359 39.8287C6.39591 42.5901 5.24731 45.3604 4.2945 48.1377C1.11292 57.4116 0.0572413 66.8253 0.00652684 76.5476C-0.00300179 77.3806 0.00356018 78.219 0.0101517 79.0575C0.0140214 79.2213 0.0125391 79.3832 0.0164083 79.5469C0.0609412 83.653 0.257927 87.7874 0.565717 91.9838C0.581677 92.1998 0.601304 92.405 0.615585 92.6085C0.630033 92.7939 0.642637 92.9847 0.653393 93.1809C1.46019 104.587 2.84487 115.482 6.74386 126.276C6.9593 126.874 7.18948 127.428 7.40525 127.989C7.44034 128.079 7.47697 128.2 7.53306 128.352C7.59972 128.525 7.66667 128.662 7.71402 128.787C8.00015 129.511 8.29722 130.22 8.59795 130.919C8.82833 131.455 9.05868 131.991 9.30164 132.526C9.62386 133.232 9.9642 133.92 10.2956 134.6C10.4543 134.925 10.6147 135.263 10.793 135.6C19.1486 151.888 31.9684 161.833 47.3789 167.114C55.9429 170.052 65.298 171.559 75.1488 171.937C75.6642 171.957 76.1761 171.97 76.6772 171.98C77.6058 172.003 78.5416 172.024 79.4776 172.026C80.1423 172.031 80.8178 172.041 81.4987 172.034C82.7744 172.026 84.0574 171.997 85.3406 171.95C85.9786 171.928 86.6131 171.899 87.2494 171.865C88.3422 171.813 89.4441 171.751 90.5496 171.679C90.7959 171.662 91.0618 171.657 91.3405 171.632C91.4772 171.619 91.6066 171.609 91.7289 171.603C91.8457 171.595 91.9805 171.587 92.1153 171.579C92.3994 171.556 92.662 171.526 92.9083 171.508C94.014 171.418 95.1108 171.319 96.2006 171.206C96.8354 171.141 97.4684 171.081 98.0997 171.009C99.3802 170.865 100.655 170.701 101.916 170.526C102.591 170.432 103.253 170.323 103.912 170.224C104.838 170.078 105.761 169.926 106.675 169.764C107.174 169.676 107.678 169.591 108.185 169.494C135.257 164.397 157.325 151.111 166.549 124.19L166.592 124.066L166.606 124.023C166.726 123.673 166.832 123.331 166.941 122.995C167.176 122.275 167.407 121.549 167.626 120.806C167.791 120.237 167.944 119.669 168.095 119.107C168.292 118.375 168.48 117.633 168.656 116.876C168.688 116.748 168.734 116.596 168.772 116.416C168.807 116.26 168.826 116.134 168.847 116.039L168.853 116.023L168.845 116.044C168.98 115.459 169.126 114.877 169.25 114.252C171.543 103.001 171.341 92.0186 170.486 80.6138C170.471 80.4104 170.452 80.2231 170.439 80.0323C170.423 79.8343 170.416 79.6273 170.4 79.4112C170.097 75.2167 169.69 71.1005 169.146 67.0335C169.126 66.8642 169.098 66.6984 169.077 66.5345C168.964 65.7078 168.851 64.881 168.719 64.0595L168.154 64.1485L168.177 64.1324ZM90.0822 49.7633L90.1324 49.197C87.6535 48.9662 85.2157 48.948 82.8445 49.1031C80.4731 49.2942 78.0657 49.6775 75.6474 50.2676L75.6421 50.2658L75.6402 50.2712C71.4977 51.3887 67.7686 53.2617 64.7396 55.9644L64.7359 55.9752C61.8528 58.6378 59.6961 62.0187 58.3574 65.921C58.0897 66.7014 57.854 67.5109 57.6505 68.3315L57.6468 68.3423C57.4613 69.163 57.2918 70.0072 57.1703 70.904C56.8145 73.6214 56.5986 76.3688 56.5119 79.1244L56.5082 79.1352L56.5118 79.1424C56.5265 82.1975 56.7352 85.2651 56.9684 88.4011C57.1858 91.3032 57.4127 94.1423 57.7999 96.9522L57.7962 96.963L57.8032 96.9775C58.2916 99.7198 58.9023 102.438 59.6519 105.101C59.8936 105.972 60.1952 106.774 60.4934 107.55L60.4897 107.561C61.941 111.085 64.0018 114.162 66.6128 116.616L66.6182 116.618C66.816 116.794 67.0207 117.002 67.2685 117.208L67.6337 116.773L67.2578 117.204C67.4378 117.362 67.6179 117.502 67.7855 117.644L67.7909 117.645C69.9436 119.335 72.3678 120.617 74.9682 121.509C75.7096 121.764 76.4675 121.988 77.2365 122.179L77.2472 122.183L77.258 122.187C77.5036 122.241 77.7688 122.308 78.0558 122.364C81.094 122.925 84.1568 123.152 87.142 123.045L87.1473 123.047C87.5033 123.025 87.8538 123 88.2062 122.971L88.1612 122.402L88.1955 122.967C88.5514 122.945 88.9038 122.915 89.2562 122.886L89.2616 122.888C92.2344 122.554 95.2302 121.873 98.15 120.872C98.4293 120.775 98.6819 120.669 98.9163 120.581L98.9254 120.572C102.229 119.203 105.199 117.25 107.618 114.699L107.621 114.688C107.769 114.522 107.926 114.36 108.079 114.177L107.648 113.807L108.07 114.186C108.284 113.947 108.455 113.711 108.622 113.504L108.626 113.493C110.371 111.294 111.726 108.763 112.677 105.991C112.941 105.221 113.175 104.435 113.373 103.631L113.376 103.62C113.56 102.805 113.738 101.97 113.854 101.071C114.209 98.3228 114.423 95.5448 114.508 92.7586L114.512 92.7479L114.51 92.7352C114.486 89.8995 114.303 87.0571 114.096 84.1587C113.873 81.0264 113.636 77.955 113.208 74.9325L113.211 74.9217L113.204 74.9073C112.719 72.1901 112.108 69.508 111.362 66.8696C111.113 66.0022 110.821 65.192 110.521 64.4033L110.523 64.3979C108.615 59.7008 105.611 55.8727 101.73 53.2178C100.039 52.1082 98.2089 51.2278 96.2641 50.5606C94.3138 49.8915 92.2537 49.4375 90.1217 49.1933L90.1163 49.1915L90.1109 49.1896L90.0607 49.7559L89.9926 50.3221C92.0547 50.5603 94.0358 50.9993 95.9001 51.6389C97.759 52.2767 99.5065 53.1168 101.108 54.1716L101.422 53.6956L101.099 54.1626C104.786 56.6846 107.652 60.3208 109.484 64.8356L110.009 64.6186L109.477 64.8212C109.771 65.59 110.052 66.3659 110.287 67.1865C111.024 69.7798 111.621 72.4331 112.101 75.1124L112.659 75.009L112.096 75.0925C112.518 78.0646 112.753 81.1053 112.976 84.2377C113.184 87.1307 113.368 89.9551 113.391 92.7423L113.957 92.7379L113.386 92.7224C113.301 95.4727 113.092 98.2165 112.74 100.923C112.634 101.759 112.461 102.56 112.279 103.37L112.831 103.493L112.277 103.357C112.083 104.133 111.861 104.887 111.608 105.624C110.696 108.283 109.399 110.696 107.74 112.786L108.184 113.136L107.743 112.775C107.549 113.009 107.382 113.234 107.216 113.418L107.213 113.429C107.075 113.586 106.93 113.747 106.775 113.917L107.196 114.301L106.784 113.908C104.487 116.332 101.662 118.196 98.4842 119.512L98.7003 120.038L98.4986 119.505C98.2354 119.608 97.9974 119.706 97.7667 119.784C94.9208 120.763 92.0061 121.417 89.1195 121.744L89.1843 122.308L89.1321 121.742C88.7905 121.776 88.4452 121.802 88.1019 121.822L88.0965 121.82C87.7495 121.852 87.4062 121.872 87.0629 121.893L87.0952 122.463L87.0736 121.896C84.1675 122 81.1926 121.78 78.2334 121.234C77.9913 121.187 77.7421 121.126 77.4678 121.068L77.3441 121.621L77.4858 121.068C76.7455 120.88 76.0199 120.667 75.3107 120.424C72.8178 119.569 70.5043 118.348 68.4657 116.746L68.1148 117.191L68.4765 116.75C68.2982 116.604 68.1287 116.468 67.9754 116.337L67.97 116.335C67.7793 116.174 67.5817 115.979 67.3537 115.769L66.9743 116.192L67.3626 115.778C64.8834 113.448 62.911 110.515 61.5106 107.123L60.9858 107.34L61.5177 107.137C61.2195 106.361 60.9356 105.596 60.7077 104.79C59.9703 102.161 59.3646 99.4803 58.8813 96.7758L58.3234 96.8792L58.8846 96.801C58.5042 94.0416 58.2771 91.2204 58.0632 88.3255C57.8281 85.1948 57.6228 82.1526 57.6094 79.146L57.0435 79.1504L57.6128 79.1712C57.6991 76.4516 57.9094 73.7383 58.263 71.0623C58.3733 70.2158 58.5371 69.4057 58.717 68.6011L58.1648 68.4778L58.7187 68.6137C58.9129 67.8201 59.141 67.0501 59.3977 66.3019C60.6792 62.5665 62.7374 59.3503 65.4719 56.8233L65.0859 56.4081L65.4628 56.8321C68.3378 54.2631 71.9027 52.4661 75.9011 51.3834L75.7536 50.8334L75.8886 51.3851C78.2475 50.8107 80.5972 50.4377 82.9129 50.2516L82.8679 49.6826L82.9075 50.2497C85.2194 50.0923 87.6015 50.1154 90.0176 50.3367L90.0678 49.7704L90.0822 49.7633Z" fill="url(#paint0_linear_255_3472)" />
          <defs>
            <linearGradient id="paint0_linear_255_3472" x1="0.390174" y1="92.6404" x2="170.81" y2="80.2471" gradientUnits="userSpaceOnUse">
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

export default ReadingPlansSection;
