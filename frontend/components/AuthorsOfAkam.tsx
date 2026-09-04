"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, X, Sparkles } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface AuthorItem {
  id: string;
  name: string;
  role: string;
  imageSrc?: string | null;
  imageAlt?: string;
}

export interface AuthorsOfAkamProps {
  title?: string;
  subtitle?: string;
  authors?: AuthorItem[];
}

export const AuthorsOfAkam: React.FC<AuthorsOfAkamProps> = ({
  title = "Authors Of Akam",
  subtitle = "The voices, minds, and storytellers behind our archives.",
  authors: propAuthors,
}) => {
  const [displayAuthors, setDisplayAuthors] = useState<AuthorItem[]>(propAuthors || []);
  const [loading, setLoading] = useState(!propAuthors || propAuthors.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Author Profile Modal State
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorItem | null>(null);

  const mapUserToAuthorItem = (users: any[]): AuthorItem[] => {
    return users.map((u: any, idx: number) => ({
      id: u.id || `author-${idx}`,
      name: u.name || u.email?.split("@")[0] || "Akam Author",
      role: u.bio || `${u.role || "Author"} at Akam Journal`,
      imageSrc: u.avatarUrl || null,
      imageAlt: u.name || "Author Avatar",
    }));
  };

  useEffect(() => {
    if (propAuthors && propAuthors.length > 0) {
      setDisplayAuthors(propAuthors);
      setLoading(false);
      return;
    }

    const fetchInitialAuthors = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/public-authors?page=1&limit=4`);
        if (res.ok) {
          const json = await res.json();
          const authorsData = json.data ? json.data : (Array.isArray(json) ? json : []);
          const meta = json.meta || {};

          if (authorsData.length > 0) {
            const mapped = mapUserToAuthorItem(authorsData);
            setDisplayAuthors(mapped);
            setHasMore(meta.hasMore ?? false);
          } else {
            setDisplayAuthors([]);
            setHasMore(false);
          }
        } else {
          setDisplayAuthors([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to fetch public authors", err);
        setDisplayAuthors([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialAuthors();
  }, [propAuthors]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/public-authors?page=${nextPage}&limit=4`);
      if (res.ok) {
        const json = await res.json();
        const authorsData = json.data ? json.data : (Array.isArray(json) ? json : []);
        const meta = json.meta || {};

        if (authorsData.length > 0) {
          const mapped = mapUserToAuthorItem(authorsData);
          setDisplayAuthors((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = mapped.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
          setPage(nextPage);
          setHasMore(meta.hasMore ?? false);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Failed to load more authors", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <section className="relative w-full bg-[#D4F2E433] py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="text-center mx-auto mb-12 sm:mb-16 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#29ABE2] tracking-tight mb-3 font-poppins">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed font-poppins">
              {subtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mx-auto justify-items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center text-center animate-pulse w-full">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gray-200 mb-5" />
                <div className="h-5 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayAuthors || displayAuthors.length === 0) {
    return (
      <section className="relative w-full bg-[#D4F2E433] py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
        <div className="container px-4 mx-auto relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#29ABE2] tracking-tight mb-3 font-poppins">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed font-poppins mb-6">
            {subtitle}
          </p>
          <p className="text-sm text-gray-500 font-medium">No authors found at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-[#D4F2E433] py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Header */}
        <div className="text-center mx-auto mb-12 sm:mb-16 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#29ABE2] tracking-tight mb-3 font-poppins">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed font-poppins">
            {subtitle}
          </p>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mx-auto justify-items-center">
          {displayAuthors.map((author, index) => (
            <div
              key={`${author.id}-${index}`}
              onClick={() => setSelectedAuthor(author)}
              className="flex flex-col items-center text-center group cursor-pointer w-full"
            >
              {/* Circular Avatar */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-5 bg-gray-100 border-2 border-transparent group-hover:border-gray-200 transition-all flex items-center justify-center">
                {author.imageSrc ? (
                  <Image
                    src={author.imageSrc}
                    alt={author.imageAlt || author.name}
                    fill
                    sizes="(max-width: 640px) 150px, 180px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    unoptimized={author.imageSrc.startsWith("http")}
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-700">
                    {author.name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-lg sm:text-xl font-bold text-dark-text tracking-tight mb-1.5 font-poppins group-hover:text-black transition-colors truncate max-w-[220px]">
                {author.name}
              </h3>

              {/* Role / Description */}
              <p className="text-sm text-[#5A6560C2] font-normal leading-relaxed mx-auto font-poppins line-clamp-2 max-w-[220px]">
                {author.role}
              </p>
            </div>
          ))}
        </div>

        {/* View More Button (Matching ExploreByInterest styling) */}
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

      </div>

      {/* Author Profile Popup Modal */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden text-left">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSelectedAuthor(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Featured Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AKAM Author Profile
              </span>
            </div>

            {/* Profile Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-gray-50 mx-auto mb-4 bg-gray-100 flex items-center justify-center shrink-0">
              {selectedAuthor.imageSrc ? (
                <Image
                  src={selectedAuthor.imageSrc}
                  alt={selectedAuthor.name}
                  fill
                  className="object-cover object-center"
                  unoptimized={selectedAuthor.imageSrc.startsWith("http")}
                />
              ) : (
                <span className="text-4xl font-bold text-gray-700">
                  {selectedAuthor.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Author Name */}
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 text-center tracking-tight mb-1">
              {selectedAuthor.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 text-center mb-6">
              Verified Platform Author
            </p>

            {/* Full Biography */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 mb-2 text-gray-800 text-sm leading-relaxed max-h-[220px] overflow-y-auto font-normal">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Author Biography & Details
              </span>
              <p className="text-gray-900 leading-relaxed font-normal whitespace-pre-line">
                {selectedAuthor.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthorsOfAkam;
