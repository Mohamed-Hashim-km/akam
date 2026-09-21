"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  Heart,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Trash2,
  Lock,
  ChevronDown,
  Palette,
  Video,
  Play,
  Eye,
  Layers,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface LibraryStory {
  id: string;
  storyId: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  category: string | null;
  submissionType?: "STORY" | "PAINTING" | "VIDEO" | string;
  mediaUrl?: string | null;
  authorName: string | null;
  authorEmail: string;
  authorAvatarUrl: string | null;
  progressPercent?: number;
  lastScrollPosition?: number;
  isCompleted?: boolean;
  lastReadAt?: string;
  savedAt?: string;
  likedAt?: string;
}

interface LibraryCounts {
  inProgress: number;
  bookmarked: number;
  liked: number;
  completed: number;
}

type TabType = "inProgress" | "bookmarked" | "liked" | "completed";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("akam_library_tab") as TabType;
      if (saved && ["inProgress", "bookmarked", "liked", "completed"].includes(saved)) {
        return saved;
      }
    }
    return "inProgress";
  });

  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [counts, setCounts] = useState<LibraryCounts>({
    inProgress: 0,
    bookmarked: 0,
    liked: 0,
    completed: 0,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sentinel and Observer for Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Prevent stale async state updates when switching tabs quickly
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const loadTabStories = useCallback(
    async (tab: TabType, pageNum: number = 1, isAppend: boolean = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await apiFetch(
          `${API_BASE_URL}/users/me/library?tab=${tab}&page=${pageNum}&limit=9`
        );

        if (activeTabRef.current !== tab) {
          // Tab switched while request was in-flight; discard
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const fetchedItems: LibraryStory[] = data.items || [];
          const fetchedCounts = data.counts || {
            inProgress: data.inProgress?.length || 0,
            bookmarked: data.bookmarked?.length || 0,
            liked: data.liked?.length || 0,
            completed: data.completed?.length || 0,
          };
          const fetchedMeta = data.meta || {
            page: pageNum,
            totalPages: 1,
            hasMore: false,
          };

          setCounts(fetchedCounts);
          setPage(fetchedMeta.page);
          setTotalPages(fetchedMeta.totalPages);
          setHasMore(fetchedMeta.hasMore);

          if (isAppend) {
            setStories((prev) => {
              const existingIds = new Set(prev.map((s) => s.id || s.storyId));
              const newUnique = fetchedItems.filter(
                (s) => !existingIds.has(s.id || s.storyId)
              );
              return [...prev, ...newUnique];
            });
          } else {
            setStories(fetchedItems);
          }
        } else if (res.status === 401) {
          setUser(null);
          setStories([]);
        }
      } catch (e) {
        console.error("Failed to fetch library data", e);
      } finally {
        if (activeTabRef.current === tab) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Load user from localStorage immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("akam_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Fetch stories when activeTab changes
  useEffect(() => {
    const savedUser =
      typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
    if (savedUser || user) {
      setStories([]);
      setPage(1);
      setHasMore(false);
      loadTabStories(activeTab, 1, false);
    } else {
      setLoading(false);
    }
  }, [activeTab, loadTabStories, user]);

  // Listen to auth update events
  useEffect(() => {
    const onUserUpdated = () => {
      const savedUser =
        typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          loadTabStories(activeTab, 1, false);
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
        setStories([]);
      }
    };
    window.addEventListener("akam_user_updated", onUserUpdated);
    return () => {
      window.removeEventListener("akam_user_updated", onUserUpdated);
    };
  }, [activeTab, loadTabStories]);

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("akam_library_tab", tab);
    }
  };

  // IntersectionObserver for server-side infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadTabStories(activeTab, page + 1, true);
        }
      },
      { rootMargin: "300px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, page, activeTab, loadTabStories]);

  // Remove bookmark handler
  const handleRemoveBookmark = async (storyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/bookmark`, {
        method: "POST",
      });
      if (res.ok) {
        setStories((prev) =>
          prev.filter((s) => s.storyId !== storyId && s.id !== storyId)
        );
        setCounts((prev) => ({
          ...prev,
          bookmarked: Math.max(0, prev.bookmarked - 1),
        }));
      }
    } catch (err) {
      console.error("Failed to remove bookmark", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col pb-16">
      {/* Header Banner */}
      <section className="bg-white border-b border-gray-200 py-8 sm:py-12">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-gray-700 text-xs font-semibold mb-3">
                <Layers className="w-3.5 h-3.5" />
                Personal Collection
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
                My Library
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                Revisit your bookmarked articles, paintings, and stories, track your reading progress, and explore your liked creative works.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <div className="mt-8">
              {/* Mobile Dropdown Menu (< sm screens) */}
              <div className="sm:hidden">
                <label htmlFor="library-tab-select" className="sr-only">
                  Select Library Tab
                </label>
                <div className="relative">
                  <select
                    id="library-tab-select"
                    value={activeTab}
                    onChange={(e) => handleTabChange(e.target.value as TabType)}
                    className="w-full bg-white border border-gray-300 text-gray-950 font-semibold text-xs sm:text-sm rounded-xl px-4 py-3 appearance-none outline-none focus:border-black shadow-xs"
                  >
                    <option value="inProgress">
                      In Progress ({counts.inProgress})
                    </option>
                    <option value="bookmarked">
                      Saved & Bookmarked ({counts.bookmarked})
                    </option>
                    <option value="liked">
                      Liked Works ({counts.liked})
                    </option>
                    <option value="completed">
                      Completed ({counts.completed})
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Desktop Button Row (>= sm screens) */}
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1">
                <Button
                  variant={activeTab === "inProgress" ? "primary" : "secondary"}
                  size="sm"
                  icon={<BookOpen className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => handleTabChange("inProgress")}
                  className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  In Progress
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "inProgress"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {counts.inProgress}
                  </span>
                </Button>

                <Button
                  variant={activeTab === "bookmarked" ? "primary" : "secondary"}
                  size="sm"
                  icon={<Bookmark className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => handleTabChange("bookmarked")}
                  className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Saved & Bookmarked
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "bookmarked"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {counts.bookmarked}
                  </span>
                </Button>

                <Button
                  variant={activeTab === "liked" ? "primary" : "secondary"}
                  size="sm"
                  icon={<Heart className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => handleTabChange("liked")}
                  className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Liked Works
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "liked"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {counts.liked}
                  </span>
                </Button>

                <Button
                  variant={activeTab === "completed" ? "primary" : "secondary"}
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => handleTabChange("completed")}
                  className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Completed
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "completed"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {counts.completed}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container px-4 mx-auto max-w-6xl py-10 flex-1">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-3"></div>
            <p className="text-xs font-semibold text-gray-500">Loading library...</p>
          </div>
        ) : !user ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-6 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-950 mb-2">
              Sign in to Access Your Library
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Sign in to save your favorite articles, stories, paintings, and videos, track your reading progress, and build your personal collection.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setAuthModalOpen(true)}
              className="px-8 py-2.5 text-sm font-semibold cursor-pointer rounded-full"
            >
              Sign In Now
            </Button>
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-6 shadow-xs">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "inProgress" && <BookOpen className="w-7 h-7" />}
              {activeTab === "bookmarked" && <Bookmark className="w-7 h-7" />}
              {activeTab === "liked" && <Heart className="w-7 h-7" />}
              {activeTab === "completed" && <CheckCircle2 className="w-7 h-7" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === "inProgress" && "No works in progress"}
              {activeTab === "bookmarked" && "No saved bookmarks yet"}
              {activeTab === "liked" && "No liked works yet"}
              {activeTab === "completed" && "No completed works yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
              {activeTab === "inProgress" &&
                "Start reading articles and stories or exploring works, and your progress will automatically show up here."}
              {activeTab === "bookmarked" &&
                "Click the bookmark icon on any article, painting, or story to save it to your personal collection."}
              {activeTab === "liked" &&
                "Show appreciation for articles, paintings, and creative works by liking them to view them here later."}
              {activeTab === "completed" &&
                "Finish reading stories and articles completely to add them to your completed collection."}
            </p>
            <Link href="/works">
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="rounded-full"
              >
                Explore Works Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((item) => {
                const targetSlugOrId = item.slug || item.storyId || item.id;
                const percent = item.progressPercent || 0;
                const submissionType = (
                  item.submissionType || "STORY"
                ).toUpperCase();
                const isPainting = submissionType === "PAINTING";
                const isVideo = submissionType === "VIDEO";

                const imageSource =
                  item.coverImageUrl ||
                  item.mediaUrl ||
                  "/images/stories/ramachi.jpg";

                return (
                  <div
                    key={item.id || item.storyId}
                    className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-400 transition-all duration-200 group shadow-2xs hover:shadow-xs"
                  >
                    <div>
                      {/* Media Cover Image & Type Badges */}
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-4">
                        <Image
                          src={imageSource}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Video Play Overlay Indicator */}
                        {isVideo && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none group-hover:bg-black/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}

                        {/* Badges: Category */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          {/* Video & Painting type labels commented out
                          {isPainting && (
                            <span className="bg-purple-700 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                              <Palette className="w-2.5 h-2.5" />
                              Painting
                            </span>
                          )}
                          {isVideo && (
                            <span className="bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                              <Video className="w-2.5 h-2.5" />
                              Video
                            </span>
                          )}
                          */}

                          {/* Category badge shows for all cards */}
                          <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                            <BookOpen className="w-2.5 h-2.5" />
                            {(item.category || "Story").toUpperCase()}
                          </span>
                        </div>

                        {/* Remove Bookmark Action */}
                        {activeTab === "bookmarked" && (
                          <button
                            onClick={(e) =>
                              handleRemoveBookmark(item.storyId || item.id, e)
                            }
                            title="Remove bookmark"
                            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Progress Bar (For Reading Stories / In Progress) */}
                      {!isPainting &&
                        (activeTab === "inProgress" ||
                          activeTab === "completed" ||
                          item.progressPercent !== undefined) && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {item.isCompleted || percent >= 95
                                  ? "Completed"
                                  : `${percent}% Read`}
                              </span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                {item.lastReadAt
                                  ? new Date(
                                      item.lastReadAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percent >= 90 ? "bg-emerald-500" : "bg-black"
                                }`}
                                style={{
                                  width: `${Math.max(5, Math.min(100, percent))}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                      {/* Work Title & Creator */}
                      <h3 className="text-base font-bold text-gray-950 leading-snug line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
                        {isPainting ? (
                          <Palette className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">
                          By {item.authorName || item.authorEmail || "Unknown Creator"}
                        </span>
                      </p>
                    </div>

                    {/* Date & Action CTA */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {item.savedAt
                          ? `Saved ${new Date(item.savedAt).toLocaleDateString()}`
                          : item.likedAt
                          ? `Liked ${new Date(item.likedAt).toLocaleDateString()}`
                          : "AKAM Digital"}
                      </span>

                      <Link href={`/works/${targetSlugOrId}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={
                            isPainting ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : isVideo ? (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )
                          }
                          iconPosition="right"
                          className="text-xs font-semibold py-1.5 px-3.5 shadow-xs cursor-pointer rounded-full"
                        >
                          {isPainting
                            ? "View Artwork"
                            : isVideo
                            ? "Watch Video"
                            : activeTab === "inProgress"
                            ? "Continue"
                            : "Read Work"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="h-6 w-full" />

            {/* Loading More Spinner */}
            {loadingMore && (
              <div className="py-8 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span className="text-xs text-gray-500 font-medium">
                  Loading more works...
                </span>
              </div>
            )}

           
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo="/library"
        onSuccess={() => {
          loadTabStories(activeTab, 1, false);
        }}
      />
    </div>
  );
}
