"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { formatAssetUrl } from "@/lib/config";

export interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
}

export interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImage[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
  subtitle,
  badgeLabel = "Visual Arts",
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoom(1);
      setRotation(0);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransforms();
  }, [images.length, resetTransforms]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransforms();
  }, [images.length, resetTransforms]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 0.5);
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleToggleZoom = useCallback(() => {
    setZoom((prev) => {
      if (prev > 1) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleRotate();
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransforms();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, handleZoomIn, handleZoomOut, handleRotate, resetTransforms]);

  // Pan / Drag handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex] || images[0];
  const formattedUrl = formatAssetUrl(currentImg.src);

  const handleDownload = async () => {
    try {
      const res = await fetch(formattedUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const ext = currentImg.src.split(".").pop()?.split("?")[0] || "jpg";
      link.download = `${(title || "artwork").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${currentIndex + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(formattedUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-2 sm:p-4 md:p-6 text-white select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between gap-3 px-2 py-2 sm:px-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shrink-0 z-20 shadow-2xl">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600/80 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Palette className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#E4F953] text-[#040706] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {badgeLabel}
              </span>
              {images.length > 1 && (
                <span className="bg-white/20 text-white text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md">
                  Image {currentIndex + 1} of {images.length}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-lg mt-0.5">
              {title || currentImg.title || currentImg.alt || "Artwork Inspection"}
            </h2>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] text-gray-300 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={resetTransforms}
              className="px-2 py-1 text-[11px] font-mono text-gray-200 hover:text-[#E4F953] hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Reset Zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate button */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Rotate</span>
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
            title="Download full resolution"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Download</span>
          </button>

          {/* Open original in new tab */}
          <a
            href={formattedUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-gray-300 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Original</span>
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition cursor-pointer ml-1 shadow-xs active:scale-95"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Canvas Viewport ──────────────────────────────── */}
      <div
        className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 sm:my-3 cursor-default"
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          // If user clicks the empty background area, close modal
          if (e.target === e.currentTarget && zoom === 1) {
            onClose();
          }
        }}
      >
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="Previous artwork image"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* The Image Itself */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onDoubleClick={handleToggleZoom}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={formattedUrl}
            alt={currentImg.alt || title || "Artwork"}
            className="max-w-[92vw] max-h-[72vh] sm:max-h-[78vh] object-contain rounded-xl shadow-2xl select-none pointer-events-auto"
            draggable={false}
          />
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="Next artwork image"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Quick zoom hint pill on desktop */}
        {zoom === 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/15 text-gray-300 text-[10px] sm:text-[11px] px-3 py-1 rounded-full pointer-events-none shadow-md hidden sm:flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3 text-[#E4F953]" />
            <span>Double-click or use + / - to zoom &bull; Drag to pan &bull; Press Esc to close</span>
          </div>
        )}
      </div>

      {/* ── Bottom Gallery Strip (if multiple images) ─────────── */}
      {images.length > 1 && (
        <div className="w-full max-w-3xl px-3 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shrink-0 z-20 shadow-2xl flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 px-1 scrollbar-thin scrollbar-thumb-white/20">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  resetTransforms();
                }}
                className={`relative shrink-0 w-14 sm:w-18 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "border-[#E4F953] ring-2 ring-[#E4F953]/40 scale-105 shadow-lg"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-white/40"
                }`}
                title={`View image #${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formatAssetUrl(img.src)}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 left-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>

          {currentImg.alt && currentImg.alt !== title && (
            <p className="text-[10px] sm:text-[11px] text-gray-300 truncate max-w-lg text-center">
              {currentImg.alt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
