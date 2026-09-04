"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import flipbook to avoid SSR issues
const EditionFlipbook = dynamic(() => import("./EditionFlipbook"), { ssr: false });

import { API_BASE_URL, formatAssetUrl } from "@/lib/config";

export interface EditionItem {
  id: string;
  title: string;
  pdfUrl: string;
  coverImage?: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PreviousEditionsProps {
  title?: string;
}

export const PreviousEditions: React.FC<PreviousEditionsProps> = ({
  title = "Previous Editions",
}) => {
  const [editions, setEditions] = useState<EditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [openEdition, setOpenEdition] = useState<EditionItem | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/editions?page=1&limit=3`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (isMounted) {
          if (json && json.data && Array.isArray(json.data)) {
            setEditions(json.data);
            setHasMore(json.meta?.hasMore ?? (json.meta?.page < json.meta?.totalPages));
          } else if (Array.isArray(json)) {
            setEditions(json.slice(0, 3));
            setHasMore(json.length > 3);
          } else {
            setEditions([]);
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("[PreviousEditions] fetch failed:", err);
        if (isMounted) {
          setEditions([]);
          setHasMore(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`${API_BASE_URL}/editions?page=${nextPage}&limit=3`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json && json.data && Array.isArray(json.data)) {
        const newItems = json.data;
        setEditions((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const filtered = newItems.filter((e: EditionItem) => !existingIds.has(e.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        setHasMore(json.meta?.hasMore ?? (json.meta?.page < json.meta?.totalPages));
      } else if (Array.isArray(json)) {
        setEditions(json);
        setHasMore(false);
      }
    } catch (err) {
      console.error("[PreviousEditions] loadMore failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <>
      <section className="relative w-full bg-white py-12 lg:py-20 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          {/* Section Header */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-8 sm:mb-10 lg:mb-12 text-left">
            {title}
          </h2>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
                  <div className="mt-4 h-5 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && editions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No editions published yet.</p>
            </div>
          )}

          {/* Editions Grid */}
          {!loading && editions.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 items-start">
                {editions.map((edition) => {
                  const showCover = !!(edition.coverImage && !imgErrors[edition.id]);
                  return (
                    <button
                      key={edition.id}
                      onClick={() => setOpenEdition(edition)}
                      className="flex flex-col group cursor-pointer text-left w-full"
                    >
                      {/* Cover Image */}
                      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 bg-gray-100 shadow-md group-hover:shadow-xl group-hover:-translate-y-1">
                        {showCover ? (
                          <img
                            src={formatAssetUrl(edition.coverImage!)}
                            alt={edition.title}
                            onError={() => handleImgError(edition.id)}
                            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-100 to-gray-200">
                            <BookOpen className="w-12 h-12 text-gray-300" />
                            <span className="text-xs text-gray-400 font-medium text-center px-4 leading-snug">
                              {edition.title}
                            </span>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-black text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg">
                            <BookOpen className="w-4 h-4" />
                            Read Flipbook
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-dark-text tracking-tight mt-4 group-hover:text-black transition-colors">
                        {edition.title}
                      </h3>
                    </button>
                  );
                })}
              </div>

              {/* View More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12 sm:mt-16">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-2.5 rounded-full border border-dark-bg text-dark-bg hover:bg-dark-bg hover:text-white transition-all text-sm font-medium shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>View more</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Flipbook Modal */}
      {openEdition && (
        <EditionFlipbook
          pdfUrl={openEdition.pdfUrl}
          title={openEdition.title}
          onClose={() => setOpenEdition(null)}
        />
      )}
    </>
  );
};

export default PreviousEditions;
