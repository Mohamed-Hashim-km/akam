"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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

  if (loading) return null;
  if (!displayAuthors || displayAuthors.length === 0) return null;

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
              className="flex flex-col items-center text-center group cursor-pointer w-full"
            >
              {/* Circular Avatar */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-5 bg-gray-100 shadow-xs border-2 border-transparent group-hover:border-gray-200 transition-all flex items-center justify-center">
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
    </section>
  );
};

export default AuthorsOfAkam;
