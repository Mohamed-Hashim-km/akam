"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  ChevronDown,
  Layers,
  Play,
  Video,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
  Film,
  FileText,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

interface Story {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  category?: string;
  coverImageUrl: string | null;
  submissionType?: string;
  mediaUrl?: string | null;
  status: string;
  isFeatured?: boolean;
  authorId: string;
  authorName?: string | null;
  authorEmail?: string;
  authorAvatarUrl?: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

type SubmissionTypeFilter = "ALL" | "STORY" | "PAINTING" | "VIDEO";
type SortOption = "newest" | "oldest";

function WorksCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category") || "All";
  const urlType = (searchParams.get("type") || searchParams.get("submissionType") || "ALL").toUpperCase() as SubmissionTypeFilter;
  const urlSearchParam = searchParams.get("search") || "";
  const urlSort = (searchParams.get("sortBy") === "oldest" ? "oldest" : "newest") as SortOption;

  // Filter States
  const [selectedType, setSelectedType] = useState<SubmissionTypeFilter>(urlType);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearchParam);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(urlSearchParam);

  // Categories & UI States
  const [categories, setCategories] = useState<Category[]>([]);
  const [isArticleAccordionOpen, setIsArticleAccordionOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

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

  // Sync state if URL search param changes (e.g. from Navbar search)
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    setDebouncedSearch(currentUrlSearch);
    setSearchQuery(currentUrlSearch);
  }, [searchParams]);

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
      const typeQuery = selectedType && selectedType !== "ALL" ? `&submissionType=${encodeURIComponent(selectedType)}` : "";
      const cQuery = selectedCategory && selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      const sQuery = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const sortQuery = sortBy && sortBy !== "newest" ? `&sortBy=${encodeURIComponent(sortBy)}` : "";
      const url = `${API_BASE_URL}/stories?status=APPROVED&page=1&limit=12${typeQuery}${cQuery}${sQuery}${sortQuery}`;

      const res = await apiFetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStories(json.data);
          setTotalPages(json.meta?.totalPages || 1);
          setTotalItems(json.meta?.total || json.data.length);
        } else if (Array.isArray(json)) {
          setStories(json);
          setTotalPages(1);
          setTotalItems(json.length);
        }
      }
    } catch (err) {
      console.error("Failed to load initial works catalog", err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, searchQuery, sortBy]);

  // 3. Fetch More Stories (Infinite Scroll Page > 1)
  const loadMoreStories = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const typeQuery = selectedType && selectedType !== "ALL" ? `&submissionType=${encodeURIComponent(selectedType)}` : "";
      const cQuery = selectedCategory && selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      const sQuery = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const sortQuery = sortBy && sortBy !== "newest" ? `&sortBy=${encodeURIComponent(sortBy)}` : "";
      const url = `${API_BASE_URL}/stories?status=APPROVED&page=${nextPage}&limit=12${typeQuery}${cQuery}${sQuery}${sortQuery}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        const newItems = json.data || (Array.isArray(json) ? json : []);
        setStories((prev) => {
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
      console.error("Failed to load more works", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore, selectedType, selectedCategory, searchQuery, sortBy]);

  // Trigger initial fetch on any filter or search query change
  useEffect(() => {
    fetchInitialStories();
  }, [fetchInitialStories]);

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

  // Filter handlers
  const handleSelectType = (type: SubmissionTypeFilter) => {
    setSelectedType(type);
    if (type === "STORY") {
      setIsArticleAccordionOpen(true);
    } else {
      setSelectedCategory("All");
    }
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedType("STORY");
  };

  const handleResetFilters = () => {
    setSelectedType("ALL");
    setSelectedCategory("All");
    setDebouncedSearch("");
    setSearchQuery("");
    setSortBy("newest");
  };

  const activeFiltersCount =
    (selectedType !== "ALL" ? 1 : 0) +
    (selectedCategory !== "All" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

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
      if (src) parts.push({ type: "image", src, alt: "Work Inline Image" });
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
                  className="prose max-w-none text-gray-900 text-base leading-relaxed font-normal [&_p]:mb-4 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
                  dangerouslySetInnerHTML={{ __html: part.value }}
                />
              );
            }

            let formattedText = part.value;
            formattedText = formattedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>');
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');

            const paragraphs = formattedText.replace(/\r\n/g, "\n").split("\n\n");
            return (
              <div key={idx} className="space-y-4">
                {paragraphs.map((pText, pIdx) => {
                  if (!pText.trim()) {
                    return <p key={pIdx} className="h-6 mb-6"><br /></p>;
                  }
                  const containsInlineHtml = /<[a-z][\s\S]*>/i.test(pText);
                  if (containsInlineHtml) {
                    return (
                      <div
                        key={pIdx}
                        className="text-gray-900 text-base leading-relaxed font-normal mb-6 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium"
                        dangerouslySetInnerHTML={{ __html: pText }}
                      />
                    );
                  }
                  return (
                    <p key={pIdx} className="text-gray-900 text-base leading-relaxed font-normal whitespace-pre-wrap mb-6">
                      {pText}
                    </p>
                  );
                })}
              </div>
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

  // Reusable Sidebar Filters Component
  const SidebarFilterContent = () => (
    <div className="space-y-6">
      {/* Format & Medium Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            Format / Medium
          </label>
          {selectedType !== "ALL" && (
            <button
              onClick={() => handleSelectType("ALL")}
              className="text-[11px] font-semibold text-gray-500 hover:text-black underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {/* 1. All Works */}
          <button
            type="button"
            onClick={() => handleSelectType("ALL")}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selectedType === "ALL"
                ? "bg-[#040706] text-white shadow-md font-semibold"
                : "bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedType === "ALL" ? "bg-white/20 text-[#E4F953]" : "text-gray-900 bg-gray-100"
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs tracking-tight">All Works</span>
            </div>
            {selectedType === "ALL" && (
              <div className="w-2 h-2 rounded-full bg-[#E4F953]" />
            )}
          </button>

          {/* 2. Articles & Stories (Parent Item with nested subcategories directly underneath) */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (selectedType === "STORY") {
                  setIsArticleAccordionOpen((prev) => !prev);
                } else {
                  handleSelectType("STORY");
                  setIsArticleAccordionOpen(true);
                }
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                selectedType === "STORY"
                  ? "bg-[#040706] text-white shadow-md font-semibold"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedType === "STORY" ? "bg-white/20 text-[#E4F953]" : "text-blue-700 bg-blue-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs tracking-tight">Articles</span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedType === "STORY" && (
                  <div className="w-2 h-2 rounded-full bg-[#E4F953]" />
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isArticleAccordionOpen && selectedType === "STORY" ? "rotate-180" : ""
                  } ${selectedType === "STORY" ? "text-white/70" : "text-gray-400"}`}
                />
              </div>
            </button>

            {/* Nested Article Categories Sub-tree directly under Articles */}
            {selectedType === "STORY" && isArticleAccordionOpen && (
              <div className="ml-3 pl-3 my-2 border-l-2 border-gray-200 space-y-1 py-1 max-h-72 overflow-y-auto pr-1 animate-in fade-in duration-150">
                {/* All Article Categories Option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedType("STORY");
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCategory === "All"
                      ? "bg-[#040706] text-white font-bold shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === "All" && (
                    <Check className="w-3.5 h-3.5 text-[#E4F953]" />
                  )}
                </button>

                {/* Individual Article Categories (Clean English names only) */}
                {categories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.name)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#040706] text-white font-bold shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#E4F953] shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Visual Arts */}
          <button
            type="button"
            onClick={() => handleSelectType("PAINTING")}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selectedType === "PAINTING"
                ? "bg-[#040706] text-white shadow-md font-semibold"
                : "bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedType === "PAINTING" ? "bg-white/20 text-[#E4F953]" : "text-purple-700 bg-purple-50"
                }`}
              >
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-xs tracking-tight">Visual Arts</span>
            </div>
            {selectedType === "PAINTING" && (
              <div className="w-2 h-2 rounded-full bg-[#E4F953]" />
            )}
          </button>

          {/* 4. Videos */}
          <button
            type="button"
            onClick={() => handleSelectType("VIDEO")}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selectedType === "VIDEO"
                ? "bg-[#040706] text-white shadow-md font-semibold"
                : "bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedType === "VIDEO" ? "bg-white/20 text-[#E4F953]" : "text-rose-700 bg-rose-50"
                }`}
              >
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xs tracking-tight">Videos</span>
            </div>
            {selectedType === "VIDEO" && (
              <div className="w-2 h-2 rounded-full bg-[#E4F953]" />
            )}
          </button>
        </div>
      </div>

      {/* Sort Section in Sidebar (Newest & Oldest Only) */}
      <div className="pt-5 border-t border-gray-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
          Sort Order
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "newest", label: "Newest" },
            { id: "oldest", label: "Oldest" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSortBy(item.id as SortOption)}
              className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                sortBy === item.id
                  ? "bg-gray-900 text-white font-semibold shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Filter Button */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col justify-between">
      <main className="flex-1 pb-16">
        {/* Page Hero Header Banner */}
        <section className="relative w-full bg-[#040706] text-white py-12 lg:py-16 overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E4F953] text-xs font-bold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AKAM Catalog
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
                Explore Published Works
              </h1>
              <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed max-w-2xl">
                Browse our curated collection of literature, essays, visual arts galleries, and video documentaries.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content Area with E-Commerce Sidebar Layout */}
        <div className="container px-4 mx-auto py-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            
            {/* ── Left Sidebar (Desktop Filter Panel) ── */}
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 z-20">
              <div className="bg-white rounded-[28px] border border-gray-200/90 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-900" />
                    <h2 className="text-sm font-bold text-gray-950">Filters & Categories</h2>
                  </div>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] font-bold bg-[#E4F953] text-[#040706] px-2.5 py-0.5 rounded-full shadow-xs">
                      {activeFiltersCount} active
                    </span>
                  )}
                </div>

                <SidebarFilterContent />
              </div>
            </aside>

            {/* ── Right Column: Search bar, Active Chips & Works Grid ── */}
            <div className="flex-1 w-full min-w-0">
              {/* Top Search & Filter Bar */}
              <div className="bg-white rounded-[24px] border border-gray-200/90 p-3.5 sm:p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by title, author, keyword..."
                    value={debouncedSearch}
                    onChange={(e) => setDebouncedSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:bg-white transition-all shadow-xs"
                  />
                  {debouncedSearch && (
                    <button
                      type="button"
                      onClick={() => setDebouncedSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Filter Toggle & Sort selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#040706] text-[#E4F953] text-[10px] flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 shadow-xs">
                    <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap hidden sm:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent py-1.5 text-xs font-bold text-gray-800 outline-none focus:outline-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips / Pills */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center flex-wrap gap-2 mb-6">
                  <span className="text-xs font-bold text-gray-500 mr-1">Active:</span>

                  {selectedType !== "ALL" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold shadow-xs">
                      <span>
                        Format: {selectedType === "STORY" ? "Articles" : selectedType === "PAINTING" ? "Visual Arts" : "Videos"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectType("ALL")}
                        className="hover:text-rose-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedCategory !== "All" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold shadow-xs">
                      <span>Category: {selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("All")}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold shadow-xs">
                      <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDebouncedSearch("");
                          setSearchQuery("");
                        }}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Status Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs font-semibold text-gray-500">
                  Showing <strong className="text-gray-950 font-bold">{totalItems}</strong> {totalItems === 1 ? "work" : "works"}
                  {selectedType !== "ALL" && ` in ${selectedType === "STORY" ? "Articles" : selectedType === "PAINTING" ? "Visual Arts" : "Videos"}`}
                  {selectedCategory !== "All" && ` • ${selectedCategory}`}
                </p>
              </div>

              {/* Stories/Works Grid */}
              {loading ? (
                <div className="py-24 flex flex-col justify-center items-center bg-white rounded-[28px] border border-gray-200">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#040706] mb-3"></div>
                  <p className="text-xs font-semibold text-gray-600">Loading catalog works...</p>
                </div>
              ) : stories.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-[32px] p-12 text-center max-w-lg mx-auto shadow-xs my-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-xl font-bold text-gray-900 mb-1">No Works Found</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    There are no published works matching your current category or medium filters.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetFilters}
                    className="border border-gray-300 shadow-xs"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {stories.map((story) => {
                      const isVideo =
                        story.submissionType?.toUpperCase() === "VIDEO" ||
                        story.category?.toLowerCase() === "video";
                      const isPainting =
                        story.submissionType?.toUpperCase() === "PAINTING" ||
                        story.category?.toLowerCase() === "painting" ||
                        story.category?.toLowerCase() === "art";

                      let imageSource = story.coverImageUrl || (isPainting ? story.mediaUrl : null);
                      if (!imageSource && isVideo && story.mediaUrl) {
                        const ytMatch = story.mediaUrl.match(
                          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
                        );
                        if (ytMatch && ytMatch[1]) {
                          imageSource = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
                        }
                      }
                      if (!imageSource) {
                        imageSource = story.mediaUrl || "/images/stories/ramachi.jpg";
                      }
                      if (imageSource && imageSource.startsWith("/")) {
                        imageSource = formatAssetUrl(imageSource);
                      }

                      return (
                        <Link
                          key={story.id}
                          href={`/works/${story.slug || story.id}`}
                          className="flex flex-col bg-white border border-gray-200/90 rounded-[24px] p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group/card cursor-pointer shadow-xs"
                        >
                          {/* Story / Work Cover */}
                          <div className="relative w-full aspect-[16/10] rounded-[18px] overflow-hidden bg-gray-100 mb-3.5 shadow-xs">
                            <Image
                              src={imageSource}
                              alt={story.title}
                              fill
                              unoptimized
                              className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                            />

                            {/* Category / Type Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                              <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-xs">
                                {(isPainting ? "Visual Arts" : isVideo ? "Video" : (story.category || "Article")).toUpperCase()}
                              </span>
                            </div>

                            {/* Video play indicator */}
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center shadow-lg group-hover/card:scale-110 group-hover/card:bg-[#E4F953] transition-all">
                                  <Play className="w-5 h-5 fill-white text-white group-hover/card:fill-black group-hover/card:text-black ml-0.5 transition-colors" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight leading-snug line-clamp-2 group-hover/card:text-gray-700 transition-colors">
                                {story.title}
                              </h3>
                              {story.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-normal">
                                  {story.description}
                                </p>
                              )}
                              <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
                                <User className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate font-medium">By {story.authorName || story.authorEmail || "Unknown Author"}</span>
                              </p>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-gray-400 font-medium">
                                {new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className="font-bold text-[11px] text-gray-900 group-hover/card:text-black flex items-center gap-1">
                                {isVideo ? "Watch Video" : isPainting ? "View Visual Arts" : "Read Article"}
                                <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-1" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Sentinel div for Infinite Scroll */}
                  <div ref={sentinelRef} className="h-10 my-6" />

                  {/* Loading More Spinner */}
                  {loadingMore && (
                    <div className="py-6 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#040706]"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer / Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs sm:max-w-sm bg-white h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-900" />
                  <h3 className="text-sm font-bold text-gray-950">Filters & Categories</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarFilterContent />
            </div>

            <div className="pt-5 border-t border-gray-100 mt-6 sticky bottom-0 bg-white">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full rounded-xl font-bold justify-center shadow-md bg-[#040706] text-white hover:bg-black"
              >
                Apply Filters ({totalItems} works)
              </Button>
            </div>
          </div>
        </div>
      )}

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
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorksCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
            <p className="text-gray-900 text-sm font-semibold tracking-wider">Loading Works Catalog...</p>
          </div>
        </div>
      }
    >
      <WorksCatalogContent />
    </Suspense>
  );
}
