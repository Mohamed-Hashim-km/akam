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

export default function StoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [relatedStories, setRelatedStories] = useState<StoryDetail[]>([]);
  const [carouselTitle] = useState<string>("More Stories to Explore");
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
          setError("Story not found");
        }
      } catch (err) {
        console.error("Failed to load story details", err);
        setError("Error loading story");
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
          No narrative content available for this story.
        </p>
      );
    }

    const sanitized = contentStr.replace(/\r\n/g, "\n");

    let processedContent = sanitized.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" />'
    );

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

    if (parts.length === 0) parts.push({ type: "text", value: sanitized });

    return (
      <div className="space-y-4">
        {parts.map((part, idx) => {
          if (part.type === "text") {
            const isHtml = /<[a-z][\s\S]*>/i.test(part.value);
            if (isHtml) {
              return (
                <div
                  key={idx}
                  className="prose prose-lg max-w-none text-gray-900 leading-relaxed font-normal [&_p]:mb-4 [&_p]:text-[#1A1A1A] [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_a]:hover:text-emerald-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl"
                  dangerouslySetInnerHTML={{ __html: part.value }}
                />
              );
            }

            let formattedText = part.value.replace(/&nbsp;/gi, " ");
            formattedText = formattedText.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold my-3 text-gray-900">$1</h3>');
            formattedText = formattedText.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold my-4 text-gray-950">$1</h2>');
            formattedText = formattedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>');
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');
            formattedText = formattedText.replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">$1</blockquote>');
            formattedText = formattedText.replace(/\*\*/g, "");

            const lines = formattedText.replace(/\r\n/g, "\n").split("\n");
            const renderedElements: React.ReactNode[] = [];
            let currentLines: string[] = [];

            const flush = (key: string) => {
              if (currentLines.length > 0) {
                const text = currentLines.join("<br>");
                if (text.trim()) {
                  const containsInlineHtml = /<[a-z][\s\S]*>/i.test(text);
                  if (containsInlineHtml) {
                    renderedElements.push(
                      <div
                        key={key}
                        className="text-gray-900 text-base sm:text-lg leading-relaxed font-normal mb-4 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_a]:hover:text-emerald-900 [&_b]:font-bold [&_strong]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
                        dangerouslySetInnerHTML={{ __html: text }}
                      />
                    );
                  } else {
                    renderedElements.push(
                      <p
                        key={key}
                        className="text-gray-900 text-base sm:text-lg leading-relaxed font-normal whitespace-pre-wrap tracking-normal mb-4"
                      >
                        {text}
                      </p>
                    );
                  }
                }
                currentLines = [];
              }
            };

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              if (!trimmed) {
                flush(`flush-${i}`);
                renderedElements.push(<p key={`empty-${i}`} className="mb-4"><br /></p>);
                continue;
              }
              if (
                trimmed.startsWith("<h2") ||
                trimmed.startsWith("<h3") ||
                trimmed.startsWith("<blockquote") ||
                trimmed.startsWith("<ul") ||
                trimmed.startsWith("<ol") ||
                trimmed.startsWith("<div")
              ) {
                flush(`flush-${i}`);
                renderedElements.push(
                  <div key={`block-${i}`} dangerouslySetInnerHTML={{ __html: trimmed }} />
                );
                continue;
              }
              currentLines.push(trimmed);
            }
            flush("flush-end");

            return <div key={idx} className="space-y-4">{renderedElements}</div>;
          } else {
            return (
              <div key={idx} className="my-6 sm:my-8 flex justify-center">
                <img
                  src={part.src}
                  alt={part.alt}
                  className="w-full max-w-3xl h-auto max-h-[500px] object-cover rounded-2xl"
                />
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
          <p className="text-gray-900 text-sm font-semibold tracking-wider">Loading Story...</p>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h1>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          The requested story may have been removed or is unavailable.
        </p>
        <Link href="/stories">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4 ml-1" />} iconPosition="left">
            Back to Stories
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
          <Link href="/stories">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
              className="border border-gray-300 shadow-xs cursor-pointer"
            >
              All Stories
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {/* Report Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Flag className="w-4 h-4" />}
              iconPosition="left"
              onClick={() => {
                if (!user) setAuthModalOpen(true);
                else setReportModalOpen(true);
              }}
              className="border border-gray-300 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 shadow-xs cursor-pointer"
            >
              Report
            </Button>

            {/* Share Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              iconPosition="left"
              onClick={handleShare}
              className="border border-gray-300 shadow-xs cursor-pointer"
            >
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Story Narrative */}
      <article className="container max-w-4xl px-4 mx-auto pt-10">
        {/* Header Metadata */}
        <div className="mb-8">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-xl inline-block mb-4 shadow-xs">
            {(story.category || "Fiction").toUpperCase()}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 tracking-tight leading-tight mb-6">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-gray-200 py-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {story.authorAvatarUrl ? (
                  <Image src={story.authorAvatarUrl} alt="Author Avatar" fill unoptimized className="object-cover" />
                ) : (
                  <span>{(story.authorName || story.authorEmail || "A")[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{story.authorName || story.authorEmail || "Unknown Author"}</h4>
                <p className="text-xs text-gray-500">{story.authorBio || "Author on AKAM Digital"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{new Date(story.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Interactive Action Bar (Like, Bookmark, Comments count) */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 mt-6">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Like Button */}
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isLiked
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
                <span>{likeCount}</span>
              </button>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmarkToggle}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-50 text-amber-700 border border-amber-300"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-600 text-amber-600" : ""}`} />
                <span>{isBookmarked ? "Saved" : "Bookmark"}</span>
              </button>

              {/* Comments Anchor */}
              <a
                href="#comments-section"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span>{commentCount} Comments</span>
              </a>
            </div>

            <Link href="/library" className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-black">
              View Library <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Story Body Narrative Container */}
        <div ref={storyContentRef} className="py-8 my-2">
          {renderStoryBody(story.content)}
        </div>

        {/* Standard Comments Section */}
        <section id="comments-section" className="border-t border-gray-200 pt-10 mt-12">
          <div className="flex items-center justify-between pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-gray-900" />
              <h3 className="text-xl font-bold text-gray-950">
                Comments ({commentCount})
              </h3>
            </div>
          </div>

          {/* Comment Submission Form */}
          <form onSubmit={handlePostComment} className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-3 focus-within:border-gray-400 transition-all">
              <textarea
                rows={3}
                placeholder={user ? "Write your comment or reaction..." : "Sign in to join the discussion..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onClick={() => {
                  if (!user) setAuthModalOpen(true);
                }}
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="text-[11px] text-gray-400">
                  {user ? `Commenting as ${user.name || user.email}` : "Authentication required"}
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingComment || !newComment.trim()}
                  icon={<Send className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  className="px-4 py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No comments yet. Be the first to share your thoughts on this story!
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = user && user.id === comment.userId;
                const canDelete = isCommentAuthor || (user && ["EDITOR", "ADMIN"].includes(user.role));

                return (
                  <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-white border border-gray-200">
                    <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {comment.userAvatarUrl ? (
                        <Image src={comment.userAvatarUrl} alt="Avatar" width={36} height={36} unoptimized className="object-cover" />
                      ) : (
                        <span>{(comment.userName || comment.userEmail || "U")[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-gray-900 text-sm">{comment.userName || comment.userEmail}</h5>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isCommentAuthor && (
                            <button
                              onClick={() => {
                                if (!user) setAuthModalOpen(true);
                                else {
                                  setReportingCommentId(comment.id);
                                  setReportModalOpen(true);
                                }
                              }}
                              title="Report comment"
                              className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              title="Delete comment"
                              className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </article>

      {/* Full-Width Carousel Section for Recommended Stories */}
      {relatedStories.length > 0 && (
        <section className="w-full bg-white py-14 lg:py-20 border-t border-gray-200 mt-16 font-poppins overflow-hidden">
          <div className="container mx-auto px-4 ">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
                  {carouselTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Discover more published Malayalam prose & narratives
                </p>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => swiperInstance?.slidePrev()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                  aria-label="Previous Story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => swiperInstance?.slideNext()}
                  className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                  aria-label="Next Story"
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
                    href={`/stories/${otherStory.slug || otherStory.id}`}
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
                          Read Story <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-1" />
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
              <form onSubmit={handleSubmitReport}>
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <Flag className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Content Moderation</span>
                </div>

                <h3 className="text-xl font-bold text-gray-950 mb-1">
                  {reportingCommentId ? "Report Comment" : "Report Story"}
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  {reportingCommentId
                    ? "Flag this comment for editorial review if it contains inappropriate content, harassment, or spam."
                    : `Flag "${story?.title}" for editorial review if it violates platform rules or copyright.`}
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Reason for Report</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-black"
                    >
                      <option value="INAPPROPRIATE">Inappropriate or Offensive Content</option>
                      <option value="COPYRIGHT">Copyright or Plagiarism Violation</option>
                      <option value="SPAM">Spam or Misleading Title</option>
                      <option value="HARASSMENT">Harassment or Hate Speech</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Additional Details (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Provide additional details or context to help our editors..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-xl p-3 outline-none focus:border-black resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setReportModalOpen(false)}
                    className="px-5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submittingReport}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReport ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={`/stories/${story.id}`}
        onSuccess={(u) => {
          setUser(u);
          fetchEngagement(story.id);
        }}
      />
    </div>
  );
}
