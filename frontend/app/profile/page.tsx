"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Edit2, Upload, BookOpen, Clock, FileCheck, Shield, ChevronRight, LogOut, Send, FileText, CheckCircle2, Filter, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

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
  coverImageUrl: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStoryToDelete(null);
      }
    };
    if (storyToDelete) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [storyToDelete]);

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
    window.dispatchEvent(new Event("akam_user_updated"));
    router.push("/");
  };

  const filteredStories = statusFilter === "ALL"
    ? stories
    : stories.filter((s) => s.status === statusFilter);

  const draftCount = stories.filter((s) => s.status === "DRAFT").length;
  const pendingCount = stories.filter((s) => s.status === "PENDING").length;
  const approvedCount = stories.filter((s) => s.status === "APPROVED").length;

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
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
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
                <span>My Stories & Drafts</span>
              </h2>
              <Link href="/submit">
                <Button variant="primary" size="md" className="text-xs font-semibold shadow-xs">
                  Write New Story
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
                  All Stories ({stories.length})
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
                    <option value="ALL">All Stories ({stories.length})</option>
                    <option value="DRAFT">Drafts ({draftCount})</option>
                    <option value="PENDING">Pending Queue ({pendingCount})</option>
                    <option value="APPROVED">Published ({approvedCount})</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <div className="p-12 bg-gray-50 border border-gray-200 rounded-[28px] text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No stories found under this filter.</p>
                <Link href="/submit">
                  <Button variant="secondary" size="md" className="border border-gray-300">
                    Create New Story
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
                            : story.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : story.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {story.status}
                      </span>
                    </div>

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
    </div>
  );
}
