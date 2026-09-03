"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Loader2,
  BookOpen,
  X,
} from "lucide-react";

export interface Pdf3DFlipbookProps {
  pdfUrl: string;
  title?: string;
  onClose?: () => void;
}

export const Pdf3DFlipbook: React.FC<Pdf3DFlipbookProps> = ({
  pdfUrl,
  title = "Digital Edition",
  onClose,
}) => {
  // ── Loading & Rendering state ─────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<number>(1.414);
  const [error, setError] = useState<string | null>(null);

  // ── Flipbook & Viewport state ─────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Pan state when zoomed in ───────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // ── Refs ──────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<any>(null);

  // ── Calculate Target Single Page Dimensions ───────────────────────────────
  const getSinglePageDimensions = useCallback(
    (aspect: number) => {
      const containerW = viewportRef.current?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1000);
      const containerH = viewportRef.current?.clientHeight || (typeof window !== "undefined" ? window.innerHeight - 80 : 700);

      const mobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsMobile(mobile);

      const maxW = Math.max(300, containerW - 40);
      const maxH = Math.max(300, containerH - 40);

      let singleW = mobile ? maxW : maxW / 2;
      let singleH = singleW * aspect;

      if (singleH > maxH) {
        singleH = maxH;
        singleW = singleH / aspect;
      }

      return {
        width: Math.max(260, Math.round(singleW)),
        height: Math.max(360, Math.round(singleH)),
        mobile,
      };
    },
    []
  );

  // Auto update PageFlip on window resize
  useEffect(() => {
    const handleResize = () => {
      if (pageFlipRef.current) {
        try {
          pageFlipRef.current.update();
        } catch (_) {}
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── STEP 1: Load PDF.js & render pages to data URLs ───────────────────────
  useEffect(() => {
    let active = true;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setProgress(5);

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        if (!active) return;

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (!active) return;

        const numPages = pdf.numPages;
        if (numPages === 0) throw new Error("PDF file has no pages.");

        // Get initial page aspect ratio
        const page1 = await pdf.getPage(1);
        const unscaledViewport = page1.getViewport({ scale: 1 });
        const ratio = unscaledViewport.height / unscaledViewport.width;
        setAspectRatio(ratio);

        const rendered: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          if (!active) return;
          const page = await pdf.getPage(i);
          // 2.5x high DPI scale for crisp text rendering
          const viewport = page.getViewport({ scale: 2.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          rendered.push(canvas.toDataURL("image/jpeg", 0.92));
          setProgress(Math.round((i / numPages) * 95));
        }

        if (active) {
          setPages(rendered);
          setTotalPages(numPages);
          setProgress(100);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[Pdf3DFlipbook] PDF error:", err);
        if (active) {
          setError(err?.message || "Failed to load PDF file.");
          setLoading(false);
        }
      }
    };

    renderPdf();
    return () => {
      active = false;
    };
  }, [pdfUrl]);

  // ── STEP 2: Initialize PageFlip once rendered pages are ready ─────────────
  useEffect(() => {
    if (loading || pages.length === 0 || !bookContainerRef.current) return;

    let flipInstance: any = null;

    const dims = getSinglePageDimensions(aspectRatio);

    import("page-flip").then(({ PageFlip }) => {
      const container = bookContainerRef.current;
      if (!container) return;
      container.innerHTML = "";

      // Build DOM elements for each page
      const pageElements: HTMLDivElement[] = [];

      pages.forEach((src, idx) => {
        const pageDiv = document.createElement("div");
        pageDiv.className = "page-item relative overflow-hidden bg-white select-none";

        // Cover & Back cover hard density physics
        const isCover = idx === 0 || idx === pages.length - 1;
        pageDiv.setAttribute("data-density", isCover ? "hard" : "soft");

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Page ${idx + 1}`;
        img.className = "w-full h-full object-cover pointer-events-none block";
        pageDiv.appendChild(img);

        // Inner page spine shadow gradient
        if (!isCover) {
          const spineShadow = document.createElement("div");
          spineShadow.className = "absolute inset-0 pointer-events-none z-10";
          const isEven = idx % 2 === 0;
          spineShadow.style.background = isEven
            ? "linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 5%, transparent 15%)"
            : "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 5%, transparent 15%)";
          pageDiv.appendChild(spineShadow);
        }

        container.appendChild(pageDiv);
        pageElements.push(pageDiv);
      });

      flipInstance = new PageFlip(container, {
        width: dims.width,
        height: dims.height,
        size: "fixed",
        minWidth: 200,
        minHeight: 300,
        maxWidth: 1600,
        maxHeight: 2000,
        drawShadow: true,
        maxShadowOpacity: 0.85,
        flippingTime: 700,
        usePortrait: dims.mobile,
        startZIndex: 10,
        autoSize: false,
        showCover: true,
        mobileScrollSupport: true,
        clickEventForward: true,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      flipInstance.loadFromHTML(pageElements);

      flipInstance.on("flip", (e: any) => {
        setCurrentPage(e.data);
        setIsFlipping(false);
      });

      flipInstance.on("changeState", (e: any) => {
        if (e.data === "flipping") setIsFlipping(true);
        if (e.data === "read") setIsFlipping(false);
      });

      pageFlipRef.current = flipInstance;
      setCurrentPage(flipInstance.getCurrentPageIndex());
    });

    return () => {
      if (pageFlipRef.current) {
        try {
          pageFlipRef.current.destroy();
        } catch (_) {}
        pageFlipRef.current = null;
      }
    };
  }, [loading, pages, aspectRatio, getSinglePageDimensions]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    pageFlipRef.current?.flipNext("top");
  }, []);

  const handlePrev = useCallback(() => {
    pageFlipRef.current?.flipPrev("top");
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, onClose]);

  // ── Fullscreen Toggle ─────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      setTimeout(() => {
        if (pageFlipRef.current) {
          try {
            pageFlipRef.current.update();
          } catch (_) {}
        }
      }, 150);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Zoom & Panning Mechanics ──────────────────────────────────────────────
  const handleZoomIn = () => {
    setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.75, parseFloat((z - 0.25).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Double click page zoom toggle
  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleResetZoom();
    } else {
      setZoom(1.75);
    }
  };

  // Page indicator string
  const pageLabel = isMobile
    ? `Page ${currentPage + 1} of ${totalPages}`
    : currentPage === 0
    ? `Cover (Page 1 of ${totalPages})`
    : `Pages ${currentPage + 1}–${Math.min(currentPage + 2, totalPages)} of ${totalPages}`;

  const isAtStart = currentPage === 0;
  const isAtEnd = currentPage >= totalPages - (isMobile ? 1 : 2);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col bg-stone-950 select-none font-sans overflow-hidden`}
    >
      {/* ── Top Header Control Bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-stone-900/95 backdrop-blur-md shrink-0 z-30">
        {/* Title & Page Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-200 truncate max-w-[150px] sm:max-w-md">
            {title}
          </span>
          {!loading && !error && (
            <span className="text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium hidden sm:inline-block">
              {pageLabel}
            </span>
          )}
        </div>

        {/* Center / Right Tools: Zoom, Fullscreen, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            title="Zoom Out (-)"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 transition-all disabled:opacity-30 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom % Indicator & Reset button */}
          <button
            onClick={handleResetZoom}
            title="Fit to Screen (100%)"
            className="px-2.5 py-1 rounded-xl bg-stone-800/80 border border-stone-700 text-stone-300 hover:text-amber-400 text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{Math.round(zoom * 100)}%</span>
            {zoom !== 1 && <RotateCcw className="w-3 h-3 text-amber-400" />}
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="Zoom In (+)"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 transition-all disabled:opacity-30 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-stone-800 mx-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              title="Close Flipbook"
              className="p-2 rounded-xl text-stone-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-800/40 transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Book Viewport ────────────────────────────────────────────── */}
      <div
        ref={viewportRef}
        className={`flex-1 relative flex items-center justify-center overflow-hidden bg-stone-950 p-4 ${
          zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-40 bg-stone-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <p className="font-semibold text-stone-200 text-base">Rendering High-Res Magazine…</p>
              <div className="w-56 h-1.5 bg-stone-800 rounded-full overflow-hidden mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 font-mono">{progress}% completed</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && !loading && (
          <div className="absolute inset-0 z-40 bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 font-bold text-xl">
              !
            </div>
            <p className="text-stone-300 font-medium text-sm max-w-md">{error}</p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        )}

        {/* Prev Page Button */}
        {!loading && !error && (
          <button
            onClick={handlePrev}
            disabled={isAtStart || isFlipping}
            title="Previous Page (Left Arrow)"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-white transition-all shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Zoom & Pan Container */}
        <div
          className="transition-transform duration-150 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <div
            ref={bookContainerRef}
            className="relative rounded-sm"
          />
        </div>

        {/* Next Page Button */}
        {!loading && !error && (
          <button
            onClick={handleNext}
            disabled={isAtEnd || isFlipping}
            title="Next Page (Right Arrow)"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-white transition-all shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pdf3DFlipbook;
