"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Clock,
  BookOpen,
  Share2,
  Check,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  Bookmark,
  MessageSquare,
  Flag,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

// Swiper CSS imports
import "swiper/css";
import "swiper/css/navigation";

interface StoryDetail {
  id: string;
  title: string;
  slug: string;
  content?: string;
  category?: string;
  coverImageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorName?: string | null;
  authorEmail?: string;
  authorAvatarUrl?: string | null;
  authorBio?: string | null;
}

interface CommentItem {
  id: string;
  storyId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [relatedStories, setRelatedStories] = useState<StoryDetail[]>([]);
  const [carouselTitle] = useState<string>("More Works to Explore");
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // User & Auth
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Engagement State
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reading Progress State
  const [readingProgress, setReadingProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storyContentRef = useRef<HTMLDivElement | null>(null);

  // Load user data from localStorage
  const loadUser = () => {
    const savedUser = localStorage.getItem("akam_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("akam_user_updated", loadUser);
    return () => {
      window.removeEventListener("akam_user_updated", loadUser);
    };
  }, []);

  // Fetch story detail and related data
  useEffect(() => {
    if (!id) return;

    const fetchStoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`${API_BASE_URL}/stories/${id}`);
        if (res.ok) {
          const data: StoryDetail = await res.json();
          setStory(data);

          // Fetch engagement status
          fetchEngagement(data.id);
          // Fetch comments
          fetchComments(data.id);

          // Fetch catalog for related stories
          const catalogRes = await apiFetch(`${API_BASE_URL}/stories?status=APPROVED&limit=10`);
          if (catalogRes.ok) {
            const json = await catalogRes.json();
            const items: StoryDetail[] = json.data || (Array.isArray(json) ? json : []);
            setRelatedStories(items.filter((s) => s.id !== data.id));
          }
        } else {
          setError("Work not found");
        }
      } catch (err) {
        console.error("Failed to load work details", err);
        setError("Error loading work");
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [id]);

  const fetchEngagement = async (storyId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/engagement`);
      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.likeCount || 0);
        setCommentCount(data.commentCount || 0);
        setIsLiked(!!data.isLiked);
        setIsBookmarked(!!data.isBookmarked);
      }
    } catch (e) {
      console.error("Failed to fetch engagement stats", e);
    }
  };

  const fetchComments = async (storyId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Failed to fetch comments", e);
    }
  };

  // Section-based scroll tracker for story narrative reading progress
  useEffect(() => {
    if (!story) return;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      let percent = 0;

      if (storyContentRef.current) {
        const rect = storyContentRef.current.getBoundingClientRect();
        const elementTop = rect.top + currentScroll;
        const elementHeight = storyContentRef.current.offsetHeight;
        const windowHeight = window.innerHeight;

        // Calculate progress through the story content block only
        const scrolled = (currentScroll + windowHeight) - elementTop;
        if (elementHeight > 0) {
          percent = Math.min(100, Math.max(0, Math.round((scrolled / elementHeight) * 100)));
        }
      } else {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          percent = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
        }
      }

      setReadingProgress(percent);

      // Debounce API update if user is logged in
      const isLoggedIn = user || (typeof window !== "undefined" && localStorage.getItem("akam_user"));
      if (isLoggedIn && percent > 5) {
        if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
        progressTimerRef.current = setTimeout(async () => {
          try {
            await apiFetch(`${API_BASE_URL}/stories/${story.id}/progress`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                progressPercent: percent,
                lastScrollPosition: Math.round(currentScroll),
                isCompleted: percent >= 90,
              }),
            });
          } catch (e) {
            console.error("Failed to record reading progress", e);
          }
        }, 1000);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [story, user]);

  // Handlers for engagement actions
  const handleLikeToggle = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!story) return;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${story.id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        fetchEngagement(story.id);
      }
    } catch (e) {
      console.error(e);
      fetchEngagement(story.id);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!story) return;

    setIsBookmarked(!isBookmarked);

    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${story.id}/bookmark`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
      } else {
        fetchEngagement(story.id);
      }
    } catch (e) {
      console.error(e);
      fetchEngagement(story.id);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!story) return;

