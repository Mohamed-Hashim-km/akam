"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Edit2, Upload, BookOpen, Clock, FileCheck, Shield, ChevronRight, LogOut, Send, FileText, CheckCircle2, Filter, Trash2, X, Eye, XCircle, Palette, Video, Play, GraduationCap, AlertCircle, Calendar, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";
import type { StudentApplicationData } from "@/components/StudentVerificationModal";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  subscriptionStatus?: string | null;
  subscriptionEndDate?: string | null;
  isStudent?: boolean;
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
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "APPROVED_EMAGAZINE" | "PUBLISHED_EMAGAZINE" | "UNPUBLISHED";
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

  // Student Pass Application State (read-only status display)
  const [studentApp, setStudentApp] = useState<StudentApplicationData | null>(null);

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
    const clean = url.trim();
    const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
    if (ytMatch) return { type: "youtube" as const, id: ytMatch[1], embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}` };
    const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { type: "vimeo" as const, id: vimeoMatch[1], embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    const dmMatch = clean.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/);
    if (dmMatch) return { type: "dailymotion" as const, id: dmMatch[1], embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}` };
    const gdMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdMatch) return { type: "googledrive" as const, id: gdMatch[1], embedUrl: `https://drive.google.com/file/d/${gdMatch[1]}/preview` };
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(clean) || clean.startsWith("blob:") || /^https?:\/\/.*\/uploads\/.*video/i.test(clean)) {
      return { type: "direct" as const, directUrl: clean };
    }
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

  const fetchStudentStatus = async (userEmail?: string) => {
    const emailToLookup = userEmail || profile?.email;
    if (!emailToLookup) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/student-verifications/status/${encodeURIComponent(emailToLookup)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status && data.status !== "NONE") {
          setStudentApp(data);
          localStorage.setItem("akam_student_application", JSON.stringify(data));
          if (data.status === "REJECTED") {
            localStorage.removeItem("akam_masika_pass");
            localStorage.removeItem("akam_pass_type");
            localStorage.removeItem("akam_subscription_end_date");
          }
          return;
        }
      }
      const local = typeof window !== "undefined" ? localStorage.getItem("akam_student_application") : null;
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed && (!parsed.email || parsed.email.toLowerCase() === emailToLookup.toLowerCase())) {
            setStudentApp(parsed);
            return;
          }
        } catch {}
      }
      setStudentApp(null);
    } catch (err) {
      console.error("Error fetching student verification status:", err);
    }
  };

  const fetchData = async () => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
    if (!savedUser) {
      setLoading(false);
      return;
    }

    try {
      // 1. Profile
      let userEmail = "";
      const pRes = await apiFetch(`${API_BASE_URL}/users/me`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        setName(pData.name || "");
        setBio(pData.bio || "");
        userEmail = pData.email || "";
      }

      // 2. Author stories
      const sRes = await apiFetch(`${API_BASE_URL}/stories/my/stories`);
      if (sRes.ok) {
        setStories(await sRes.json());
      }

      // 3. Student verification status
      if (userEmail) {
        fetchStudentStatus(userEmail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSync = () => {
      fetchData();
    };
    window.addEventListener("akam_user_updated", handleSync);
    return () => window.removeEventListener("akam_user_updated", handleSync);
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
  const unpublishedCount = stories.filter((s) => s.status === "UNPUBLISHED").length;

  // Subscription / Student Pass details calculations
  const studentPassEndDate = studentApp?.endDate || profile?.subscriptionEndDate;
  const studentPassEndObj = studentPassEndDate ? new Date(studentPassEndDate) : null;
  const isStudentPassValidDate = studentPassEndObj ? !isNaN(studentPassEndObj.getTime()) : false;
  const studentPassDaysRemaining = isStudentPassValidDate
    ? Math.ceil((studentPassEndObj!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isStudentPassExpired = studentPassDaysRemaining !== null && studentPassDaysRemaining <= 0;
  const studentPassDurationMonths = studentPassDaysRemaining !== null
    ? Math.max(1, Math.round(studentPassDaysRemaining / 30))
    : null;
  const formattedStudentPassEndDate = isStudentPassValidDate
    ? studentPassEndObj!.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const subEndDate = profile?.subscriptionEndDate ? new Date(profile.subscriptionEndDate) : null;
  const isSubValidDate = subEndDate ? !isNaN(subEndDate.getTime()) : false;
  const subDaysRemaining = isSubValidDate
    ? Math.ceil((subEndDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isSubExpired = subDaysRemaining !== null && subDaysRemaining <= 0;
  const subDurationMonths = subDaysRemaining !== null
    ? Math.max(1, Math.round(subDaysRemaining / 30))
    : null;
  const formattedSubEndDate = isSubValidDate
    ? subEndDate!.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

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
          <Button variant="primary" size="sm" className="h-9 px-5 rounded-full text-xs font-semibold shadow-xs cursor-pointer">
            Go to Homepage
          </Button>
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
                  <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                    {profile.role}
                  </span>
                  {((profile.isStudent && profile.subscriptionStatus === "ACTIVE") || studentApp?.status === "APPROVED") && studentApp?.status !== "REJECTED" && (
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                      <GraduationCap className="w-3 h-3 text-emerald-600" /> Scholar Pass
                    </span>
                  )}
                  {profile.subscriptionStatus === "ACTIVE" && !profile.isStudent && studentApp?.status !== "APPROVED" && (
                    <span className="bg-purple-100 text-purple-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 border border-purple-200">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Digital Pass
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">{profile.email}</p>
                <p className="text-sm text-[#646464] max-w-2xl leading-relaxed">
                  {profile.bio || "No author bio added yet. Click edit profile to add your bio."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  iconPosition="left"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-9 px-4 w-full sm:w-36 justify-center rounded-full border border-gray-300 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOut className="w-3.5 h-3.5" />}
                  iconPosition="left"
                  onClick={handleLogout}
                  className="h-9 px-4 w-full sm:w-36 justify-center rounded-full text-xs font-semibold cursor-pointer text-rose-600 border border-rose-200 hover:bg-rose-50"
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
                    className="h-9 px-4 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={saving}
                    className="h-9 px-5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* ── Student Pass Application Status Card (Only shown if user has applied) ── */}
          {studentApp && studentApp.status === "PENDING_APPROVAL" && (
            <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-white border border-amber-200/90 rounded-[24px] p-5 sm:p-6 mb-10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Student Pass Application</h3>
                      <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                        Under Review
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                      Your academic verification application for <span className="font-semibold text-gray-900">{studentApp.institution || "your institution"}</span> is currently under review by the Akam Editorial Board.
                    </p>
                  </div>
                </div>
                {studentApp.referenceId && (
                  <div className="sm:text-right shrink-0 bg-amber-100/70 border border-amber-200/80 rounded-xl px-3.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Application Ref</p>
                    <p className=" text-xs sm:text-sm font-bold text-amber-950">{studentApp.referenceId}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-amber-950/80">
                {(studentApp.fullName || profile?.name) && (
                  <span><strong className="font-semibold text-amber-950">Student:</strong> {studentApp.fullName || profile?.name}</span>
                )}
                {studentApp.institution && (
                  <span><strong className="font-semibold text-amber-950">College:</strong> {studentApp.institution}</span>
                )}
                {(studentApp.email || profile?.email) && (
                  <span><strong className="font-semibold text-amber-950">Email:</strong> {studentApp.email || profile?.email}</span>
                )}
                {studentApp.submittedAt && (
                  <span><strong className="font-semibold text-amber-950">Submitted On:</strong> {new Date(studentApp.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                )}
              </div>
            </div>
          )}

          {((studentApp && studentApp.status === "APPROVED") || (profile?.isStudent && profile.subscriptionStatus === "ACTIVE" && studentApp?.status !== "REJECTED" && studentApp?.status !== "PENDING_APPROVAL")) && (
            <div className="bg-gradient-to-r from-emerald-50/90 via-emerald-50/30 to-white border border-emerald-200/90 rounded-[24px] p-5 sm:p-6 mb-10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Student Scholar Pass</h3>
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified (100% Free)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                      Complimentary all-access pass verified for <span className="font-semibold text-gray-900">{studentApp?.institution || "Enrolled Scholar"}</span>. You have unlimited digital reading access to all AKAM Masika editions.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {studentApp?.referenceId && (
                    <div className="sm:text-right bg-emerald-100/70 border border-emerald-200/80 rounded-xl px-3.5 py-1.5">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">Pass Ref</p>
                      <p className=" text-xs font-bold text-emerald-950">{studentApp.referenceId}</p>
                    </div>
                  )}
                  {formattedStudentPassEndDate && (
                    <div className={`sm:text-right px-3.5 py-1.5 rounded-xl border ${
                      isStudentPassExpired
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-500/10 border-emerald-300 text-emerald-950'
                    }`}>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3 h-3 text-emerald-700" /> Pass Valid Until
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-emerald-950">
                        {formattedStudentPassEndDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-emerald-950/80">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {(studentApp?.fullName || profile?.name) && (
                    <span><strong className="font-semibold text-emerald-950">Student:</strong> {studentApp?.fullName || profile?.name}</span>
                  )}
                  {studentApp?.institution && (
                    <span><strong className="font-semibold text-emerald-950">College:</strong> {studentApp.institution}</span>
                  )}
                  {(studentApp?.email || profile?.email) && (
                    <span><strong className="font-semibold text-emerald-950">Email:</strong> {studentApp?.email || profile?.email}</span>
                  )}
                  {formattedStudentPassEndDate && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <strong className="font-semibold text-emerald-950">Duration:</strong> {studentPassDurationMonths} Month{studentPassDurationMonths === 1 ? '' : 's'} ({isStudentPassExpired ? 'Expired' : `~${studentPassDaysRemaining} days remaining`})
                    </span>
                  )}
                </div>
                <Link
                  href="/emagazine"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                >
                  Access E-Magazine →
                </Link>
              </div>
            </div>
          )}

          {/* ── Active Paid / Granted Subscription Card (For non-student subscribers) ── */}
          {profile && !profile.isStudent && profile.subscriptionStatus === "ACTIVE" && (
            <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/30 to-white border border-purple-200/90 rounded-[24px] p-5 sm:p-6 mb-10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Akam Digital Reading Pass</h3>
                      <span className="bg-purple-100 text-purple-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-200">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        Active Subscription
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                      Full digital access active. Enjoy unlimited reading access to all monthly editions, exclusive stories, and archival literature across the platform.
                    </p>
                  </div>
                </div>
                {formattedSubEndDate && (
                  <div className={`sm:text-right shrink-0 px-4 py-2 rounded-xl border ${
                    isSubExpired
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-purple-500/10 border-purple-300 text-purple-950'
                  }`}>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-purple-800 flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3 h-3 text-purple-700" /> Pass Valid Until
                    </p>
                    <p className="text-sm font-extrabold text-purple-950">
                      {formattedSubEndDate}
                    </p>
                    <p className="text-[10px] font-semibold text-purple-700">
                      {isSubExpired ? "Expired" : `~${subDaysRemaining} days remaining`}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-purple-950/80">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span><strong className="font-semibold text-purple-950">Subscriber:</strong> {profile.name || profile.email}</span>
                  {formattedSubEndDate && (
                    <span className="inline-flex items-center gap-1.5 bg-purple-100/90 text-purple-900 font-medium px-2.5 py-1 rounded-lg border border-purple-200">
                      <Clock className="w-3.5 h-3.5 text-purple-700" />
                      <strong className="font-semibold text-purple-950">Duration:</strong> {subDurationMonths} Month{subDurationMonths === 1 ? '' : 's'} ({isSubExpired ? 'Expired' : `Valid until ${formattedSubEndDate}`})
                    </span>
                  )}
                </div>
                <Link
                  href="/emagazine"
                  className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  Explore E-Magazine →
                </Link>
              </div>
            </div>
          )}


          {studentApp && studentApp.status === "REJECTED" && (
            <div className="bg-gradient-to-r from-rose-50/90 via-rose-50/30 to-white border border-rose-200/90 rounded-[24px] p-5 sm:p-6 mb-10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Student Pass Application</h3>
                      <span className="bg-rose-100 text-rose-800 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Revision Required
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-rose-950 leading-relaxed max-w-2xl">
                      {studentApp.reviewNotes
                        ? `Editorial Board Feedback: "${studentApp.reviewNotes}"`
                        : "Your submitted academic credentials could not be verified by the editorial board."}
                    </p>
                  </div>
                </div>
                {studentApp.referenceId && (
                  <div className="sm:text-right shrink-0 bg-rose-100/70 border border-rose-200/80 rounded-xl px-3.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-800">Application Ref</p>
                    <p className=" text-xs sm:text-sm font-bold text-rose-950">{studentApp.referenceId}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-rose-200/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-rose-950/80">
                {(studentApp.fullName || profile?.name) && (
                  <span><strong className="font-semibold text-rose-950">Student:</strong> {studentApp.fullName || profile?.name}</span>
                )}
                {studentApp.institution && (
                  <span><strong className="font-semibold text-rose-950">College:</strong> {studentApp.institution}</span>
                )}
                {(studentApp.email || profile?.email) && (
                  <span><strong className="font-semibold text-rose-950">Email:</strong> {studentApp.email || profile?.email}</span>
                )}
              </div>
            </div>
          )}

          {/* Full Width My Stories Section */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <span>My Works & Submissions</span>
              </h2>
              <Link href="/submit">
                <Button variant="primary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-full shadow-xs cursor-pointer">
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
                  className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                    statusFilter === "ALL"
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Works ({stories.length})
                </button>
                {draftCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("DRAFT")}
                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                      statusFilter === "DRAFT"
                        ? "bg-black text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Drafts ({draftCount})
                  </button>
                )}
                {pendingCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("PENDING")}
                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                      statusFilter === "PENDING"
                        ? "bg-black text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Pending Queue ({pendingCount})
                  </button>
                )}
                {approvedCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("APPROVED")}
                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                      statusFilter === "APPROVED"
                        ? "bg-black text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Published ({approvedCount})
                  </button>
                )}
                {emagazineCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("APPROVED_EMAGAZINE")}
                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                      statusFilter === "APPROVED_EMAGAZINE"
                        ? "bg-black text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    E-Magazine ({emagazineCount})
                  </button>
                )}
                {unpublishedCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("UNPUBLISHED")}
                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                      statusFilter === "UNPUBLISHED"
                        ? "bg-black text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Unpublished ({unpublishedCount})
                  </button>
                )}
              </div>

              {/* Mobile & Tablet Filter Select Dropdown (< 768px) */}
              <div className="md:hidden w-full">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 h-9 shadow-xs">
                  <Filter className="w-4 h-4 text-gray-600 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Works ({stories.length})</option>
                    {draftCount > 0 && <option value="DRAFT">Drafts ({draftCount})</option>}
                    {pendingCount > 0 && <option value="PENDING">Pending Queue ({pendingCount})</option>}
                    {approvedCount > 0 && <option value="APPROVED">Published ({approvedCount})</option>}
                    {emagazineCount > 0 && <option value="APPROVED_EMAGAZINE">E-Magazine ({emagazineCount})</option>}
                    {unpublishedCount > 0 && <option value="UNPUBLISHED">Unpublished ({unpublishedCount})</option>}
                  </select>
                </div>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <div className="p-12 bg-gray-50 border border-gray-200 rounded-[28px] text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No works found under this filter.</p>
                <Link href="/submit">
                  <Button variant="secondary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-full border border-gray-300 shadow-xs cursor-pointer">
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
                            : story.status === "UNPUBLISHED"
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {story.status === "PUBLISHED_EMAGAZINE"
                          ? "E-Magazine (Published)"
                          : story.status === "APPROVED_EMAGAZINE"
                          ? "E-Magazine (Pending)"
                          : story.status === "APPROVED"
                          ? "Published"
                          : story.status === "UNPUBLISHED"
                          ? "Unpublished"
                          : story.status === "PENDING"
                          ? "In Review"
                          : story.status === "DRAFT"
                          ? "Draft"
                          : story.status === "REJECTED"
                          ? "Rejected"
                          : story.status}
                      </span>
                    </div>

                    {story.status === "PUBLISHED_EMAGAZINE" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Published in official AKAM E-Magazine edition</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-emerald-200 text-emerald-800 hover:bg-emerald-50 shadow-xs"
                            onClick={() => openPreview(story)}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    )}

                    {story.status === "APPROVED_EMAGAZINE" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-gray-600 font-medium flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>Approved for AKAM E-Magazine edition (stored for periodical)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-gray-300 shadow-xs"
                            onClick={() => openPreview(story)}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    )}

                    {story.status === "APPROVED" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Published & live on works catalog</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/works/${story.slug || story.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              iconPosition="left"
                              className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                            >
                              View on Works
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Unpublished Actions Bar */}
                    {story.status === "UNPUBLISHED" && (
                      <div className="pt-3 border-t border-orange-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-orange-700 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>Unpublished by editorial</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/submit?id=${story.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              iconPosition="left"
                              className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-gray-300 shadow-xs"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            onClick={() => setStoryToDelete(story)}
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-xs"
                          >
                            Delete
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Send className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            disabled={actionLoadingId === story.id}
                            onClick={() => handleSubmitDraftForReview(story.id)}
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer shadow-xs"
                          >
                            {actionLoadingId === story.id ? "Submitting..." : "Re-submit for Review"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Pending Actions Bar (Preview, Edit & Delete) */}
                    {story.status === "PENDING" && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-amber-700 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>In editorial review queue</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-gray-300 shadow-xs"
                            onClick={() => openPreview(story)}
                          >
                            Preview
                          </Button>
                          <Link href={`/submit?id=${story.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              iconPosition="left"
                              className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-gray-300 shadow-xs"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            onClick={() => setStoryToDelete(story)}
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Draft Actions Bar */}
                    {(story.status === "DRAFT" || story.status === "REJECTED") && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-xs text-gray-500 italic">
                          {story.status === "DRAFT" ? "Saved Draft" : "Revision Required"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/submit?id=${story.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              iconPosition="left"
                              className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer border border-gray-300 shadow-xs"
                            >
                              Edit Draft
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            iconPosition="left"
                            onClick={() => setStoryToDelete(story)}
                            className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-xs"
                          >
                            Delete Draft
                          </Button>
                          {story.status === "DRAFT" && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Send className="w-3.5 h-3.5" />}
                              iconPosition="left"
                              disabled={actionLoadingId === story.id}
                              onClick={() => handleSubmitDraftForReview(story.id)}
                              className="h-9 px-4 text-xs font-semibold rounded-full cursor-pointer shadow-xs"
                            >
                              {actionLoadingId === story.id ? "Submitting..." : "Submit for Review"}
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
                    {storyToDelete.status === "PENDING"
                      ? "Delete Submission?"
                      : storyToDelete.status === "DRAFT"
                      ? "Delete Draft?"
                      : "Delete Work?"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-gray-800">
                      "{storyToDelete.title || "Untitled"}"
                    </span>
                    {storyToDelete.status === "PENDING" ? " from the review queue" : ""}
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStoryToDelete(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
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
                className="h-9 px-4 rounded-full text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer shadow-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={deletingId === storyToDelete.id}
                onClick={() => handleDeleteDraft(storyToDelete.id)}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                iconPosition="left"
              >
                {deletingId === storyToDelete.id
                  ? "Deleting..."
                  : storyToDelete.status === "PENDING"
                  ? "Delete Submission"
                  : storyToDelete.status === "DRAFT"
                  ? "Delete Draft"
                  : "Delete Work"}
              </Button>
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
                      ? "PUBLISHED WORK"
                      : previewStory.status === "DRAFT"
                      ? "DRAFT PREVIEW"
                      : "SUBMISSION PREVIEW"}
                  </span>
                  {previewStory.submissionType === "PAINTING" && (
                    <span className="bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Visual Arts
                    </span>
                  )}
                  {previewStory.submissionType === "VIDEO" && (
                    <span className="bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                  {previewStory.submissionType !== "PAINTING" && previewStory.submissionType !== "VIDEO" && previewStory.category && (
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
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Embed if VIDEO submission */}
            {previewStory.submissionType === "VIDEO" && (
              <div className="w-full max-w-3xl mx-auto mb-8 shrink-0 rounded-[24px] overflow-hidden shadow-md aspect-video bg-black relative flex items-center justify-center">
                {(() => {
                  const embed = previewStory.mediaUrl ? getAddSubmissionVideoEmbed(previewStory.mediaUrl) : null;
                  if (embed?.type === "direct") {
                    return (
                      <video
                        src={formatAssetUrl(embed.directUrl)}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    );
                  } else if (embed?.embedUrl) {
                    return (
                      <iframe
                        src={embed.embedUrl}
                        title="Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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

            {/* Visual Arts Display */}
            {previewStory.submissionType === "PAINTING" && (() => {
              const galleryImages: Array<{ src: string; alt: string }> = [];
              const seen = new Set<string>();

              if (previewStory.content) {
                const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
                let match;
                while ((match = imgRegex.exec(previewStory.content)) !== null) {
                  const url = match[2]?.trim();
                  if (url && !seen.has(url)) {
                    seen.add(url);
                    galleryImages.push({ src: url, alt: match[1] || previewStory.title || "Visual Arts" });
                  }
                }
              }

              if (previewStory.mediaUrl && !seen.has(previewStory.mediaUrl.trim())) {
                seen.add(previewStory.mediaUrl.trim());
                galleryImages.unshift({ src: previewStory.mediaUrl.trim(), alt: previewStory.title || "Primary Artwork" });
              }

              if (galleryImages.length === 0 && previewStory.coverImageUrl && !seen.has(previewStory.coverImageUrl.trim())) {
                galleryImages.push({ src: previewStory.coverImageUrl.trim(), alt: previewStory.title || "Cover Artwork" });
              }

              if (galleryImages.length === 0) return null;

              return (
                <div className="w-full max-w-3xl mx-auto mb-8 space-y-3">
                  <div className="relative w-full rounded-[24px] overflow-hidden bg-[#0A0D0C] border border-gray-200/80 shadow-sm flex items-center justify-center p-3 sm:p-4 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatAssetUrl(galleryImages[0].src)}
                      alt={galleryImages[0].alt}
                      className="w-full max-h-[550px] object-contain rounded-xl block"
                    />
                    <div className="absolute bottom-3 right-3 z-10 bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-xs pointer-events-none">
                      <Palette className="w-3.5 h-3.5 text-purple-300" />
                      <span>{galleryImages.length > 1 ? `${galleryImages.length} Images in Gallery` : "Original Artwork"}</span>
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={formatAssetUrl(img.src)} alt={img.alt} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            #{idx + 1} {idx === 0 ? "(Cover)" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Article Cover Image (Card style matching LatestStories) */}
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
              ) : previewStory.content && (
                renderStoryContent(previewStory.content)
              ) }
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-gray-100 mt-auto shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={closePreview}
                className="h-9 px-4 rounded-full text-xs font-semibold justify-center border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer shrink-0"
              >
                Close Preview
              </Button>

              {previewStory.status === "APPROVED" && (
                <Link href={`/works/${previewStory.slug || previewStory.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 px-4 rounded-full text-xs font-semibold justify-center bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
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
