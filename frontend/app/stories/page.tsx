"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  BookOpen,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  XCircle,
  Tag,
  CheckCircle2,
  ChevronRight,
  Layers,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface Story {
  id: string;
  title: string;
  slug: string;
  content?: string;
  category?: string;
  coverImageUrl: string | null;
  status: string;
  authorId: string;
  authorName?: string | null;
  authorEmail?: string;
  authorAvatarUrl?: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  malName: string | null;
  description: string | null;
}

function StoryCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const urlSearchParam = searchParams.get("search") || "";

  // Category & Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("akam_stories_category");
      if (saved) return saved;
    }
    return initialCategory;
  });

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("akam_stories_category", categoryName);
    }
  };
  const [searchQuery, setSearchQuery] = useState<string>(urlSearchParam);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(urlSearchParam);
  const [categories, setCategories] = useState<Category[]>([]);

  // Sync state if URL search param changes (e.g. from Navbar search)
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    setDebouncedSearch(currentUrlSearch);
    setSearchQuery(currentUrlSearch);
  }, [searchParams]);

  // Infinite Scroll & Data State
  const [stories, setStories] = useState<Story[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // Sentinel ref for IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Categories taxonomy
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          setCategories(list);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Stories (Reset & Page 1)
  const fetchInitialStories = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const cQuery = selectedCategory && selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      const sQuery = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const url = `${API_BASE_URL}/stories?status=APPROVED&page=1&limit=9${cQuery}${sQuery}`;

      const res = await apiFetch(url, { next: { revalidate: 30 } });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStories(json.data);
          setTotalPages(json.meta.totalPages);
          setTotalItems(json.meta.total);
        } else if (Array.isArray(json)) {
          setStories(json);
          setTotalPages(1);
          setTotalItems(json.length);
        }
      }
    } catch (err) {
      console.error("Failed to load initial stories catalog", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // 3. Fetch More Stories (Infinite Scroll Page > 1)
  const loadMoreStories = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const cQuery = selectedCategory && selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      const sQuery = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const url = `${API_BASE_URL}/stories?status=APPROVED&page=${nextPage}&limit=9${cQuery}${sQuery}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        const newItems = json.data || (Array.isArray(json) ? json : []);
        setStories((prev) => {
          // Exclude duplicates
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = newItems.filter((item: Story) => !existingIds.has(item.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        if (json.meta) {
          setTotalPages(json.meta.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to load more stories", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore, selectedCategory, searchQuery]);

  // Trigger initial fetch on category or search query change
  useEffect(() => {
    fetchInitialStories();
  }, [selectedCategory, searchQuery]);

  // Debounced search query handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (loading || loadingMore || page >= totalPages) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          loadMoreStories();
        }
      },
      { threshold: 0.2 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, page, totalPages, loadMoreStories]);

  const renderStoryContent = (contentStr?: string) => {
    if (!contentStr || !contentStr.trim()) {
      return <p className="text-gray-400 italic py-4">No narrative text content available for preview.</p>;
    }

    let processedContent = contentStr.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(processedContent)) !== null) {
      if (match.index > lastIndex) {
        const textChunk = processedContent.substring(lastIndex, match.index);
        if (textChunk.trim()) parts.push({ type: "text", value: textChunk });
      }
      const src = match[1];
      if (src) parts.push({ type: "image", src, alt: "Story Inline Image" });
      lastIndex = imgRegex.lastIndex;
    }

    if (lastIndex < processedContent.length) {
      const textChunk = processedContent.substring(lastIndex);
      if (textChunk.trim()) parts.push({ type: "text", value: textChunk });
    }

    if (parts.length === 0) parts.push({ type: "text", value: processedContent });

    return (
      <div className="space-y-6">
        {parts.map((part, idx) => {
          if (part.type === "text") {
            const isHtml = /<[a-z][\s\S]*>/i.test(part.value);
            if (isHtml) {
              return (
                <div
                  key={idx}
                  className="prose max-w-none text-gray-900 text-base leading-relaxed font-normal whitespace-pre-wrap [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: part.value }}
                />
              );
            }
            return (
              <p key={idx} className="text-gray-900 text-base leading-relaxed font-normal whitespace-pre-wrap">
                {part.value}
              </p>
            );
          } else {
            return (
              <div key={idx} className="relative w-full aspect-[16/9] rounded-[24px] overflow-hidden my-6 bg-gray-100 border border-gray-200 shadow-xs">
                <Image src={part.src} alt={part.alt} fill unoptimized className="object-cover" />
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col justify-between">
      <main className="flex-1 pb-10">
        {/* Page Hero Header Banner */}
        <section className="relative w-full bg-[#040706] text-white py-16 lg:py-24 overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl">
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-4">
                Explore Published Stories
              </h1>
              <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed">
                Discover curated narratives, short stories, essays, and creative Malayalam prose published by our literary community.
              </p>
            </div>

            {/* Search Bar & Category Controls inside Hero Header */}
            <div className="mt-8 pt-8 border-t border-gray-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stories by title, author or keyword..."
                  value={debouncedSearch}
                  onChange={(e) => setDebouncedSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm text-white placeholder-gray-400 outline-none focus:border-[#E4F953] transition-all font-medium"
                />
              </div>

              <div className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#E4F953]" />
                <span>Showing <strong className="text-white">{totalItems}</strong> published stories</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Catalog Content */}
        <div className="container px-4 mx-auto mt-10">
          {/* Category Filter Pills Bar using Standardized Button Component */}
          <div className="mb-10 px-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              <Button
                type="button"
                variant={selectedCategory === "All" ? "green" : "secondary"}
                size="sm"
                onClick={() => handleCategoryChange("All")}
                className={`font-semibold shadow-xs transition-all cursor-pointer ${
                  selectedCategory === "All" ? "shadow-md scale-105" : "border border-gray-200"
                }`}
              >
                All Stories
              </Button>

              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={isSelected ? "green" : "secondary"}
                    size="sm"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`font-semibold shadow-xs transition-all cursor-pointer ${
                      isSelected ? "shadow-md scale-105" : "border border-gray-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Stories Grid */}
          {loading ? (
            <div className="py-24 flex flex-col justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#040706] mb-3"></div>
              <p className="text-xs font-semibold text-gray-600">Loading published catalog...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-[32px] p-12 text-center max-w-lg mx-auto shadow-xs my-8">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">No Stories Found</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                There are no published stories matching your current category filter or search terms.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleCategoryChange("All");
                  setDebouncedSearch("");
                }}
                className="border border-gray-300 shadow-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.slug || story.id}`}
                    className="flex flex-col bg-white border border-gray-200 rounded-2xl p-3.5 hover:shadow-md transition-all duration-300 group/card cursor-pointer shadow-xs"
                  >
                    {/* Story Cover */}
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-xs">
                      <Image
                        src={story.coverImageUrl || "/images/stories/ramachi.jpg"}
                        alt={story.title}
                        fill
                        unoptimized
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute top-2 left-2 z-10 flex gap-1.5 flex-wrap">
                        <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs">
                          {(story.category || "Fiction").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-950 tracking-tight leading-snug line-clamp-2 group-hover/card:text-gray-700 transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">By {story.authorName || story.authorEmail || "Unknown Author"}</span>
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-end text-xs">
                        <span className="font-bold text-[11px] text-gray-900 group-hover/card:text-black flex items-center gap-1">
                          Read Story <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Sentinel div for Infinite Scroll */}
              <div ref={sentinelRef} className="h-10 my-6" />

              {/* Loading More Spinner */}
              {loadingMore && (
                <div className="py-6 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#040706]"></div>
                </div>
              )}

              {/* End of Stories Message */}
            
            </div>
          )}
        </div>
      </main>

      {/* Reader Preview Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[32px] p-5 sm:p-8 overflow-y-auto shadow-2xl flex flex-col font-poppins">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs inline-block mb-1">
                  {(selectedStory.category || "Fiction").toUpperCase()}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 mt-1">{selectedStory.title}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  By {selectedStory.authorName || selectedStory.authorEmail} &bull; Published {new Date(selectedStory.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {selectedStory.coverImageUrl && (
              <div className="relative w-full max-w-md mx-auto aspect-[3/4] sm:aspect-[4/5] rounded-[28px] overflow-hidden mb-6 bg-gray-100 border border-gray-200 shadow-md">
                <Image src={selectedStory.coverImageUrl} alt={selectedStory.title} fill unoptimized className="object-cover" />
              </div>
            )}

            <div className="mb-8">{renderStoryContent(selectedStory.content)}</div>

            <div className="flex items-center justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" size="md" onClick={() => setSelectedStory(null)} className="border border-gray-300 shadow-xs">
                Close Story
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoryCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
            <p className="text-gray-900 text-sm font-semibold tracking-wider">Loading Stories Catalog...</p>
          </div>
        </div>
      }
    >
      <StoryCatalogContent />
    </Suspense>
  );
}
