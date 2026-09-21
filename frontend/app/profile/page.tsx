"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Edit2, Upload, BookOpen, Clock, FileCheck, Shield, ChevronRight, LogOut, Send, FileText, CheckCircle2, Filter, Trash2, X, Eye, XCircle, Palette, Video, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

interface AuthorStory {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  coverImageUrl: string | null;
  mediaUrl?: string | null;
  submissionType?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "APPROVED_EMAGAZINE" | "PUBLISHED_EMAGAZINE";
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<AuthorStory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<AuthorStory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // E-Magazine Preview Modal
  const [previewStory, setPreviewStory] = useState<AuthorStory | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (story: AuthorStory) => {
    setPreviewStory(story);
    setPreviewLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${story.slug || story.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewStory((prev) => (prev ? { ...prev, ...data } : data));
      }
    } catch (e) {
      console.error("Failed to fetch story preview", e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => setPreviewStory(null);

  const getAddSubmissionVideoEmbed = (url: string) => {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) return { type: "youtube" as const, id: ytMatch[1] };
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { type: "vimeo" as const, id: vimeoMatch[1] };
    return null;
  };

  const renderStoryContent = (contentStr: string) => {
    const mdToHtml = (md: string): string => {
      let h = md;
      h = h.replace(/&nbsp;/gi, " ");
      h = h.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, src) => {
        return `<img src="${formatAssetUrl(src)}" alt="${alt}" class="my-6 w-full max-w-3xl mx-auto max-h-[500px] object-cover rounded-2xl shadow-xs" />`;
      });
      h = h.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold my-4 text-gray-900">$1</h3>');
      h = h.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold my-5 text-gray-950">$1</h2>');
      h = h.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
      h = h.replace(/__(.*?)__/g, "<b>$1</b>");
      h = h.replace(/\*(.*?)\*/g, "<i>$1</i>");
      h = h.replace(
        /^>\s+(.*)$/gm,
        '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">$1</blockquote>',
      );
      h = h.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>',
      );
      h = h.replace(/^[\*\-]\s+(.*)$/gm, '<li class="ml-5 list-disc mb-1 text-gray-900">$1</li>');
      h = h.replace(/^(\d+)\.\s+(.*)$/gm, '<li class="ml-5 list-decimal mb-1 text-gray-900">$2</li>');
      return h;
    };

    const withHtmlImgs = contentStr.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, src) => `<img src="${formatAssetUrl(src)}" alt="${alt}" />`);
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(withHtmlImgs)) !== null) {
      if (match.index > lastIndex) {
        const chunk = withHtmlImgs.substring(lastIndex, match.index);
        if (chunk.trim()) parts.push({ type: "text", value: chunk });
      }
      const src = match[1];
      if (src) parts.push({ type: "image", src: formatAssetUrl(src), alt: "Story Inline Image" });
      lastIndex = imgRegex.lastIndex;
    }
    if (lastIndex < withHtmlImgs.length) {
      const chunk = withHtmlImgs.substring(lastIndex);
      if (chunk.trim()) parts.push({ type: "text", value: chunk });
    }
    if (parts.length === 0) parts.push({ type: "text", value: contentStr });

    return (
      <div className="space-y-0">
        {parts.map((part, idx) => {
          if (part.type === "image") {
            return (
              <div key={idx} className="my-8 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formatAssetUrl(part.src)}
                  alt={part.alt}
                  className="w-full max-w-3xl h-auto max-h-[520px] object-cover rounded-2xl shadow-xs border border-gray-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            );
          }

          const rawText = part.value.replace(/\r\n/g, "\n");
          const lines = rawText.split("\n");
          const blocks: React.ReactNode[] = [];
          let paraLines: string[] = [];

          const flushPara = (key: string) => {
            if (paraLines.length > 0) {
              const combined = paraLines.join("<br />");
              if (combined.trim()) {
                blocks.push(
                  <div
                    key={key}
                    className="text-[#1A1A1A] text-base sm:text-lg leading-[1.9] mb-6 font-normal [&_b]:font-bold [&_i]:italic [&_a]:text-emerald-700 [&_a]:underline [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_li]:ml-5 [&_li]:list-disc"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(combined) }}
                  />,
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
                blocks.push(<div key={`${idx}-gap-${li}`} className="mb-10 select-none" aria-hidden="true" />);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStoryToDelete(null);
        setPreviewStory(null);
      }
    };
    if (storyToDelete || previewStory) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [storyToDelete, previewStory]);

  const fetchData = async () => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
    if (!savedUser) {
      setLoading(false);
      return;
    }

    try {
      // 1. Profile
      const pRes = await apiFetch(`${API_BASE_URL}/users/me`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        setName(pData.name || "");
        setBio(pData.bio || "");
      }

      // 2. Author stories
      const sRes = await apiFetch(`${API_BASE_URL}/stories/my/stories`);
      if (sRes.ok) {
        setStories(await sRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        localStorage.setItem("akam_user", JSON.stringify(updated));
        window.dispatchEvent(new Event("akam_user_updated"));
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch(`${API_BASE_URL}/users/me/avatar`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        localStorage.setItem("akam_user", JSON.stringify(updated));
        window.dispatchEvent(new Event("akam_user_updated"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitDraftForReview = async (storyId: string) => {
    setActionLoadingId(storyId);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to submit draft to editorial queue");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDraft = async (storyId: string) => {
    setDeletingId(storyId);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
        setStoryToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to delete draft");
      }
    } catch (e) {
      console.error("Failed to delete draft", e);
      alert("An error occurred while deleting the draft.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("akam_user");
    localStorage.removeItem("akam_token");
    document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    window.dispatchEvent(new Event("akam_user_updated"));
    router.push("/");
    router.refresh();
  };

  const filteredStories = statusFilter === "ALL"
    ? stories
    : statusFilter === "APPROVED_EMAGAZINE"
    ? stories.filter((s) => s.status === "APPROVED_EMAGAZINE" || s.status === "PUBLISHED_EMAGAZINE")
    : stories.filter((s) => s.status === statusFilter);

  const draftCount = stories.filter((s) => s.status === "DRAFT").length;
  const pendingCount = stories.filter((s) => s.status === "PENDING").length;
  const approvedCount = stories.filter((s) => s.status === "APPROVED").length;
  const emagazineCount = stories.filter((s) => s.status === "APPROVED_EMAGAZINE" || s.status === "PUBLISHED_EMAGAZINE").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-poppins flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white font-poppins flex flex-col items-center justify-center p-8 text-center">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your Profile</h2>
        <p className="text-sm text-gray-500 mb-6">Manage your author profile, saved drafts, and submitted stories.</p>
        <Link href="/">
          <Button variant="primary" size="md">Go to Homepage</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col">
      <main className="flex-1 py-12 lg:py-20">
        <div className="container px-4 mx-auto max-w-5xl">
          {/* Header Card matching LatestStories aesthetic */}
          <div className="bg-gray-50 border border-gray-200 rounded-[28px] p-6 sm:p-10 mb-10 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Avatar Upload */}
              <div className="relative group shrink-0">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img src={formatAssetUrl(profile.avatarUrl)} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white text-2xl font-bold">
                      {(profile.name || profile.email)[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {/* Bio & Details */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profile.name || profile.email}
                  </h1>
                  <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl">
                    {profile.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{profile.email}</p>
                <p className="text-sm text-[#646464] max-w-2xl leading-relaxed">
                  {profile.bio || "No author bio added yet. Click edit profile to add your bio."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  iconPosition="left"
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full border border-gray-300 shadow-xs cursor-pointer"
                >
                  Edit Profile
                </Button>
                {/* {['EDITOR', 'ADMIN'].includes(profile.role) && (
                  <Link href="/editorial" className="w-full">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Shield className="w-3.5 h-3.5 text-[#E4F953]" />}
                      iconPosition="left"
                      className="w-full shadow-xs cursor-pointer"
                    >
                      Editorial Workspace
                    </Button>
                  </Link>
                )} */}
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOut className="w-3.5 h-3.5" />}
                  iconPosition="left"
                  onClick={handleLogout}
                  className="w-full cursor-pointer text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Edit Form Drawer */}
            {isEditing && (
              <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-gray-200 space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full display name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Author Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write a short author bio..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-black"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" size="md" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Full Width My Stories Section */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <span>My Works & Submissions</span>
              </h2>
              <Link href="/submit">
                <Button variant="primary" size="md" className="text-xs font-semibold shadow-xs">
                  Submit New Work
                </Button>
              </Link>
            </div>

            {/* Status Filter Header & Dropdown */}
            <div className="border-b border-gray-200 pb-3">
              {/* Desktop Status Pills (768px and wider) */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "ALL"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Works ({stories.length})
                </button>
                <button
                  onClick={() => setStatusFilter("DRAFT")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "DRAFT"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Drafts ({draftCount})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "PENDING"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Pending Queue ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("APPROVED")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "APPROVED"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Published ({approvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("APPROVED_EMAGAZINE")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "APPROVED_EMAGAZINE"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  E-Magazine ({emagazineCount})
                </button>
              </div>

              {/* Mobile & Tablet Filter Select Dropdown (< 768px) */}
              <div className="md:hidden w-full">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-xs">
                  <Filter className="w-4 h-4 text-gray-600 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Works ({stories.length})</option>
                    <option value="DRAFT">Drafts ({draftCount})</option>
                    <option value="PENDING">Pending Queue ({pendingCount})</option>
                    <option value="APPROVED">Published ({approvedCount})</option>
                    <option value="APPROVED_EMAGAZINE">E-Magazine ({emagazineCount})</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <div className="p-12 bg-gray-50 border border-gray-200 rounded-[28px] text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No works found under this filter.</p>
                <Link href="/submit">
                  <Button variant="secondary" size="md" className="border border-gray-300">
                    Submit New Work
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    className="p-5 bg-white border border-gray-200 rounded-[24px] flex flex-col justify-between gap-4 shadow-xs hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                        <Image
                          src={story.coverImageUrl || "/images/stories/ramachi.jpg"}
                          alt={story.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{story.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last updated {new Date(story.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shrink-0 ${
                          story.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : story.status === "PUBLISHED_EMAGAZINE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : story.status === "APPROVED_EMAGAZINE"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : story.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : story.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {story.status === "PUBLISHED_EMAGAZINE"
                          ? "E-Magazine (Published)"
                          : story.status === "APPROVED_EMAGAZINE"
                          ? "E-Magazine (Pending)"
                          : story.status}
                      </span>
                    </div>

                    {story.status === "PUBLISHED_EMAGAZINE" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Published in official AKAM E-Magazine edition</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3 h-3" />}
                          iconPosition="left"
                          className="text-xs px-3 py-1.5 cursor-pointer border border-emerald-200 text-emerald-800 hover:bg-emerald-50 shadow-xs"
                          onClick={() => openPreview(story)}
                        >
                          Preview
                        </Button>
                      </div>
                    )}

                    {story.status === "APPROVED_EMAGAZINE" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-gray-600 font-medium flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>Approved for AKAM E-Magazine edition (stored for periodical)</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3 h-3" />}
                          iconPosition="left"
                          className="text-xs px-3 py-1.5 cursor-pointer border border-gray-300 shadow-xs"
                          onClick={() => openPreview(story)}
                        >
                          Preview
                        </Button>
                      </div>
                    )}

                    {story.status === "APPROVED" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Published & live on works catalog</span>
                        </span>
                        <Link href={`/works/${story.slug || story.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3 h-3" />}
                            iconPosition="left"
                            className="text-xs px-3 py-1.5 cursor-pointer border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                          >
                            View on Works
                          </Button>
                        </Link>
                      </div>
                    )}


                    {/* Draft Actions Bar */}
                    {(story.status === "DRAFT" || story.status === "REJECTED") && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 italic">
                          {story.status === "DRAFT" ? "Saved Draft" : "Revision Required"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStoryToDelete(story)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium shadow-2xs active:scale-95"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Draft</span>
                          </button>
                          <Link href={`/submit?id=${story.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit2 className="w-3 h-3" />}
                              iconPosition="left"
                              className="text-xs px-3 py-1.5 cursor-pointer border border-gray-300 shadow-xs"
                            >
                              Edit Draft
                            </Button>
                          </Link>
                          {story.status === "DRAFT" && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Send className="w-3 h-3" />}
                              iconPosition="left"
                              disabled={actionLoadingId === story.id}
                              onClick={() => handleSubmitDraftForReview(story.id)}
                              className="text-xs px-3.5 py-1.5 cursor-pointer shadow-xs"
                            >
                              {actionLoadingId === story.id ? "Submitting..." : "Submit to Queue"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Draft Confirmation Modal */}
      {storyToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-poppins"
          onClick={() => setStoryToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-950 leading-snug">
                    Delete Draft?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-gray-800">
                      "{storyToDelete.title || "Untitled Draft"}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStoryToDelete(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={deletingId === storyToDelete.id}
                onClick={() => setStoryToDelete(null)}
                className="border border-gray-200 text-xs px-4 py-2 cursor-pointer"
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={deletingId === storyToDelete.id}
                onClick={() => handleDeleteDraft(storyToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId === storyToDelete.id ? "Deleting..." : "Delete Draft"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── E-Magazine / Story Preview Modal (Matches Editorial Reader Modal) ───────────────────────── */}
      {previewStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[32px] p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col font-poppins"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-6 gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-xs">
                    {previewStory.status === "PUBLISHED_EMAGAZINE"
                      ? "PUBLISHED IN E-MAGAZINE"
                      : previewStory.status === "APPROVED_EMAGAZINE"
                      ? "E-MAGAZINE (PENDING)"
                      : previewStory.status === "APPROVED"
                      ? "PUBLISHED STORY"
                      : previewStory.status === "DRAFT"
                      ? "DRAFT PREVIEW"
                      : "SUBMISSION PREVIEW"}
                  </span>
                  {previewStory.submissionType === "PAINTING" && (
                    <span className="bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Painting
                    </span>
                  )}
                  {previewStory.submissionType === "VIDEO" && (
                    <span className="bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                  {previewStory.category && (
                    <span className="bg-black text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
                      Category: {previewStory.category}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 leading-tight">
                  {previewStory.title}
                </h2>
                {previewStory.description && (
                  <div className="mt-3.5 rounded-2xl text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <p className="whitespace-pre-wrap">{previewStory.description}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  By {previewStory.authorName || profile.name || profile.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer shrink-0"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player Embed if VIDEO submission */}
            {previewStory.submissionType === "VIDEO" && (
              <div className="w-full max-w-3xl mx-auto mb-8 shrink-0 rounded-[24px] overflow-hidden shadow-md aspect-video bg-black relative flex items-center justify-center">
                {(() => {
                  const embed = previewStory.mediaUrl ? getAddSubmissionVideoEmbed(previewStory.mediaUrl) : null;
                  if (embed?.type === "youtube") {
                    return (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${embed.id}`}
                        title="Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  } else if (embed?.type === "vimeo") {
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${embed.id}`}
                        title="Video Preview"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  } else if (previewStory.coverImageUrl) {
                    return (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatAssetUrl(previewStory.coverImageUrl)}
                          alt={previewStory.title}
                          className="w-full h-full object-cover"
                        />
                        {previewStory.mediaUrl && (
                          <a
                            href={previewStory.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group cursor-pointer z-10"
                          >
                            <div className="w-14 h-14 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current ml-1 text-black" />
                            </div>
                          </a>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs p-6">
                      {previewStory.mediaUrl ? (
                        <a
                          href={previewStory.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-semibold hover:text-[#E4F953]"
                        >
                          Open Video Link in New Tab
                        </a>
                      ) : (
                        <span className="text-gray-400">No video source provided</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Painting Artwork Display */}
            {previewStory.submissionType === "PAINTING" && (previewStory.mediaUrl || previewStory.coverImageUrl) && (
              <div className="relative w-full max-w-3xl mx-auto mb-8 shrink-0 rounded-[24px] overflow-hidden bg-[#0A0D0C] border border-gray-200/80 shadow-sm flex items-center justify-center p-3 sm:p-4 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formatAssetUrl(previewStory.mediaUrl || previewStory.coverImageUrl || "")}
                  alt={previewStory.title || "Painting Artwork"}
                  className="w-full max-h-[550px] object-contain rounded-xl block"
                />
                <div className="absolute bottom-3 right-3 z-10 bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-xs pointer-events-none">
                  <Palette className="w-3.5 h-3.5 text-purple-300" />
                  <span>Original Artwork</span>
                </div>
              </div>
            )}

            {/* Article / Story Cover Image (Card style matching LatestStories) */}
            {previewStory.submissionType !== "VIDEO" && previewStory.submissionType !== "PAINTING" && (previewStory.coverImageUrl || previewStory.mediaUrl) && (
              <div className="relative w-64 sm:w-72 md:w-80 aspect-square mx-auto mb-8 shrink-0 rounded-[22px] overflow-hidden bg-gray-100 border border-gray-200/80 shadow-md">
                <Image
                  src={formatAssetUrl(previewStory.coverImageUrl || previewStory.mediaUrl || "")}
                  alt={previewStory.title || "Cover Preview"}
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                />
              </div>
            )}

            {/* Content Parser */}
            <div className="mb-6 flex-1">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                  <span className="text-sm font-medium">Loading content...</span>
                </div>
              ) : previewStory.content ? (
                renderStoryContent(previewStory.content)
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-6">No content available for preview.</p>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-gray-100 mt-auto shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={closePreview}
                className="justify-center border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer shrink-0"
              >
                Close Preview
              </Button>

              {previewStory.status === "APPROVED" && (
                <Link href={`/works/${previewStory.slug || previewStory.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="justify-center bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    View on Works
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
