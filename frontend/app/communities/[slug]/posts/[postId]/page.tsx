"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Pin,
  Lock,
  CornerDownRight,
  Send,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  User,
  CheckCircle2,
  Tag,
  Trash2,
  Flag,
  X,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

// ── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  flair: string;
  status: string;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  myVote: "UP" | "DOWN" | null;
}

interface CommentNode {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  body: string;
  depth: number;
  upvotes: number;
  downvotes: number;
  score: number;
  isRemoved: boolean;
  createdAt: string;
  replies: CommentNode[];
  myVote?: "UP" | "DOWN" | null;
}

const flairColors: Record<string, string> = {
  DISCUSSION: "bg-blue-50 text-blue-700 border-blue-200",
  QUESTION: "bg-purple-50 text-purple-700 border-purple-200",
  ANNOUNCEMENT: "bg-red-50 text-red-700 border-red-200",
  RESOURCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FEEDBACK: "bg-amber-50 text-amber-700 border-amber-200",
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

function countTotalComments(nodes: CommentNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.replies && node.replies.length > 0) {
      total += countTotalComments(node.replies);
    }
  }
  return total;
}

function getImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ── Standard Comment Item Component ──────────────────────────────────────────
function CommentItem({
  comment,
  postId,
  isLocked,
  user,
  onReplyAdded,
  onVote,
  onDelete,
  onReport,
  onAuthRequired,
}: {
  comment: CommentNode;
  postId: string;
  isLocked: boolean;
  user: any;
  onReplyAdded: () => void;
  onVote: (commentId: string, value: "UP" | "DOWN") => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onAuthRequired: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim(), parentId: comment.id }),
      });
      if (res.status === 401) {
        onAuthRequired();
        return;
      }
      if (res.ok) {
        setReplyText("");
        setReplying(false);
        onReplyAdded();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const authorLetter = (comment.authorName || "A")[0].toUpperCase();
  const isCommentAuthor = user && user.id === comment.authorId;
  const canDelete = isCommentAuthor || (user && ["EDITOR", "ADMIN"].includes(user.role));

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-dark-bg text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
          {comment.authorAvatarUrl ? (
            <Image src={comment.authorAvatarUrl} alt="Avatar" width={36} height={36} unoptimized className="object-cover" />
          ) : (
            <span>{authorLetter}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-xs sm:text-sm">
                {comment.isRemoved ? "[removed]" : comment.authorName || "Anonymous"}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-[11px] text-gray-400 font-normal">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Score & Vote & Tools */}
            <div className="flex items-center gap-2">
              {!comment.isRemoved && (
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  <button
                    onClick={() => onVote(comment.id, "UP")}
                    className={`p-0.5 rounded transition-colors cursor-pointer ${
                      comment.myVote === "UP" ? "text-orange-500 font-bold" : "text-gray-400 hover:text-orange-500"
                    }`}
                    title="Upvote comment"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] tabular-nums px-0.5">{comment.score}</span>
                  <button
                    onClick={() => onVote(comment.id, "DOWN")}
                    className={`p-0.5 rounded transition-colors cursor-pointer ${
                      comment.myVote === "DOWN" ? "text-blue-500 font-bold" : "text-gray-400 hover:text-blue-500"
                    }`}
                    title="Downvote comment"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!comment.isRemoved && !isCommentAuthor && (
                <button
                  onClick={() => onReport(comment.id)}
                  title="Report comment"
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  title="Delete comment"
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${comment.isRemoved ? "italic text-gray-400" : "text-gray-800"}`}>
            {comment.body}
          </p>

          {/* Reply trigger */}
          {!isLocked && !comment.isRemoved && (
            <button
              onClick={() => setReplying(!replying)}
              className="mt-3 text-xs font-semibold text-gray-500 hover:text-dark-text flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5 text-gray-400" />
              <span>Reply</span>
            </button>
          )}

          {/* Reply Form */}
          {replying && (
            <form onSubmit={handleReplySubmit} className="mt-3.5 pt-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a thoughtful reply..."
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-black focus:bg-white transition-all"
                autoFocus
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || !replyText.trim()}
                className="px-4 py-2 text-xs font-semibold shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
              </Button>
            </form>
          )}

          {/* Recursive Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 border-l-2 border-gray-100 pl-3 sm:pl-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isLocked={isLocked}
                  user={user}
                  onReplyAdded={onReplyAdded}
                  onVote={onVote}
                  onDelete={onDelete}
                  onReport={onReport}
                  onAuthRequired={onAuthRequired}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function PostDetailPage() {
  const { slug, postId } = useParams<{ slug: string; postId: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Load User with active listener
  const loadUser = useCallback(() => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { setUser(null); }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser();
    window.addEventListener("akam_user_updated", loadUser);
    return () => window.removeEventListener("akam_user_updated", loadUser);
  }, [loadUser]);

  const fetchPostAndComments = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/communities/${slug}/posts/${postId}`),
        apiFetch(`${API_BASE_URL}/posts/${postId}/comments`),
      ]);

      if (!postRes.ok) {
        setError("Post not found");
        return;
      }

      const postData = await postRes.json();
      setPost(postData);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
    } catch {
      setError("Failed to load post details");
    } finally {
      setLoading(false);
    }
  }, [slug, postId]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  // Vote Post
  const handlePostVote = async (value: "UP" | "DOWN") => {
    if (!post) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (res.status === 401) {
        setAuthModalOpen(true);
        return;
      }

      if (res.ok) {
        const json = await res.json();
        setPost({
          ...post,
          upvotes: json.upvotes,
          downvotes: json.downvotes,
          score: json.score,
          myVote: json.voted ? value : null,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Vote Comment
  const handleCommentVote = async (commentId: string, value: "UP" | "DOWN") => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (res.status === 401) {
        setAuthModalOpen(true);
        return;
      }

      if (res.ok) {
        fetchPostAndComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to remove this comment?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/comments/${commentId}/remove`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchPostAndComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReportModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    if (!reportReason) return;
    setSubmittingReport(true);
    try {
      const endpoint = reportingCommentId
        ? `${API_BASE_URL}/comments/${reportingCommentId}/report`
        : `${API_BASE_URL}/posts/${post?.id}/report`;

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
          setReportModalOpen(false);
          setReportSuccess(false);
          setReportingCommentId(null);
          setReportDetails("");
        }, 1500);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || "Failed to submit report. Please try again.");
      }
    } catch (e) {
      console.error("Failed to submit report:", e);
      alert("Failed to submit report. Please check your connection and try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Root Comment Submit
  const handleRootCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setPostingComment(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });

      if (res.status === 401) {
        setAuthModalOpen(true);
        return;
      }

      if (res.ok) {
        setNewComment("");
        fetchPostAndComments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPostingComment(false);
    }
  };

  // Robust Share Handler
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert(`Post URL: ${text}`);
    }
    document.body.removeChild(textarea);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-3"></div>
          <p className="text-xs font-semibold text-gray-500 tracking-wide">Loading community post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-poppins">
        <div className="bg-white border border-gray-200 rounded-[28px] p-8 text-center max-w-md shadow-xs">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-950 mb-2">{error || "Post not found"}</h2>
          <Link href={`/communities/${slug}`} className="text-xs font-semibold text-blue-600 hover:underline">
            Return to community feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/communities/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to r/{post.communityName}
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500" />
            {copied ? "Link Copied!" : "Share"}
          </button>
        </div>

        {/* Main Post Card */}
        <article className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Column */}
            <div className="flex sm:flex-col items-center justify-center p-4 sm:p-5 bg-gray-50/70 border-b sm:border-b-0 sm:border-r border-gray-100 gap-2 shrink-0">
              <button
                onClick={() => handlePostVote("UP")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  post.myVote === "UP"
                    ? "text-orange-600 bg-orange-100"
                    : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                }`}
                title="Upvote post"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <span className="font-bold text-sm text-gray-900 tabular-nums">{post.score}</span>
              <button
                onClick={() => handlePostVote("DOWN")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  post.myVote === "DOWN"
                    ? "text-blue-600 bg-blue-100"
                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                }`}
                title="Downvote post"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 sm:p-7">
              {/* Meta Badges */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
                <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                  r/{post.communityName}
                </span>

                {post.flair && (
                  <span className={`font-semibold px-2.5 py-1 rounded-lg border text-[11px] ${flairColors[post.flair] || "bg-gray-100 text-gray-700"}`}>
                    {post.flair}
                  </span>
                )}

                {post.isPinned && (
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}

                {post.isLocked && (
                  <span className="bg-gray-100 text-gray-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}

                <span className="text-gray-400 ml-auto text-[11px]">
                  Posted by <strong className="text-gray-900 font-semibold">{post.authorName || "Anonymous"}</strong> • {timeAgo(post.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight mb-4 leading-snug">
                {post.title}
              </h1>

              {/* Body */}
              {post.body && (
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-5">
                  {post.body}
                </div>
              )}

              {/* Image */}
              {post.imageUrl && (
                <div className="mb-5 rounded-xl overflow-hidden max-h-[480px] bg-gray-100 border border-gray-200">
                  <img
                    src={getImageUrl(post.imageUrl)!}
                    alt={post.title}
                    className="w-full h-auto max-h-[480px] object-cover"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span>{countTotalComments(comments)} Comments</span>
                </div>

                <button
                  onClick={() => {
                    setReportingCommentId(null);
                    setReportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Report this post"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Standard Comment Model Section */}
        <section id="comments-section" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-gray-950" />
              <h3 className="text-xl font-bold text-gray-950">
                Discussion ({countTotalComments(comments)})
              </h3>
            </div>
          </div>

          {/* Root Comment Form */}
          {!post.isLocked ? (
            <form onSubmit={handleRootCommentSubmit} className="mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-gray-400 focus-within:bg-white transition-all shadow-xs">
                <textarea
                  rows={3}
                  placeholder={user ? "Write your thoughts or reaction..." : "Sign in to join the discussion..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 mt-2">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {user ? `Commenting as ${user.name || user.email}` : "Authentication required to comment"}
                  </span>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={postingComment || !newComment.trim()}
                    icon={<Send className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    className="px-5 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {postingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-xs font-medium text-amber-800 mb-6 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              This discussion thread has been locked by the editorial team. New comments are disabled.
            </div>
          )}

          {/* Comment Tree */}
          {comments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs sm:text-sm">
              No comments yet. Be the first to start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  isLocked={post.isLocked}
                  user={user}
                  onReplyAdded={fetchPostAndComments}
                  onVote={handleCommentVote}
                  onDelete={handleDeleteComment}
                  onReport={(id) => {
                    setReportingCommentId(id);
                    setReportModalOpen(true);
                  }}
                  onAuthRequired={() => setAuthModalOpen(true)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          loadUser();
          fetchPostAndComments();
        }}
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-poppins animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-gray-100">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-950 mb-2">Report Content</h3>
            <p className="text-xs text-gray-500 mb-4">Flag inappropriate content for editorial review.</p>

            {reportSuccess ? (
              <div className="py-6 text-center text-emerald-600 font-semibold text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                Report submitted to editors. Thank you!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                  >
                    <option value="SPAM">Spam or self-promotion</option>
                    <option value="INAPPROPRIATE">Inappropriate or offensive content</option>
                    <option value="HARASSMENT">Harassment or hate speech</option>
                    <option value="MISINFORMATION">Misinformation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for the editorial team..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submittingReport}
                    className="px-5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    {submittingReport ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
