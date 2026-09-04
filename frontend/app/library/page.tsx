"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  Trash2,
  Lock,
  ChevronDown,
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

interface LibraryData {
  inProgress: LibraryStory[];
  bookmarked: LibraryStory[];
  liked: LibraryStory[];
  completed: LibraryStory[];
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("akam_library_tab", tab);
    }
  };
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchLibraryData = async () => {
    // 1. Instantly load user from localStorage for instant zero-latency UI header
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

    // 2. Fetch library directly in a single fast HTTP request
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/me/library`);
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      } else if (res.status === 401) {
        setUser(null);
        setLibrary(null);
      }
    } catch (e) {
      console.error("Failed to fetch library", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
    window.addEventListener("akam_user_updated", fetchLibraryData);
    return () => {
      window.removeEventListener("akam_user_updated", fetchLibraryData);
    };
  }, []);

  const handleRemoveBookmark = async (storyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/bookmark`, {
        method: "POST",
      });
      if (res.ok) {
        setLibrary((prev) =>
          prev
            ? {
                ...prev,
                bookmarked: prev.bookmarked.filter((s) => s.storyId !== storyId && s.id !== storyId),
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to remove bookmark", err);
    }
  };

  const getStoriesForTab = (): LibraryStory[] => {
    if (!library) return [];
    switch (activeTab) {
      case "inProgress":
        return library.inProgress || [];
      case "bookmarked":
        return library.bookmarked || [];
      case "liked":
        return library.liked || [];
      case "completed":
        return library.completed || [];
      default:
        return [];
    }
  };

  const currentStories = getStoriesForTab();

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col pb-16">
      {/* Header Banner */}
      <section className="bg-white border-b border-gray-200 py-8 sm:py-12">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
                My Story Library
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1.5 max-w-xl">
                Track reading progress, revisit your bookmarked narratives, and manage your liked stories.
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
                      Continue Reading ({library?.inProgress.length || 0})
                    </option>
                    <option value="bookmarked">
                      Saved & Bookmarked ({library?.bookmarked.length || 0})
                    </option>
                    <option value="liked">
                      Liked Stories ({library?.liked.length || 0})
                    </option>
                    <option value="completed">
                      Completed ({library?.completed.length || 0})
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Desktop Button Row (>= sm screens) */}
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 ">
                <Button
                  variant={activeTab === "inProgress" ? "primary" : "secondary"}
                  size="sm"
                  icon={<BookOpen className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => handleTabChange("inProgress")}
                  className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Continue Reading
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "inProgress" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {library?.inProgress.length || 0}
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
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "bookmarked" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {library?.bookmarked.length || 0}
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
                  Liked Stories
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "liked" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {library?.liked.length || 0}
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
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "completed" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {library?.completed.length || 0}
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
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-950 mb-2">Sign in to Access Library</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to save your favorite Malayalam stories, track reading progress, and bookmark narrative pieces.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setAuthModalOpen(true)}
              className="px-8 py-2.5 text-sm font-semibold cursor-pointer"
            >
              Sign In Now
            </Button>
          </div>
        ) : currentStories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-6">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "inProgress" && <BookOpen className="w-7 h-7" />}
              {activeTab === "bookmarked" && <Bookmark className="w-7 h-7" />}
              {activeTab === "liked" && <Heart className="w-7 h-7" />}
              {activeTab === "completed" && <CheckCircle2 className="w-7 h-7" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === "inProgress" && "No stories in progress"}
              {activeTab === "bookmarked" && "No saved bookmarks yet"}
              {activeTab === "liked" && "No liked stories yet"}
              {activeTab === "completed" && "No completed stories yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto">
              {activeTab === "inProgress" && "Start reading stories and your progress will automatically show up here."}
              {activeTab === "bookmarked" && "Click the bookmark icon on any story to save it to your personal reading list."}
              {activeTab === "liked" && "Show appreciation for stories by liking them to view them here later."}
              {activeTab === "completed" && "Finish reading stories completely to add them to your completed bookshelf."}
            </p>
            <Link href="/stories">
              <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Explore Stories Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentStories.map((item) => {
              const targetSlugOrId = item.slug || item.storyId || item.id;
              const percent = item.progressPercent || 0;

              return (
                <div
                  key={item.id || item.storyId}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-400 transition-all duration-200 group"
                >
                  <div>
                    {/* Story Cover Image & Category Badge */}
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-4">
                      <Image
                        src={item.coverImageUrl || "/images/stories/ramachi.jpg"}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
                        <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg">
                          {(item.category || "Fiction").toUpperCase()}
                        </span>
                      </div>

                      {activeTab === "bookmarked" && (
                        <button
                          onClick={(e) => handleRemoveBookmark(item.storyId || item.id, e)}
                          title="Remove bookmark"
                          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Progress Bar (For In Progress / History) */}
                    {(activeTab === "inProgress" || activeTab === "completed" || item.progressPercent !== undefined) && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {item.isCompleted || percent >= 95 ? "Completed" : `${percent}% Read`}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {item.lastReadAt
                              ? new Date(item.lastReadAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : ""}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              percent >= 90 ? "bg-emerald-500" : "bg-black"
                            }`}
                            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Story Title & Author */}
                    <h3 className="text-base font-bold text-gray-950 leading-snug line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">By {item.authorName || item.authorEmail || "Unknown Author"}</span>
                    </p>
                  </div>

                  {/* Read / Action CTA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {item.savedAt
                        ? `Saved ${new Date(item.savedAt).toLocaleDateString()}`
                        : item.likedAt
                        ? `Liked ${new Date(item.likedAt).toLocaleDateString()}`
                        : "AKAM Digital"}
                    </span>

                    <Link href={`/stories/${targetSlugOrId}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                        className="text-xs font-semibold py-1.5 px-3.5 shadow-xs cursor-pointer"
                      >
                        {activeTab === "inProgress" ? "Continue" : "Read Story"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo="/library"
        onSuccess={() => {
          fetchLibraryData();
        }}
      />
    </div>
  );
}
