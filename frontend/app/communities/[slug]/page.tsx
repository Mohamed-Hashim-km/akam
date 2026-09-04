"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Pin,
  Lock,
  Plus,
  Flame,
  Sparkles,
  TrendingUp,
  Users,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
import CreatePostModal from "@/components/CreatePostModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

// ── Types ────────────────────────────────────────────────────────────────────
interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
}

interface Post {
  id: string;
  title: string;
  body: string | null;
  flair: string;
  status: string;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  myVote: "UP" | "DOWN" | null;
}

type SortMode = "hot" | "new" | "top";

// ── Helpers ──────────────────────────────────────────────────────────────────
const flairColors: Record<string, string> = {
  DISCUSSION: "bg-blue-100 text-blue-700",
  QUESTION: "bg-purple-100 text-purple-700",
  ANNOUNCEMENT: "bg-red-100 text-red-700",
  RESOURCE: "bg-emerald-100 text-emerald-700",
  FEEDBACK: "bg-amber-100 text-amber-700",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState<SortMode>("hot");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check auth user
  const getUser = () => {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem("akam_user");
    return u ? JSON.parse(u) : null;
  };

  // ── Fetch community info ─────────────────────────────────────────────────
  const fetchCommunity = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/communities/${slug}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) { setError("Community not found"); return; }
      const data = await res.json();
      setCommunity(data);
    } catch {
      setError("Failed to load community");
    }
  }, [slug]);

  // ── Fetch posts ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(
    async (sortMode: SortMode, pageNum: number, replace = false) => {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      try {
        const res = await apiFetch(
          `${API_BASE_URL}/communities/${slug}/posts?sort=${sortMode}&page=${pageNum}&limit=15`,
          { next: { revalidate: 60 } }
        );
        if (!res.ok) throw new Error("Failed to load posts");
        const json = await res.json();
        setPosts((prev) => (replace || pageNum === 1 ? json.data : [...prev, ...json.data]));
        setTotalPages(json.meta?.totalPages ?? 1);
      } catch (err) {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [slug]
  );

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setPosts([]);
    setError(null);
    fetchCommunity();
    fetchPosts(sort, 1, true);
  }, [slug, sort]);

  // ── Infinite scroll sentinel ─────────────────────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (page >= totalPages || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const next = page + 1;
          setPage(next);
          fetchPosts(sort, next);
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [page, totalPages, loadingMore, sort, fetchPosts]);

  // ── Join / Leave ─────────────────────────────────────────────────────────
  const handleMembership = async () => {
    const user = getUser();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!community) return;

    setMemberLoading(true);
    try {
      const endpoint = community.isMember
        ? `${API_BASE_URL}/communities/${slug}/leave`
        : `${API_BASE_URL}/communities/${slug}/join`;
      const method = community.isMember ? "DELETE" : "POST";
      const res = await apiFetch(endpoint, { method });
      if (res.ok) {
        const json = await res.json();
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                isMember: !prev.isMember,
                memberCount: json.memberCount ?? prev.memberCount,
              }
            : prev
        );
      }
    } finally {
      setMemberLoading(false);
    }
  };

  // ── Vote on post ─────────────────────────────────────────────────────────
  const handleVote = async (postId: string, value: "UP" | "DOWN") => {
    const user = getUser();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const res = await apiFetch(`${API_BASE_URL}/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const json = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                upvotes: json.upvotes,
                downvotes: json.downvotes,
                score: json.score,
                myVote: json.voted ? value : null,
              }
            : p
        )
      );
    }
  };

  const communityColor = community?.color ?? "#29ABE1";

  // ── Render ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins">
        <div className="text-center">
          <p className="text-2xl font-semibold text-dark-text mb-2">{error}</p>
          <Link href="/" className="text-sm text-blue-500 underline">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-poppins">
      {/* ── Community Banner ─────────────────────────────────────────────── */}
      <div
        className="w-full h-36 sm:h-48"
        style={{ background: `linear-gradient(135deg, ${communityColor}cc, ${communityColor}66)` }}
      />

      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* ── Community Header ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm -mt-10 mb-6 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Community avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ backgroundColor: communityColor }}
          >
            {community?.name?.[0] ?? "C"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {loading && !community ? (
                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold text-dark-text truncate">
                  {community?.name ?? slug}
                </h1>
              )}
            </div>
            {community?.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{community.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {community?.memberCount?.toLocaleString() ?? "—"} members
              </span>
              <span>{community?.postCount?.toLocaleString() ?? "—"} posts</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="community-membership-btn"
              onClick={handleMembership}
              disabled={memberLoading}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 cursor-pointer ${
                community?.isMember
                  ? "border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500"
                  : "text-white"
              }`}
              style={community?.isMember ? {} : { backgroundColor: communityColor }}
            >
              {memberLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : community?.isMember ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {community?.isMember ? "Joined" : "Join"}
            </button>

            {community?.isMember && (
              <button
                id="new-post-btn"
                onClick={() => setCreatePostModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 active:scale-95 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: communityColor }}
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            )}
          </div>
        </div>

        {/* ── Sort Tabs ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white rounded-xl px-2 py-1.5 shadow-sm mb-5 w-fit">
          {(["hot", "new", "top"] as SortMode[]).map((s) => (
            <button
              key={s}
              id={`sort-${s}`}
              onClick={() => { setSort(s); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize cursor-pointer ${
                sort === s
                  ? "bg-dark-bg text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {s === "hot" && <Flame className="w-3.5 h-3.5" />}
              {s === "new" && <Sparkles className="w-3.5 h-3.5" />}
              {s === "top" && <TrendingUp className="w-3.5 h-3.5" />}
              {s}
            </button>
          ))}
        </div>

        {/* ── Posts Feed ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-lg font-semibold text-dark-text mb-2">No posts yet</p>
            <p className="text-sm text-gray-500 mb-6">Be the first to start a conversation!</p>
            {community?.isMember && (
              <button
                onClick={() => setCreatePostModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: communityColor }}
              >
                <Plus className="w-4 h-4" /> Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                  post.isPinned ? "ring-2 ring-amber-300" : ""
                }`}
              >
                <div className="flex">
                  {/* Vote Column */}
                  <div className="flex flex-col items-center px-3 pt-4 pb-3 gap-1 bg-gray-50/60">
                    <button
                      id={`upvote-${post.id}`}
                      onClick={() => handleVote(post.id, "UP")}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        post.myVote === "UP"
                          ? "text-orange-500 bg-orange-50"
                          : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                      }`}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        post.myVote === "UP"
                          ? "text-orange-500"
                          : post.myVote === "DOWN"
                          ? "text-blue-500"
                          : "text-gray-600"
                      }`}
                    >
                      {post.score}
                    </span>
                    <button
                      id={`downvote-${post.id}`}
                      onClick={() => handleVote(post.id, "DOWN")}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        post.myVote === "DOWN"
                          ? "text-blue-500 bg-blue-50"
                          : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0 p-4 sm:p-5">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {post.flair && (
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            flairColors[post.flair] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {post.flair.charAt(0) + post.flair.slice(1).toLowerCase()}
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {post.isLocked && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {post.authorName ?? "Anonymous"} • {timeAgo(post.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <Link href={`/communities/${slug}/posts/${post.id}`}>
                      <h2 className="text-sm sm:text-base font-semibold text-dark-text hover:text-[#29ABE1] transition-colors leading-snug mb-1">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Body preview */}
                    {post.body && (
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {post.body}
                      </p>
                    )}

                    {/* Footer */}
                    <Link
                      href={`/communities/${slug}/posts/${post.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.commentCount} Comments
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {page >= totalPages && posts.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-4">You've reached the end</p>
            )}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          fetchCommunity();
          fetchPosts(sort, 1, true);
        }}
      />

      {community && (
        <CreatePostModal
          isOpen={createPostModalOpen}
          communitySlug={slug}
          communityName={community.name}
          onClose={() => setCreatePostModalOpen(false)}
          onSuccess={(newPostId) => {
            fetchCommunity();
            router.push(`/communities/${slug}/posts/${newPostId}`);
          }}
        />
      )}
    </div>
  );
}