    setSubmittingComment(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${story.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const addedComment = await res.json();
        setComments((prev) => [addedComment, ...prev]);
        setCommentCount((prev) => prev + 1);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setSubmittingReport(true);
    try {
      const endpoint = reportingCommentId
        ? `${API_BASE_URL}/stories/comments/${reportingCommentId}/report`
        : `${API_BASE_URL}/stories/${story?.id}/report`;

      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportSuccess(false);
          setReportModalOpen(false);
          setReportDetails("");
          setReportingCommentId(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to submit report", err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const renderStoryBody = (contentStr?: string) => {
    if (!contentStr || !contentStr.trim()) {
      return (
        <p className="text-gray-400 italic py-8 text-center">
          No narrative content available for this work.
        </p>
      );
    }

    // Markdown -> HTML inline converter
    const mdToHtml = (md: string): string => {
      let h = md.replace(/&nbsp;/gi, " ");
      // Headings
      h = h.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold my-4 text-gray-900">$1</h3>');
      h = h.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold my-5 text-gray-950">$1</h2>');
      // Bold / Italic
      h = h.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
      h = h.replace(/__(.*?)__/g, "<b>$1</b>");
      h = h.replace(/\*(.*?)\*/g, "<i>$1</i>");
      // Blockquote
      h = h.replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">$1</blockquote>');
      // Links
      h = h.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>');
      // Lists
      h = h.replace(/^[\*\-]\s+(.*)$/gm, '<li class="ml-5 list-disc mb-1 text-gray-900">$1</li>');
      h = h.replace(/^(\d+)\.\s+(.*)$/gm, '<li class="ml-5 list-decimal mb-1 text-gray-900">$2</li>');
      // Strip leftover ** markers
      h = h.replace(/\*\*/g, "");
      return h;
    };

    // Split at image boundaries
    const withImgs = contentStr.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(withImgs)) !== null) {
      if (match.index > lastIndex) {
        const chunk = withImgs.substring(lastIndex, match.index);
        if (chunk.trim()) parts.push({ type: "text", value: chunk });
      }
      const src = match[1];
      if (src) parts.push({ type: "image", src, alt: "Work Inline Image" });
      lastIndex = imgRegex.lastIndex;
    }
    if (lastIndex < withImgs.length) {
      const chunk = withImgs.substring(lastIndex);
      if (chunk.trim()) parts.push({ type: "text", value: chunk });
    }
    if (parts.length === 0) parts.push({ type: "text", value: contentStr });

    // Render
    return (
      <div className="space-y-0">
        {parts.map((part, idx) => {
          if (part.type === "image") {
            return (
              <div key={idx} className="my-8 sm:my-10 flex justify-center">
                <img
                  src={part.src}
                  alt={part.alt}
                  className="w-full max-w-3xl h-auto max-h-[500px] object-cover rounded-2xl shadow-xs"
                />
              </div>
            );
          }

          // Text — line-by-line: first blank = paragraph end, extra blanks = section gap
          const lines = part.value.replace(/\r\n/g, "\n").split("\n");
          const blocks: React.ReactNode[] = [];
          let paraLines: string[] = [];

          const flushPara = (key: string) => {
            if (paraLines.length > 0) {
              const combined = paraLines.join("<br />");
              if (combined.trim()) {
                blocks.push(
                  <div
                    key={key}
                    className="text-[#1A1A1A] text-base sm:text-lg leading-[1.9] mb-6 font-normal [&_b]:font-bold [&_i]:italic [&_a]:text-emerald-700 [&_a]:underline [&_a]:hover:text-emerald-900 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-5 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-4 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl [&_li]:ml-5 [&_li]:list-disc [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(combined) }}
                  />
                );
              }
              paraLines = [];
            }
          };

          lines.forEach((line, li) => {
            if (line.trim() === "") {
              if (paraLines.length > 0) {
                flushPara(`${idx}-p-${li}`);
              } else {
                blocks.push(
                  <div key={`${idx}-gap-${li}`} className="mb-10 select-none" aria-hidden="true" />
                );
              }
            } else {
              paraLines.push(line);
            }
          });
          flushPara(`${idx}-p-end`);

          return <div key={idx}>{blocks}</div>;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
          <p className="text-gray-900 text-sm font-semibold tracking-wider">Loading Work...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Work Not Found</h1>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          The requested work may have been removed or is unavailable.
        </p>
        <Link href="/works">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4 ml-1" />} iconPosition="left">
            Back to All Works
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins relative">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-emerald-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Header Navigation */}
      <div className="bg-white border-b border-gray-200 py-4 sticky top-1 z-30 shadow-xs">
        <div className="container px-4 mx-auto flex items-center justify-between">
          <Link href="/works">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
              className="border border-gray-300 shadow-xs cursor-pointer"
            >
              All Works
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {/* Report Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Flag className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />}
              onClick={() => {
                setReportingCommentId(null);
                setReportModalOpen(true);
              }}
              className="text-gray-500 hover:text-red-500 cursor-pointer text-xs"
            >
              <span className="hidden sm:inline">Report</span>
            </Button>

            {/* Share Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              iconPosition="left"
              onClick={handleShare}
              className="border border-gray-300 shadow-xs cursor-pointer text-xs"
            >
              {copied ? "Link Copied!" : "Share"}
            </Button>
          </div>
        </div>
      </div>

      {/* Story Main Reader Content */}
      <main className="container max-w-4xl px-4 mx-auto py-10 sm:py-16">
        <article>
          {/* Header Metadata Section */}
          <header className="mb-10 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs inline-block">
                {(story.category || "Fiction").toUpperCase()}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 tracking-tight leading-[1.2] mb-6">
              {story.title}
            </h1>

            {/* Author Byline & Metadata Card */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden relative shadow-xs shrink-0">
                {story.authorAvatarUrl ? (
                  <Image
                    src={story.authorAvatarUrl}
                    alt={story.authorName || "Author"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-700 font-bold text-sm">
                    {(story.authorName || story.authorEmail || "A").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {story.authorName || story.authorEmail || "Unknown Author"}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>~{Math.max(1, Math.ceil((story.content?.split(/\s+/).length || 0) / 200))} min read</span>
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Cover Image */}
          {story.coverImageUrl && (
            <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-[32px] overflow-hidden mb-12 bg-gray-100 border border-gray-200 shadow-md">
              <Image
                src={story.coverImageUrl}
                alt={story.title}
                fill
                priority
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          {/* Narrative Body Text */}
          <div ref={storyContentRef} className="max-w-2xl mx-auto font-serif">
            {renderStoryBody(story.content)}
          </div>

          {/* Social Engagement Floating Pill Bar */}
          <div className="max-w-2xl mx-auto mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-3">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isLiked
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : "text-gray-500"}`} />
                  <span>{likeCount}</span>
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isBookmarked
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-emerald-500 text-emerald-500" : "text-gray-500"}`} />
                  <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="#comments-section"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>{commentCount}</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Author Card Footer */}
          {story.authorBio && (
            <div className="max-w-2xl mx-auto mt-10 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex items-start gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden relative shadow-xs shrink-0">
                {story.authorAvatarUrl ? (
                  <Image
                    src={story.authorAvatarUrl}
                    alt={story.authorName || "Author"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-700 font-bold text-lg">
                    {(story.authorName || story.authorEmail || "A").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-950">Written by {story.authorName || story.authorEmail}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{story.authorBio}</p>
              </div>
            </div>
          )}

          {/* Reader Discussion / Comments Section */}
          <section id="comments-section" className="max-w-2xl mx-auto mt-14 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <span>Discussion ({commentCount})</span>
              </h2>
            </div>

            {/* Post comment input box */}
            <form onSubmit={handlePostComment} className="mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs focus-within:border-gray-400 transition-colors">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? "Join the conversation... share your literary insights." : "Sign in to leave a comment on this work..."}
                  rows={3}
                  className="w-full text-sm text-gray-900 placeholder-gray-400 resize-none outline-none font-sans"
                />
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                  <span className="text-[11px] text-gray-400">Respectful literary discussion is welcomed.</span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submittingComment}
                    disabled={!newComment.trim()}
                    icon={<Send className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    className="text-xs shadow-xs"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
                  No comments yet. Be the first to share your thoughts on this work!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-2xl p-4.5 shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
                          {comment.userAvatarUrl ? (
                            <Image src={comment.userAvatarUrl} alt={comment.userName || "Reader"} fill unoptimized className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-700 font-bold text-xs">
                              {(comment.userName || comment.userEmail || "R").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {comment.userName || comment.userEmail.split("@")[0]}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* If user is comment owner, allow delete */}
                        {user && user.id === comment.userId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-gray-50"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Report Comment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setReportingCommentId(comment.id);
                            setReportModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-gray-50"
                          title="Report comment"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap pl-10">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </article>
      </main>

      {/* Related Works Swiper Section */}
      {relatedStories.length > 0 && (
        <section className="bg-white border-t border-gray-200 py-16 mt-16 overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400 block mb-1">
                  Keep Exploring
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-950">
                  {carouselTitle}
                </h3>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                  aria-label="Previous Work"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => swiperInstance?.slideNext()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                  aria-label="Next Work"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Swiper
              modules={[Navigation]}
              onSwiper={setSwiperInstance}
              spaceBetween={24}
              slidesPerView={1.2}
              breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 24 },
                768: { slidesPerView: 3.2, spaceBetween: 24 },
                1024: { slidesPerView: 4.2, spaceBetween: 28 },
              }}
              className="w-full !pb-4 overflow-visible"
            >
              {relatedStories.map((otherStory) => (
                <SwiperSlide key={otherStory.id} className="h-auto">
                  <Link
                    href={`/works/${otherStory.slug || otherStory.id}`}
                    className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group/card cursor-pointer shadow-xs"
                  >
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-xs">
                      <Image
                        src={otherStory.coverImageUrl || "/images/stories/ramachi.jpg"}
                        alt={otherStory.title}
                        fill
                        unoptimized
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs">
                          {(otherStory.category || "Fiction").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight leading-snug line-clamp-2 group-hover/card:text-gray-700 transition-colors">
                          {otherStory.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">By {otherStory.authorName || otherStory.authorEmail || "Unknown Author"}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end text-xs">
                        <span className="font-bold text-[11px] text-gray-900 group-hover/card:text-black flex items-center gap-1">
                          Explore Work <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Content Moderation Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-poppins animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setReportModalOpen(false);
                setReportingCommentId(null);
              }}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {reportSuccess ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">Report Submitted</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Thank you for keeping our platform safe. Our editorial team will review this report shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-950">
                    {reportingCommentId ? "Report Comment" : "Report Work"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Help us maintain high editorial and community standards.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-black"
                  >
                    <option value="INAPPROPRIATE">Inappropriate Content</option>
                    <option value="SPAM">Spam or Misleading</option>
                    <option value="COPYRIGHT">Copyright or Plagiarism</option>
                    <option value="HARASSMENT">Harassment or Hate Speech</option>
                    <option value="OTHER">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Additional Details (Optional)</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for the editorial review team..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 resize-none outline-none focus:border-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReportModalOpen(false);
                      setReportingCommentId(null);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submittingReport}
                    className="text-xs shadow-xs"
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal for Unauthenticated Readers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={`/works/${story.id}`}
        onSuccess={(u) => {
          setUser(u);
          fetchEngagement(story.id);
        }}
      />
    </div>
  );
}
