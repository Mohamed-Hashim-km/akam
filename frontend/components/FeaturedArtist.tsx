"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Loader2, X, Sparkles, User, BookOpen } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface ArtistItem {
  id: string;
  name: string;
  bio: string;
  imageSrc?: string | null;
  imageAlt?: string;
}

export interface FeaturedArtistProps {
  title?: string;
  artists?: ArtistItem[];
}

export const FeaturedArtist: React.FC<FeaturedArtistProps> = ({
  title = "Featured Authors",
  artists: propArtists,
}) => {
  const [displayArtists, setDisplayArtists] = useState<ArtistItem[]>(propArtists || []);
  const [loading, setLoading] = useState(!propArtists || propArtists.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Author Profile Modal State
  const [selectedArtist, setSelectedArtist] = useState<ArtistItem | null>(null);

  const mapAuthorsToArtistItems = (authors: any[]): ArtistItem[] => {
    return authors.map((u: any, idx: number) => ({
      id: u.id || `author-${idx}`,
      name: u.name || u.email?.split("@")[0] || "Featured Author",
      bio: u.bio || `${u.role || "Author"} at Akam Journal`,
      imageSrc: u.avatarUrl || null,
      imageAlt: u.name || "Featured Author Avatar",
    }));
  };

  useEffect(() => {
    if (propArtists && propArtists.length > 0) {
      setDisplayArtists(propArtists);
      setLoading(false);
      return;
    }

    const fetchInitialFeaturedAuthors = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/featured?page=1&limit=4`);
        if (res.ok) {
          const json = await res.json();
          const authors = json.data ? json.data : (Array.isArray(json) ? json : []);
          const meta = json.meta || {};

          if (authors.length > 0) {
            const mapped = mapAuthorsToArtistItems(authors);
            setDisplayArtists(mapped);
            setHasMore(meta.hasMore ?? false);
          } else {
            setDisplayArtists([]);
            setHasMore(false);
          }
        } else {
          setDisplayArtists([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to fetch initial featured authors", err);
        setDisplayArtists([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialFeaturedAuthors();
  }, [propArtists]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/featured?page=${nextPage}&limit=4`);
      if (res.ok) {
        const json = await res.json();
        const authors = json.data ? json.data : (Array.isArray(json) ? json : []);
        const meta = json.meta || {};

        if (authors.length > 0) {
          const mapped = mapAuthorsToArtistItems(authors);
          // Append new authors ensuring no duplicate ids
          setDisplayArtists((prev) => {
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
      console.error("Failed to load more featured authors", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // If loading initial state or no featured authors exist, return null
  if (loading) return null;
  if (!displayArtists || displayArtists.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto">
        {/* Section Heading matching site-wide section header typography */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-10 lg:mb-14 text-left">
          {title}
        </h2>

        {/* Artists Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8 lg:gap-12 items-start justify-items-center">
          {displayArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[180px] sm:max-w-none"
            >
              {/* Circle Image Avatar Container */}
              <div className="relative w-28 h-28 xs:w-32 xs:h-32 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full overflow-hidden border border-gray-100 group-hover:scale-105 transition-all duration-300 bg-gray-100 flex items-center justify-center shrink-0">
                {artist.imageSrc ? (
                  <Image
                    src={artist.imageSrc}
                    alt={artist.imageAlt || artist.name}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover object-center"
                    unoptimized={artist.imageSrc.startsWith("http")}
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-700">
                    {artist.name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name matching card titles - Allows natural word breaking */}
              <h3 className="text-lg lg:text-xl font-semibold text-dark-bg tracking-tight mt-3 sm:mt-5 group-hover:text-black transition-colors text-center w-full px-1 break-words leading-tight sm:leading-snug">
                {artist.name}
              </h3>

              {/* Bio Subtitle matching secondary text typography */}
              <p className="text-xs sm:text-sm text-dark-bg/70 font-normal mt-1.5 max-w-[220px] leading-relaxed line-clamp-2">
                {artist.bio}
              </p>
            </div>
          ))}
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
      </div>

      {/* Author Profile Popup Modal */}
      {selectedArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSelectedArtist(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Featured Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured AKAM Author
              </span>
            </div>

            {/* Profile Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-gray-50 mx-auto mb-4 bg-gray-100 flex items-center justify-center shrink-0">
              {selectedArtist.imageSrc ? (
                <Image
                  src={selectedArtist.imageSrc}
                  alt={selectedArtist.name}
                  fill
                  className="object-cover object-center"
                  unoptimized={selectedArtist.imageSrc.startsWith("http")}
                />
              ) : (
                <span className="text-4xl font-bold text-gray-700">
                  {selectedArtist.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Author Name */}
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 text-center tracking-tight mb-1">
              {selectedArtist.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 text-center mb-6">
              Verified Platform Author
            </p>

            {/* Full Biography */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 mb-6 text-gray-800 text-sm leading-relaxed max-h-[220px] overflow-y-auto font-normal">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Author Biography
              </span>
              <p className="text-gray-900 leading-relaxed font-normal whitespace-pre-line">
                {selectedArtist.bio}
              </p>
            </div>

            {/* Actions */}
            {/* <div className="flex items-center gap-3">
              <Link href="/library" className="w-full">
                <button
                  type="button"
                  onClick={() => setSelectedArtist(null)}
                  className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-2xl text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Explore Published Stories
                </button>
              </Link>
            </div> */}
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedArtist;
