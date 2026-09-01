"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Clock,
  BookOpen,
  Users,
  Bell,
  Settings,
  Menu,
  X,
  Search,
  ArrowLeft,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Trash2,
  RefreshCw,
  LogOut,
  Calendar,
  Tag,
  Plus,
  ChevronLeft,
  Flag,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface PendingStory {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  coverImageUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
}

interface RosterUser {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: "READER" | "AUTHOR" | "EDITOR" | "ADMIN";
  createdAt?: string;
}

interface ReportItem {
  id: string;
  storyId?: string | null;
  commentId?: string | null;
  storyTitle?: string | null;
  storySlug?: string | null;
  commentContent?: string | null;
  reporterId: string;
  reporterName: string | null;
  reporterEmail: string;
  reason: string;
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  updatedAt: string;
}

type TabType = "queue" | "reports" | "catalog" | "authors" | "categories" | "notifications" | "settings";

function PaginationFooter({
  meta,
  onPageChange,
}: {
  meta: { total: number; page: number; limit: number; totalPages: number };
  onPageChange: (newPage: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 mt-6 font-poppins">
      <p className="text-xs text-gray-500 font-medium">
        Showing <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
        <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
        <span className="font-semibold text-gray-900">{meta.total}</span> entries
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          className="border border-gray-200 text-xs px-3 py-1.5 cursor-pointer disabled:opacity-40"
        >
          Previous
        </Button>

        {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pNum) => (
          <button
            key={pNum}
            onClick={() => onPageChange(pNum)}
            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              pNum === meta.page
                ? "bg-black text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pNum}
          </button>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          className="border border-gray-200 text-xs px-3 py-1.5 cursor-pointer disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function EditorialDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = (searchParams.get("tab") as TabType) || "queue";
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl);
  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const currentTab = (searchParams.get("tab") as TabType) || "queue";
    const pageNum = parseInt(searchParams.get("page") || "1", 10);
    setActiveTab(currentTab);
    setCurrentPage(pageNum);
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    setMobileSidebarOpen(false);
    router.push(`/editorial?tab=${tab}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    router.push(`/editorial?tab=${activeTab}&page=${newPage}`);
  };

  // Auth & RBAC State
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data & Metadata State (Server-Side Paginated & Searched)
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [queueMeta, setQueueMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [allStories, setAllStories] = useState<PendingStory[]>([]);
  const [catalogMeta, setCatalogMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [allUsers, setAllUsers] = useState<RosterUser[]>([]);
  const [authorsMeta, setAuthorsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoriesMeta, setCategoriesMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [reportsMeta, setReportsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [reportStatusFilter, setReportStatusFilter] = useState("ALL");
  const [reportTypeFilter, setReportTypeFilter] = useState("ALL");

  const [newCatName, setNewCatName] = useState("");
  const [newCatMalName, setNewCatMalName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [editorsNoteTitle, setEditorsNoteTitle] = useState("Editor's Note");
  const [editorsNoteContent, setEditorsNoteContent] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<PendingStory | null>(null);
  const [rejectingStory, setRejectingStory] = useState<PendingStory | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const checkAuthAndFetchData = async () => {
    setAuthChecking(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/me`);
      if (res.ok) {
        const uData = await res.json();
        setUser(uData);
        localStorage.setItem("akam_user", JSON.stringify(uData));

        if (['EDITOR', 'ADMIN'].includes(uData.role)) {
          await fetchDashboardData(activeTab, currentPage, searchQuery);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Auth check error", e);
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchDashboardData = async (
    tab: TabType = activeTab,
    page: number = currentPage,
    query: string = searchQuery
  ) => {
    setLoading(true);
    try {
      if (tab === "queue") {
        const qSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const qRes = await apiFetch(`${API_BASE_URL}/stories/queue/pending?page=${page}&limit=10${qSearch}`);
        if (qRes.ok) {
          const json = await qRes.json();
          if (json.data) {
            setPendingStories(json.data);
            setQueueMeta(json.meta);
          } else {
            setPendingStories(json);
          }
        }
      } else if (tab === "reports") {
        const rStatus = reportStatusFilter !== "ALL" ? `&status=${reportStatusFilter}` : '';
        const rType = reportTypeFilter !== "ALL" ? `&type=${reportTypeFilter}` : '';
        const rSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const rRes = await apiFetch(`${API_BASE_URL}/editorial/reports?page=${page}&limit=10${rStatus}${rType}${rSearch}`);
        if (rRes.ok) {
          const json = await rRes.json();
          if (json.data) {
            setReportsList(json.data);
            setReportsMeta(json.meta);
          } else {
            setReportsList(Array.isArray(json) ? json : []);
          }
        }
      } else if (tab === "catalog") {
        const cSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const cRes = await apiFetch(`${API_BASE_URL}/stories?status=APPROVED&page=${page}&limit=10${cSearch}`);
        if (cRes.ok) {
          const json = await cRes.json();
          if (json.data) {
            setAllStories(json.data);
            setCatalogMeta(json.meta);
          } else {
            setAllStories(json);
          }
        }
      } else if (tab === "authors") {
        const aSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const uRes = await apiFetch(`${API_BASE_URL}/users?page=${page}&limit=10${aSearch}`);
        if (uRes.ok) {
          const json = await uRes.json();
          if (json.data) {
            setAllUsers(json.data);
            setAuthorsMeta(json.meta);
          } else {
            setAllUsers(json);
          }
        }
      } else if (tab === "categories") {
        const catRes = await apiFetch(`${API_BASE_URL}/categories?page=${page}&limit=10`);
        if (catRes.ok) {
          const json = await catRes.json();
          if (json.data) {
            setCategoriesList(json.data);
            setCategoriesMeta(json.meta);
          } else {
            setCategoriesList(json);
          }
        }
      } else if (tab === "settings") {
        const noteRes = await apiFetch(`${API_BASE_URL}/settings/editors-note`);
        if (noteRes.ok) {
          const json = await noteRes.json();
          setEditorsNoteTitle(json.title || "Editor's Note");
          setEditorsNoteContent(json.note || "");
        }
      }
    } catch (err) {
      console.error("Failed to load section data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditorsNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/settings/editors-note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorsNoteTitle.trim(),
          note: editorsNoteContent.trim(),
        }),
      });

      if (res.ok) {
        setFeedbackMessage("Editor's Note title and message updated successfully!");
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else {
        alert("Failed to update Editor's Note");
      }
    } catch (err) {
      console.error("Error saving Editor's Note", err);
      alert("Error updating Editor's Note");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (user && ['EDITOR', 'ADMIN'].includes(user.role)) {
      fetchDashboardData(activeTab, currentPage, searchQuery);
    }
  }, [activeTab, currentPage, reportStatusFilter, reportTypeFilter]);

  // Server-side debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && ['EDITOR', 'ADMIN'].includes(user.role)) {
        fetchDashboardData(activeTab, 1, searchQuery);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleReview = async (storyId: string, decision: "APPROVED" | "REJECTED", note?: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, rejectionNote: note }),
      });

      if (res.ok) {
        setFeedbackMessage(
          decision === "APPROVED"
            ? "Story approved and published!"
            : "Story rejected with feedback sent to author."
        );
        setSelectedStory(null);
        setRejectingStory(null);
        setRejectionNote("");
        fetchDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to review story");
      }
    } catch (err) {
      console.error(err);
      alert("Error reviewing story");
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbackMessage(`Report marked as ${status.toLowerCase()}.`);
        fetchDashboardData("reports", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to update report status");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating report status");
    }
  };

  const handleDeleteCommentFromReport = async (commentId: string, reportId: string) => {
    if (!confirm("Are you sure you want to delete this reported comment?")) return;
    setActionLoading(true);
    try {
      const delRes = await apiFetch(`${API_BASE_URL}/stories/comments/${commentId}`, {
        method: "DELETE",
      });
      if (delRes.ok) {
        await apiFetch(`${API_BASE_URL}/editorial/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
        });
        setFeedbackMessage("Reported comment deleted successfully.");
        fetchDashboardData("reports", currentPage, searchQuery);
      } else {
        alert("Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting reported comment", err);
      alert("Error deleting reported comment");
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setFeedbackMessage("User role updated successfully!");
        fetchDashboardData();
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to update user role");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating role");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbackMessage("Story deleted successfully.");
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpublishStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to unpublish this story? It will move out of the public catalog.")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/stories/${storyId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "REJECTED", rejectionNote: "Unpublished from public catalog by Editorial Board." }),
      });
      if (res.ok) {
        setFeedbackMessage("Story unpublished successfully.");
        fetchDashboardData(activeTab, currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to unpublish story");
      }
    } catch (err) {
      console.error(err);
      alert("Error unpublishing story");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          malName: newCatMalName.trim() || undefined,
          description: newCatDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatMalName("");
        setNewCatDesc("");
        setFeedbackMessage(`Category "${newCatName.trim()}" created successfully!`);
        fetchDashboardData();
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create category");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating category");
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/categories/${catId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbackMessage("Category deleted successfully.");
        fetchDashboardData();
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to delete category");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting category");
    }
  };

  const renderStoryContent = (contentStr: string) => {
    if (!contentStr || !contentStr.trim()) {
      return <p className="text-gray-400 italic py-4">No narrative text content submitted for this story.</p>;
    }

    let processedContent = contentStr.replace(
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
        if (textChunk.trim()) {
          parts.push({ type: "text", value: textChunk });
        }
      }

      const src = match[1];
      if (src) {
        parts.push({ type: "image", src, alt: "Story Inline Image" });
      }

      lastIndex = imgRegex.lastIndex;
    }

    if (lastIndex < processedContent.length) {
      const textChunk = processedContent.substring(lastIndex);
      if (textChunk.trim()) {
        parts.push({ type: "text", value: textChunk });
      }
    }

    if (parts.length === 0) {
      parts.push({ type: "text", value: processedContent });
    }

    return (
      <div className="space-y-4">
        {parts.map((part, idx) => {
          if (part.type === "text") {
            const isHtml = /<[a-z][\s\S]*>/i.test(part.value);
            if (isHtml) {
              return (
                <div
                  key={idx}
                  className="prose max-w-none text-gray-900 text-base leading-snug sm:leading-relaxed font-normal whitespace-pre-wrap [&_p]:mb-2 [&_p]:text-[#1A1A1A]"
                  dangerouslySetInnerHTML={{ __html: part.value }}
                />
              );
            }
            return (
              <p key={idx} className="text-gray-900 text-base leading-snug sm:leading-relaxed font-normal whitespace-pre-wrap tracking-tight">
                {part.value}
              </p>
            );
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
          <p className="text-gray-900 text-sm font-semibold tracking-wider">Verifying Editorial Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white font-poppins flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#040706] text-[#E4F953] rounded-full flex items-center justify-center mb-4 shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editorial Portal Access</h1>
        <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
          Sign in with your editor credentials to access the submission review queue and editorial management system.
        </p>
        <Button variant="primary" size="lg" onClick={() => setAuthModalOpen(true)} className="px-8 py-3 cursor-pointer">
          Sign In as Editor
        </Button>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => checkAuthAndFetchData()}
        />
      </div>
    );
  }

  if (!['EDITOR', 'ADMIN'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-white font-poppins flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <span className="bg-[#E4F953] text-[#040706] font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-xl mb-3">
          Role: {user.role}
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editorial Privileges Required</h1>
        <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
          Your account does not currently have Editorial or Admin permissions to review content queue.
        </p>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="secondary" size="md" className="border border-gray-300">Return to Homepage</Button>
          </Link>
          <Link href="/profile">
            <Button variant="primary" size="md">My Author Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-white border-b border-gray-200 text-gray-900 p-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase px-2.5 py-1 rounded-xl">
            EDITORIAL
          </span>
          <span className="font-bold text-sm text-gray-900">AKAM Digital</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-gray-700 hover:text-black focus:outline-none cursor-pointer"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 w-64 md:w-72 h-screen bg-white border-r border-gray-200 text-gray-900 flex flex-col justify-between p-6 transition-all duration-300 shadow-xs ${
          mobileSidebarOpen ? "left-0" : "-left-full md:left-0"
        }`}
      >
        <div>
          {/* Logo & Space Identifier */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
              <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl inline-block mb-1.5 shadow-xs">
                EDITORIAL WORKSPACE
              </span>
              <h2 className="text-xl font-bold text-gray-950 tracking-tight">AKAM Digital</h2>
            </div>
            <Link href="/" title="View Public Site" className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Page Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => handleTabChange("queue")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "queue"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Pending Review Queue</span>
              </div>
              {queueMeta.total > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "queue" ? "bg-[#E4F953] text-[#040706]" : "bg-amber-500 text-white"
                  }`}
                >
                  {queueMeta.total}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("reports")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-rose-500" />
                <span>Reported Content</span>
              </div>
              {reportsList.filter((r) => r.status === "PENDING").length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  {reportsList.filter((r) => r.status === "PENDING").length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("catalog")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Published Catalog</span>
            </button>

            <button
              onClick={() => handleTabChange("authors")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "authors"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Author Roster ({authorsMeta.total || allUsers.length})</span>
            </button>

            <button
              onClick={() => handleTabChange("categories")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Story Categories</span>
            </button>

            <button
              onClick={() => handleTabChange("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Editorial Alerts</span>
            </button>

            <button
              onClick={() => handleTabChange("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Home Page Editor's Note</span>
            </button>
          </nav>
        </div>

        {/* User Info & Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{user.name || user.email.split("@")[0]}</p>
                <span className="text-[10px] text-gray-500 font-semibold uppercase">{user.role}</span>
              </div>
            </div>
          </div>

          <Link href="/">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} iconPosition="left" className="w-full border border-gray-300 shadow-xs cursor-pointer">
              Return to Website
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
              {activeTab === "queue" && "Pending Review Queue"}
              {activeTab === "catalog" && "Published Story Catalog"}
              {activeTab === "authors" && "User & Author Roster"}
              {activeTab === "categories" && "Story Categories & Taxonomy"}
              {activeTab === "notifications" && "Editorial Alerts & Logs"}
              {activeTab === "settings" && "Home Page Editor's Note"}
            </h1>
            <p className="text-xs sm:text-sm text-[#646464] mt-1">
              {activeTab === "queue" && "Review submitted stories, evaluate formatting, and publish or reject content."}
              {activeTab === "catalog" && "Browse all active stories currently published on AKAM Digital."}
              {activeTab === "authors" && "Manage all registered platform users, writers, and role permissions."}
              {activeTab === "categories" && "Manage category labels, Malayalam translations, and genre classifications."}
              {activeTab === "notifications" && "Event logs for story submissions, approvals, and rejections."}
              {activeTab === "settings" && "Update the featured Editor's Note title and message displayed on the main homepage."}
            </p>
          </div>

          {/* Quick Action Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            iconPosition="left"
            onClick={() => checkAuthAndFetchData()}
            className="self-start sm:self-auto border border-gray-300 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
          >
            Refresh Data
          </Button>
        </div>

        {feedbackMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* TAB 1: PENDING QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pending queue by title, category or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
              />
            </div>

            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
              </div>
            ) : pendingStories.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[28px] border border-gray-200 p-8 shadow-xs">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-1">Queue Clean & Up to Date!</h3>
                <p className="text-sm text-gray-500">There are no pending story submissions matching your search criteria.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pendingStories.map((story) => (
                    <div
                      key={story.id}
                      className="flex flex-col bg-white border border-gray-200 rounded-2xl p-3.5 hover:shadow-md transition-all duration-300 group/card shadow-xs"
                    >
                      {/* Story Cover */}
                      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-xs">
                        <Image
                          src={story.coverImageUrl || "/images/stories/ramachi.jpg"}
                          alt={story.title}
                          fill
                          unoptimized
                          className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 z-10 flex gap-1.5 flex-wrap">
                          <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs">
                            PENDING
                          </span>
                          {story.category && (
                            <span className="bg-black/80 backdrop-blur-xs text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs">
                              {story.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-950 tracking-tight leading-snug line-clamp-2 group-hover/card:text-gray-700 transition-colors">
                            {story.title}
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">By {story.authorName || story.authorEmail}</span>
                          </p>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3 h-3" />}
                            onClick={() => setSelectedStory(story)}
                            className="flex-1 border border-gray-300 text-[11px] py-1 px-2 justify-center cursor-pointer shadow-xs font-semibold"
                          >
                            Read
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3 h-3" />}
                            onClick={() => handleReview(story.id, "APPROVED")}
                            className="flex-1 text-[11px] py-1 px-2 justify-center cursor-pointer shadow-xs font-semibold"
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={<XCircle className="w-3 h-3" />}
                            onClick={() => setRejectingStory(story)}
                            className="text-[11px] py-1 px-2 justify-center cursor-pointer text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <PaginationFooter meta={queueMeta} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        )}

        {/* TAB: REPORTED CONTENT */}
        {activeTab === "reports" && (
          <div className="space-y-6 font-poppins">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Content Moderation & Flagged Reports</h3>
                <p className="text-xs text-gray-500">Review user complaints, copyright flags, and content violations.</p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={reportStatusFilter}
                  onChange={(e) => {
                    setReportStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none focus:border-black shadow-xs cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>

                <select
                  value={reportTypeFilter}
                  onChange={(e) => {
                    setReportTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none focus:border-black shadow-xs cursor-pointer"
                >
                  <option value="ALL">All Report Types</option>
                  <option value="STORY">Story Reports</option>
                  <option value="COMMENT">Comment Reports</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by title, comment, email, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
              />
            </div>

            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[28px] border border-gray-200 p-8 shadow-xs">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-1">No Reported Content!</h3>
                <p className="text-sm text-gray-500">There are currently no flagged stories or user reports matching your filter criteria.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {reportsList.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            report.status === "PENDING"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : report.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}>
                            {report.status}
                          </span>

                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            report.commentId ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}>
                            {report.commentId ? "Comment Report" : "Story Report"}
                          </span>

                          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                            Reason: {report.reason}
                          </span>

                          <span className="text-xs text-gray-400 font-medium">
                            Reported on {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Flagged Content Preview */}
                        {report.commentContent && (
                          <div className="p-3 bg-rose-50/60 border-l-4 border-rose-500 rounded-r-xl text-xs">
                            <span className="font-bold text-rose-700 text-[10px] uppercase tracking-wider block mb-0.5">
                              Flagged Comment Content:
                            </span>
                            <p className="italic text-gray-800 font-medium leading-relaxed">
                              "{report.commentContent}"
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-bold text-gray-950">
                            Target Story:{" "}
                            <Link href={`/stories/${report.storySlug || report.storyId}`} className="text-black underline hover:text-gray-700">
                              {report.storyTitle || report.storyId}
                            </Link>
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Reported by: <span className="font-semibold text-gray-800">{report.reporterName || report.reporterEmail}</span>
                          </p>
                          {report.details && (
                            <div className="mt-2 text-xs text-gray-600 border-l-2 border-gray-300 pl-3 py-0.5 italic">
                              "{report.details}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Standardized Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                        <Link href={`/stories/${report.storySlug || report.storyId}${report.commentId ? '#comments-section' : ''}`}>
                          <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />} className="text-xs font-semibold">
                            {report.commentId ? "View Comment" : "View Story"}
                          </Button>
                        </Link>

                        {report.status === "PENDING" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateReportStatus(report.id, "DISMISSED")}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            Dismiss
                          </Button>
                        )}

                        {report.commentId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeleteCommentFromReport(report.commentId!, report.id)}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer"
                          >
                            Delete Comment
                          </Button>
                        ) : report.storyId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeleteStory(report.storyId!)}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer"
                          >
                            Delete Story
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <PaginationFooter meta={reportsMeta} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        )}

        {/* TAB 2: PUBLISHED CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalog by title, category or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
              />
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="block sm:hidden space-y-4">
              {allStories.map((s) => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug">{s.title}</h3>
                      {s.category && (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5 block">
                          Category: {s.category}
                        </span>
                      )}
                    </div>
                    <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase px-2.5 py-1 rounded-xl shrink-0 shadow-xs">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Author: <strong className="text-gray-700">{s.authorName || s.authorEmail}</strong></span>
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </p>
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedStory(s)}
                      className="flex-1 justify-center border border-gray-300 text-xs py-2 cursor-pointer"
                    >
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnpublishStory(s.id)}
                      className="flex-1 justify-center text-xs py-2 text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold cursor-pointer"
                    >
                      Unpublish
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStory(s.id)}
                      className="flex-1 justify-center text-xs py-2 text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Story Title</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Author</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Created Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {allStories.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">{s.title}</td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{s.category || "General"}</td>
                        <td className="py-4 px-6 text-gray-600">{s.authorName || s.authorEmail}</td>
                        <td className="py-4 px-6">
                          <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase px-3 py-1 rounded-xl">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedStory(s)}
                            className="border border-gray-300 text-xs px-3 py-1 cursor-pointer"
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpublishStory(s.id)}
                            className="text-xs px-3 py-1 text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold cursor-pointer"
                          >
                            Unpublish
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStory(s.id)}
                            className="text-xs px-3 py-1 text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationFooter meta={catalogMeta} onPageChange={handlePageChange} />
          </div>
        )}

        {/* TAB 3: USER & AUTHOR ROSTER */}
        {activeTab === "authors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user roster by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
                />
              </div>

              <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
                Total Registered Users: {authorsMeta.total || allUsers.length}
              </span>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="block sm:hidden space-y-4">
              {allUsers.map((u) => (
                <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                        ) : (
                          <span>{(u.name || u.email)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{u.name || "No name set"}</h4>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs shrink-0 ${
                        u.role === "ADMIN"
                          ? "bg-rose-100 text-rose-800"
                          : u.role === "EDITOR"
                          ? "bg-amber-100 text-amber-800"
                          : u.role === "AUTHOR"
                          ? "bg-[#E4F953] text-[#040706]"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-400">Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">Role:</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-black cursor-pointer shadow-xs"
                      >
                        <option value="READER">READER</option>
                        <option value="AUTHOR">AUTHOR</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Role Tier</th>
                      <th className="py-4 px-6">Joined Date</th>
                      <th className="py-4 px-6 text-right">Update Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.avatarUrl ? (
                                <Image src={u.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                              ) : (
                                <span>{(u.name || u.email)[0].toUpperCase()}</span>
                              )}
                            </div>
                            <span className="truncate max-w-[150px]">{u.name || "No name set"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{u.email}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-xs whitespace-nowrap ${
                              u.role === "ADMIN"
                                ? "bg-rose-100 text-rose-800"
                                : u.role === "EDITOR"
                                ? "bg-amber-100 text-amber-800"
                                : u.role === "AUTHOR"
                                ? "bg-[#E4F953] text-[#040706]"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-black cursor-pointer shadow-xs"
                          >
                            <option value="READER">READER</option>
                            <option value="AUTHOR">AUTHOR</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationFooter meta={authorsMeta} onPageChange={handlePageChange} />
          </div>
        )}

        {/* TAB 4: CATEGORY MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-8">
            {/* Add Category Card */}
            <div className="bg-white border border-gray-200 rounded-[28px] p-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-950 mb-1">Add New Platform Category</h3>
              <p className="text-xs text-gray-500 mb-6">Create editorial taxonomy labels used across story submission and homepage filtering.</p>

              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Science & Fiction"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Brief genre note..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-4 h-4" />}
                      className="shrink-0 cursor-pointer shadow-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Existing Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoriesList.map((cat) => (
                <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">{cat.description}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span>Taxonomy Active</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <PaginationFooter meta={categoriesMeta} onPageChange={handlePageChange} />
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="bg-white border border-gray-200 rounded-[28px] p-6 sm:p-8 shadow-xs">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Editorial Logs & Event Stream</h3>
            <p className="text-xs text-gray-500 mb-6">Real-time alerts triggered on submission, approval, or rejection.</p>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 font-poppins">
            {/* Editor's Note Management Card */}
            <div className="bg-white border border-gray-200 rounded-[28px] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#E4F953] flex items-center justify-center font-bold text-black text-lg shadow-xs">
                  📝
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-950">Home Page Editor's Note</h3>
                  <p className="text-xs text-gray-500">Edit the featured Editor's Note title and message displayed on the main homepage. Background image remains static.</p>
                </div>
              </div>

              <form onSubmit={handleSaveEditorsNote} className="space-y-4 max-w-2xl mt-6">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                    Editor's Note Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editorsNoteTitle}
                    onChange={(e) => setEditorsNoteTitle(e.target.value)}
                    placeholder="e.g. Editor's Note"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                    Note Content / Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={editorsNoteContent}
                    onChange={(e) => setEditorsNoteContent(e.target.value)}
                    placeholder="Write the monthly editorial note to readers..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black leading-relaxed shadow-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingSettings}
                    className="px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {savingSettings ? "Saving Changes..." : "Save Editor's Note"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Reader Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[32px] p-5 sm:p-8 overflow-y-auto shadow-2xl flex flex-col font-poppins">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs">
                    REVIEWING SUBMISSION
                  </span>
                  {selectedStory.category && (
                    <span className="bg-black text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-xs">
                      Category: {selectedStory.category}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 mt-2">{selectedStory.title}</h2>
                <p className="text-xs text-gray-500 mt-1">By {selectedStory.authorName || selectedStory.authorEmail}</p>
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

            {/* Robust Content Parser */}
            <div className="mb-8">
              {renderStoryContent(selectedStory.content)}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 flex-col sm:flex-row w-full">
              <Button variant="secondary" size="md" onClick={() => setSelectedStory(null)} className="w-full sm:w-auto justify-center border border-gray-300">
                Close Preview
              </Button>
              {selectedStory.status === "PENDING" && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      const s = selectedStory;
                      setSelectedStory(null);
                      setRejectingStory(s);
                    }}
                    className="w-full sm:w-auto justify-center text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Reject with Note
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleReview(selectedStory.id, "APPROVED")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto justify-center"
                  >
                    Approve & Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-5 sm:p-8 shadow-2xl font-poppins">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Story</h3>
            <p className="text-xs text-gray-600 mb-4">
              Provide feedback for <span className="font-semibold">{rejectingStory.title}</span> author.
            </p>

            <textarea
              rows={4}
              placeholder="Explain why this content needs revision..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-black mb-4"
            />

            <div className="flex items-center justify-end gap-3 flex-col sm:flex-row w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingStory(null)}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReview(rejectingStory.id, "REJECTED", rejectionNote)}
                disabled={actionLoading}
                className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-700 text-white border-none shadow-xs"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorialDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-poppins">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
            <p className="text-gray-900 text-sm font-semibold tracking-wider">Loading Editorial Workspace...</p>
          </div>
        </div>
      }
    >
      <EditorialDashboardContent />
    </Suspense>
  );
}
