"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const EditionFlipbook = dynamic(() => import("@/components/EditionFlipbook"), { ssr: false });
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
  Archive,
  Tag,
  Plus,
  ChevronLeft,
  Flag,
  Video,
  Mail,
  MessageSquare,
  Inbox,
  FileText,
  Edit3,
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
  isFeatured?: boolean;
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

interface ContactInquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  updatedAt: string;
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type TabType = "queue" | "reports" | "inquiries" | "catalog" | "authors" | "categories" | "notifications" | "settings" | "editors-note" | "communities" | "events" | "books" | "media" | "editions";

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

  const [inquiriesList, setInquiriesList] = useState<ContactInquiryItem[]>([]);
  const [inquiriesMeta, setInquiriesMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryItem | null>(null);

  // Flipbook Preview State for Masika Editions
  const [openFlipbookEdition, setOpenFlipbookEdition] = useState<any | null>(null);

  // Community Moderation State
  const [commReportsList, setCommReportsList] = useState<any[]>([]);
  const [commReportsMeta, setCommReportsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [communitiesList, setCommunitiesList] = useState<any[]>([]);
  const [commSubTab, setCommSubTab] = useState<"reports" | "communities">("communities");

  // Create Community State
  const [showAddCommModal, setShowAddCommModal] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommSlug, setNewCommSlug] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommColor, setNewCommColor] = useState("#21B573");
  const [creatingComm, setCreatingComm] = useState(false);

  // Events & Workshops State
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [eventsMeta, setEventsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [eventFilterType, setEventFilterType] = useState<string>("ALL");
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedEventForReg, setSelectedEventForReg] = useState<any | null>(null);
  const [registrationsList, setRegistrationsList] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormType, setEventFormType] = useState<"READING_SESSION" | "DISCUSSION" | "WORKSHOP" | "PAST_ARCHIVE">("READING_SESSION");
  const [eventFormTitle, setEventFormTitle] = useState("");
  const [eventFormDesc, setEventFormDesc] = useState("");
  const [eventFormLoc, setEventFormLoc] = useState("");
  const [eventFormTime, setEventFormTime] = useState("");
  const [eventFormDay, setEventFormDay] = useState("");
  const [eventFormMonthYear, setEventFormMonthYear] = useState("");
  const [eventFormImage, setEventFormImage] = useState("");
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const [eventFormRegisterHref, setEventFormRegisterHref] = useState("");
  const [eventFormPublished, setEventFormPublished] = useState(true);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedEventForArchive, setSelectedEventForArchive] = useState<any | null>(null);
  const [archiveImage, setArchiveImage] = useState("");
  const [uploadingArchiveImage, setUploadingArchiveImage] = useState(false);
  const [archivingEvent, setArchivingEvent] = useState(false);

  // Upcoming Book Releases State
  const [booksList, setBooksList] = useState<any[]>([]);
  const [booksMeta, setBooksMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookFormTitle, setBookFormTitle] = useState("");
  const [bookFormAuthor, setBookFormAuthor] = useState("");
  const [bookFormEditionTag, setBookFormEditionTag] = useState("Print Edition");
  const [bookFormDesc, setBookFormDesc] = useState("");
  const [bookFormCoverImage, setBookFormCoverImage] = useState("");
  const [bookFormPreorderLink, setBookFormPreorderLink] = useState("");
  const [bookFormPublished, setBookFormPublished] = useState(true);
  const [submittingBook, setSubmittingBook] = useState(false);

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookFormTitle("");
    setBookFormAuthor("");
    setBookFormEditionTag("Print Edition");
    setBookFormDesc("");
    setBookFormCoverImage("");
    setBookFormPreorderLink("");
    setBookFormPublished(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormTitle.trim() || !bookFormAuthor.trim() || !bookFormDesc.trim()) return;
    setSubmittingBook(true);
    try {
      const payload: any = {
        title: bookFormTitle.trim(),
        author: bookFormAuthor.trim(),
        editionTag: bookFormEditionTag.trim() || "Print Edition",
        description: bookFormDesc.trim(),
        isPublished: bookFormPublished,
      };
      if (bookFormCoverImage.trim()) payload.coverImage = bookFormCoverImage.trim();
      if (bookFormPreorderLink.trim()) payload.preorderLink = bookFormPreorderLink.trim();

      const url = editingBookId
        ? `${API_BASE_URL}/editorial/books/${editingBookId}`
        : `${API_BASE_URL}/editorial/books`;
      const method = editingBookId ? "PATCH" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedbackMessage(editingBookId ? "Book release updated successfully!" : "Book release created successfully!");
        setShowAddBookModal(false);
        resetBookForm();
        fetchDashboardData("books", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save book release: ${errData.message || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Failed to save book release", err);
      alert(`Error saving book release: ${err.message || err}`);
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleTogglePublishBook = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/books/${id}/toggle-publish`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFeedbackMessage("Book release publication status updated.");
        fetchDashboardData("books", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle publish book", err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book release?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/books/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbackMessage("Book release deleted successfully.");
        fetchDashboardData("books", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete book", err);
    }
  };

  // Editions (Previous Editions) State
  const [editionsList, setEditionsList] = useState<any[]>([]);
  const [editionsMeta, setEditionsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [showAddEditionModal, setShowAddEditionModal] = useState(false);
  const [editingEditionId, setEditingEditionId] = useState<string | null>(null);
  const [editionFormTitle, setEditionFormTitle] = useState("");
  const [editionFormPdfUrl, setEditionFormPdfUrl] = useState("");
  const [editionFormCoverImage, setEditionFormCoverImage] = useState("");
  const [editionFormSortOrder, setEditionFormSortOrder] = useState(0);
  const [editionFormPublished, setEditionFormPublished] = useState(true);
  const [submittingEdition, setSubmittingEdition] = useState(false);
  const [uploadingEditionPdf, setUploadingEditionPdf] = useState(false);
  const [uploadingEditionCover, setUploadingEditionCover] = useState(false);

  const resetEditionForm = () => {
    setEditingEditionId(null);
    setEditionFormTitle("");
    setEditionFormPdfUrl("");
    setEditionFormCoverImage("");
    setEditionFormSortOrder(0);
    setEditionFormPublished(true);
  };

  const handleEditionPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditionPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch(`${API_BASE_URL}/uploads/pdf`, { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setEditionFormPdfUrl(json.url);
      } else {
        alert("Failed to upload PDF. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading edition PDF", err);
      alert("Error uploading PDF.");
    } finally {
      setUploadingEditionPdf(false);
    }
  };

  const handleEditionCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditionCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch(`${API_BASE_URL}/uploads/image`, { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setEditionFormCoverImage(json.url);
      } else {
        alert("Failed to upload cover image.");
      }
    } catch (err) {
      console.error("Error uploading cover image", err);
      alert("Error uploading cover image.");
    } finally {
      setUploadingEditionCover(false);
    }
  };

  const handleSaveEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionFormTitle.trim() || !editionFormPdfUrl.trim()) return;
    setSubmittingEdition(true);
    try {
      const payload: any = {
        title: editionFormTitle.trim(),
        pdfUrl: editionFormPdfUrl.trim(),
        isPublished: editionFormPublished,
        sortOrder: editionFormSortOrder,
      };
      if (editionFormCoverImage.trim()) payload.coverImage = editionFormCoverImage.trim();

      const url = editingEditionId
        ? `${API_BASE_URL}/editorial/editions/${editingEditionId}`
        : `${API_BASE_URL}/editorial/editions`;
      const method = editingEditionId ? "PATCH" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedbackMessage(editingEditionId ? "Edition updated successfully!" : "Edition created successfully!");
        setShowAddEditionModal(false);
        resetEditionForm();
        fetchDashboardData("editions", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save edition: ${errData.message || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Error saving edition: ${err.message || err}`);
    } finally {
      setSubmittingEdition(false);
    }
  };

  const handleTogglePublishEdition = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/editions/${id}/toggle-publish`, { method: "PATCH" });
      if (res.ok) {
        setFeedbackMessage("Edition publication status updated.");
        fetchDashboardData("editions", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle publish edition", err);
    }
  };

  const handleDeleteEdition = async (id: string) => {
    if (!confirm("Are you sure you want to delete this edition?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/editions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbackMessage("Edition deleted successfully.");
        fetchDashboardData("editions", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete edition", err);
    }
  };

  // Media Showcase State
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaMeta, setMediaMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaFormTitle, setMediaFormTitle] = useState("");
  const [mediaFormCategory, setMediaFormCategory] = useState("interviews");
  const [mediaFormYoutubeUrl, setMediaFormYoutubeUrl] = useState("");
  const [mediaFormDesc, setMediaFormDesc] = useState("");
  const [mediaFormPublished, setMediaFormPublished] = useState(true);
  const [mediaFormFeatured, setMediaFormFeatured] = useState(false);
  const [submittingMedia, setSubmittingMedia] = useState(false);

  const resetMediaForm = () => {
    setEditingMediaId(null);
    setMediaFormTitle("");
    setMediaFormCategory("interviews");
    setMediaFormYoutubeUrl("");
    setMediaFormDesc("");
    setMediaFormPublished(true);
    setMediaFormFeatured(false);
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFormTitle.trim() || !mediaFormYoutubeUrl.trim() || !mediaFormDesc.trim()) return;
    setSubmittingMedia(true);
    try {
      const payload = {
        title: mediaFormTitle.trim(),
        category: mediaFormCategory,
        youtubeUrl: mediaFormYoutubeUrl.trim(),
        description: mediaFormDesc.trim(),
        isPublished: mediaFormPublished,
        isFeatured: mediaFormFeatured,
      };

      const url = editingMediaId
        ? `${API_BASE_URL}/editorial/media/${editingMediaId}`
        : `${API_BASE_URL}/editorial/media`;
      const method = editingMediaId ? "PATCH" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFeedbackMessage(editingMediaId ? "Media video updated successfully!" : "Media video created successfully!");
        setShowAddMediaModal(false);
        resetMediaForm();
        fetchDashboardData("media", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save media video: ${errData.message || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Failed to save media video", err);
      alert(`Error saving media video: ${err.message || err}`);
    } finally {
      setSubmittingMedia(false);
    }
  };

  const handleTogglePublishMedia = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/media/${id}/toggle-publish`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFeedbackMessage("Media video publication status updated.");
        fetchDashboardData("media", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle publish media video", err);
    }
  };

  const handleToggleFeaturedMedia = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/media/${id}/toggle-featured`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFeedbackMessage("Media video homepage featured status updated.");
        fetchDashboardData("media", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to toggle featured status.");
      }
    } catch (err: any) {
      console.error("Failed to toggle featured media video", err);
      alert(err.message || "Error toggling featured status.");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media video?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/media/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbackMessage("Media video deleted successfully.");
        fetchDashboardData("media", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete media video", err);
    }
  };

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
      } else if (tab === "inquiries") {
        const iStatus = inquiryStatusFilter !== "ALL" ? `&status=${inquiryStatusFilter}` : '';
        const iSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const iRes = await apiFetch(`${API_BASE_URL}/editorial/contact-inquiries?page=${page}&limit=10${iStatus}${iSearch}`);
        if (iRes.ok) {
          const json = await iRes.json();
          if (json.data) {
            setInquiriesList(json.data);
            setInquiriesMeta(json.meta);
            if (json.data.length > 0) {
              setSelectedInquiry(json.data[0]);
            } else {
              setSelectedInquiry(null);
            }
          } else {
            const list = Array.isArray(json) ? json : [];
            setInquiriesList(list);
            setSelectedInquiry(list[0] || null);
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
      } else if (tab === "communities") {
        const [crRes, cRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/editorial/community/reports?page=${page}&limit=10`),
          apiFetch(`${API_BASE_URL}/communities`),
        ]);
        if (crRes.ok) {
          const json = await crRes.json();
          setCommReportsList(json.data || []);
          if (json.meta) setCommReportsMeta(json.meta);
        }
        if (cRes.ok) {
          const json = await cRes.json();
          setCommunitiesList(Array.isArray(json) ? json : []);
        }
      } else if (tab === "events") {
        const eType = eventFilterType && eventFilterType !== "ALL" ? `&type=${eventFilterType}` : '';
        const eSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const evRes = await apiFetch(`${API_BASE_URL}/editorial/events?page=${page}&limit=10${eType}${eSearch}`);
        if (evRes.ok) {
          const json = await evRes.json();
          if (json.data) {
            setEventsList(json.data);
            if (json.meta) setEventsMeta(json.meta);
          } else {
            setEventsList(Array.isArray(json) ? json : []);
          }
        }
      } else if (tab === "books") {
        const bSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const bkRes = await apiFetch(`${API_BASE_URL}/editorial/books?page=${page}&limit=10${bSearch}`);
        if (bkRes.ok) {
          const json = await bkRes.json();
          if (json.data) {
            setBooksList(json.data);
            if (json.meta) setBooksMeta(json.meta);
          } else {
            setBooksList(Array.isArray(json) ? json : []);
          }
        }
      } else if (tab === "editions") {
        const eSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const edRes = await apiFetch(`${API_BASE_URL}/editorial/editions?page=${page}&limit=10${eSearch}`);
        if (edRes.ok) {
          const json = await edRes.json();
          if (json.data) {
            setEditionsList(json.data);
            if (json.meta) setEditionsMeta(json.meta);
          } else {
            setEditionsList(Array.isArray(json) ? json : []);
          }
        }
      } else if (tab === "media") {
        const mSearch = query ? `&search=${encodeURIComponent(query)}` : '';
        const mRes = await apiFetch(`${API_BASE_URL}/editorial/media?page=${page}&limit=9${mSearch}`);
        if (mRes.ok) {
          const json = await mRes.json();
          if (json.data) {
            setMediaList(json.data);
            if (json.meta) setMediaMeta(json.meta);
          } else {
            setMediaList(Array.isArray(json) ? json : []);
          }
        }
      } else if ((tab as string) === "settings" || (tab as string) === "editors-note") {
        const sRes = await apiFetch(`${API_BASE_URL}/editorial/settings/editors-note`);
        if (sRes.ok) {
          const json = await sRes.json();
          if (json.title) setEditorsNoteTitle(json.title);
          if (json.note) setEditorsNoteContent(json.note);
        }
      }
    } catch (err) {
      console.error("Failed to load section data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRegistrations = async (eventItem: any) => {
    setSelectedEventForReg(eventItem);
    setShowRegistrationsModal(true);
    setLoadingRegistrations(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/events/${eventItem.id}/registrations`);
      if (res.ok) {
        const json = await res.json();
        setRegistrationsList(json.registrations || []);
      }
    } catch (err) {
      console.error("Error fetching registrations", err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Event Handlers
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormTitle.trim() || !eventFormDesc.trim()) return;

    setSubmittingEvent(true);
    try {
      const payload = {
        type: eventFormType,
        title: eventFormTitle.trim(),
        description: eventFormDesc.trim(),
        location: eventFormLoc.trim(),
        time: eventFormTime.trim() || undefined,
        day: eventFormDay.trim() || undefined,
        monthYear: eventFormMonthYear.trim() || undefined,
        imageSrc: eventFormImage.trim() || undefined,
        registerHref: eventFormRegisterHref.trim() || undefined,
        isPublished: eventFormPublished,
      };

      const url = editingEventId
        ? `${API_BASE_URL}/editorial/events/${editingEventId}`
        : `${API_BASE_URL}/editorial/events`;
      const method = editingEventId ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFeedbackMessage(editingEventId ? "Event updated successfully!" : "Event created successfully!");
        setShowAddEventModal(false);
        resetEventForm();
        fetchDashboardData("events");
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to save event");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving event");
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleTogglePublishEvent = async (eventId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/events/${eventId}/toggle-publish`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFeedbackMessage("Event publishing status updated.");
        fetchDashboardData("events");
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbackMessage(`Event "${title}" deleted.`);
        fetchDashboardData("events");
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArchiveModal = (eventItem: any) => {
    setSelectedEventForArchive(eventItem);
    setArchiveImage(eventItem.imageSrc || "");
    setShowArchiveModal(true);
  };

  const handleArchiveImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingArchiveImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch(`${API_BASE_URL}/uploads/image`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setArchiveImage(json.url);
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading archive image", err);
      alert("Error uploading image.");
    } finally {
      setUploadingArchiveImage(false);
    }
  };

  const handleConfirmArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForArchive) return;

    setArchivingEvent(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/events/${selectedEventForArchive.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAST_ARCHIVE",
          imageSrc: archiveImage.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFeedbackMessage(`Event "${selectedEventForArchive.title}" moved to Past Event Archive.`);
        setShowArchiveModal(false);
        setSelectedEventForArchive(null);
        setArchiveImage("");
        fetchDashboardData("events", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to archive event");
      }
    } catch (err) {
      console.error(err);
      alert("Error moving event to archive");
    } finally {
      setArchivingEvent(false);
    }
  };

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEventImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch(`${API_BASE_URL}/uploads/image`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setEventFormImage(json.url);
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading image", err);
      alert("Error uploading image.");
    } finally {
      setUploadingEventImage(false);
    }
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventFormType("READING_SESSION");
    setEventFormTitle("");
    setEventFormDesc("");
    setEventFormLoc("");
    setEventFormTime("");
    setEventFormDay("");
    setEventFormMonthYear("");
    setEventFormImage("");
    setEventFormRegisterHref("");
    setEventFormPublished(true);
  };

  const handleUpdateCommReportStatus = async (reportId: string, status: "ACTIONED" | "DISMISSED") => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbackMessage(`Community report marked as ${status.toLowerCase()}.`);
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLockPost = async (postId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/posts/${postId}/lock`, { method: "PATCH" });
      if (res.ok) {
        const json = await res.json();
        setFeedbackMessage(json.isLocked ? "Post thread locked." : "Post thread unlocked.");
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePinPost = async (postId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/posts/${postId}/pin`, { method: "PATCH" });
      if (res.ok) {
        const json = await res.json();
        setFeedbackMessage(json.isPinned ? "Post pinned to community feed top." : "Post unpinned.");
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCommPost = async (postId: string) => {
    if (!confirm("Are you sure you want to remove this community post?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/posts/${postId}/remove`, { method: "PATCH" });
      if (res.ok) {
        setFeedbackMessage("Community post removed.");
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCommComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to soft-remove this comment? Its body will be redacted while preserving reply threads.")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/community/comments/${commentId}/remove`, { method: "PATCH" });
      if (res.ok) {
        setFeedbackMessage("Community comment soft-removed.");
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    const slug = newCommSlug.trim() || newCommName.toLowerCase().trim().split(/\s+/).join("-");

    setCreatingComm(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCommName.trim(),
          slug,
          description: newCommDesc.trim() || undefined,
          color: newCommColor,
        }),
      });

      if (res.ok) {
        setFeedbackMessage(`Community '${newCommName}' created successfully!`);
        setShowAddCommModal(false);
        setNewCommName("");
        setNewCommSlug("");
        setNewCommDesc("");
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create community");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating community");
    } finally {
      setCreatingComm(false);
    }
  };

  const handleDeleteCommunity = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete community ${name}? All posts in this community will also be removed.`)) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/communities/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbackMessage(`Community '${name}' deleted.`);
        fetchDashboardData("communities", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to delete community");
      }
    } catch (err) {
      console.error(err);
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
  }, [activeTab, currentPage, reportStatusFilter, reportTypeFilter, inquiryStatusFilter, eventFilterType]);

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

  const handleUpdateInquiryStatus = async (id: string, status: "RESOLVED" | "DISMISSED") => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/contact-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbackMessage(`Contact inquiry marked as ${status.toLowerCase()}.`);
        fetchDashboardData("inquiries", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        alert("Failed to update inquiry status");
      }
    } catch (e) {
      console.error(e);
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

  const handleToggleFeaturedAuthor = async (userId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/${userId}/toggle-featured`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFeedbackMessage("Masika featured author status updated!");
        fetchDashboardData("authors", currentPage, searchQuery);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to update featured author status");
      }
    } catch (e) {
      console.error(e);
      alert("Error toggling featured author status");
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
      new RegExp("!\\[(.*?)\\]\\((.*?)\\)", "g"),
      '<img src="$2" alt="$1" />'
    );

    const imgRegex = new RegExp('<img\\s+[^>]*src=["\']([^"\']+)["\'][^>]*>', "gi");
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
            const isHtml = new RegExp("<[a-z][\\s\\S]*>", "i").test(part.value);
            if (isHtml) {
              return (
                <div
                  key={idx}
                  className="prose max-w-none text-gray-900 text-base leading-snug sm:leading-relaxed font-normal [&_p]:mb-3 [&_p]:text-[#1A1A1A] [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
                  dangerouslySetInnerHTML={{ __html: part.value }}
                />
              );
            }

            let formattedText = part.value;
            formattedText = formattedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>');
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');

            const paragraphs = formattedText.replace(/\r\n/g, "\n").split("\n\n");
            return (
              <div key={idx} className="space-y-3">
                {paragraphs.map((pText, pIdx) => {
                  if (!pText.trim()) {
                    return <p key={pIdx} className="h-5 mb-3"><br /></p>;
                  }
                  const containsInlineHtml = /<[a-z][\s\S]*>/i.test(pText);
                  if (containsInlineHtml) {
                    return (
                      <div
                        key={pIdx}
                        className="text-gray-900 text-base leading-snug sm:leading-relaxed font-normal mb-3 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium"
                        dangerouslySetInnerHTML={{ __html: pText }}
                      />
                    );
                  }
                  return (
                    <p key={pIdx} className="text-gray-900 text-base leading-snug sm:leading-relaxed font-normal whitespace-pre-wrap tracking-tight mb-3">
                      {pText}
                    </p>
                  );
                })}
              </div>
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
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col lg:flex-row text-left">
      {/* Mobile Top Navbar (Single Clean Sticky Bar) */}
      <div className="lg:hidden bg-white border-b border-gray-200 text-gray-900 p-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <Link href="/" className="flex items-center shrink-0 group">
          <Image
            src="/images/akamdigital.png"
            alt="AKAM Digital Logo"
            width={300}
            height={100}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-gray-700 hover:text-black focus:outline-none cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 z-50 w-72 h-screen bg-white border-r border-gray-200 text-gray-900 flex flex-col justify-between p-4 lg:p-6 transition-all duration-300 shadow-xl lg:shadow-xs ${
          mobileSidebarOpen ? "left-0" : "-left-full lg:left-0"
        }`}
      >
        <div>
          {/* Logo & Space Identifier */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <Link href="/" className="flex items-center shrink-0 group">
              <Image
                src="/images/akamdigital.png"
                alt="AKAM Digital Logo"
                width={300}
                height={100}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/" title="View Public Site" className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-700 hover:text-black focus:outline-none cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Page Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => handleTabChange("queue")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "queue"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pending Review Queue</span>
            </button>

            <button
              onClick={() => handleTabChange("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Flag className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Reported Content</span>
            </button>

            <button
              onClick={() => handleTabChange("inquiries")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "inquiries"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contact Inquiries</span>
            </button>

            <button
              onClick={() => handleTabChange("catalog")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
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
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Author Roster</span>
            </button>

            <button
              onClick={() => handleTabChange("categories")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Tag className="w-4 h-4 text-purple-500 shrink-0" />
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
              <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Editorial Alerts</span>
            </button>

            <button
              onClick={() => handleTabChange("editors-note")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "settings" || activeTab === "editors-note"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Home Page Editor's Note</span>
            </button>

            <button
              onClick={() => handleTabChange("communities")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "communities"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Community Moderation</span>
            </button>

            <button
              onClick={() => handleTabChange("events")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "events"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
              <span>Events & Workshops</span>
            </button>

            <button
              onClick={() => handleTabChange("books")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "books"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#8122DB] shrink-0" />
              <span>Upcoming Book Releases</span>
            </button>

            <button
              onClick={() => handleTabChange("media")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "media"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Video className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Media Showcase</span>
            </button>

            <button
              onClick={() => handleTabChange("editions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "editions"
                  ? "bg-[#040706] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Archive className="w-4 h-4 text-violet-500 shrink-0" />
              <span>Masika (Digital Editions)</span>
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
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full text-left">

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div className="mb-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
              {activeTab === "queue" && "Pending Review Queue"}
              {activeTab === "reports" && "Reported Content Moderation"}
              {activeTab === "catalog" && "Published Story Catalog"}
              {activeTab === "authors" && "User & Author Roster"}
              {activeTab === "categories" && "Story Categories & Taxonomy"}
              {activeTab === "notifications" && "Editorial Alerts & Logs"}
              {activeTab === "settings" && "Home Page Editor's Note"}
              {activeTab === "communities" && "Community Moderation & Management"}
              {activeTab === "events" && "Events & Workshops Management"}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {activeTab === "queue" && "Review pending author submissions and approve or reject content."}
              {activeTab === "reports" && "Investigate reader flag reports submitted against stories and comments."}
              {activeTab === "catalog" && "Browse all active stories currently published on AKAM Digital."}
              {activeTab === "authors" && "Manage all registered platform users, writers, and role permissions."}
              {activeTab === "categories" && "Manage category labels, Malayalam translations, and genre classifications."}
              {activeTab === "notifications" && "Event logs for story submissions, approvals, and rejections."}
              {activeTab === "settings" && "Update the featured Editor's Note title and message displayed on the main homepage."}
              {activeTab === "communities" && "Moderate community posts and comments, lock threads, pin posts, and inspect community rosters."}
              {activeTab === "events" && "Manage upcoming reading sessions, discussions, workshops, and past archives."}
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

        {/* TAB 1: PENDING QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-gray-200/80 shadow-xs">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pending queue by title, category or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
                />
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingStories.map((story) => (
                    <div
                      key={story.id}
                      className="flex flex-col bg-white border border-gray-200/80 rounded-[24px] p-5 hover:shadow-lg transition-all duration-300 group/card shadow-xs"
                    >
                      {/* Story Cover */}
                      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-xs">
                        {story.coverImageUrl ? (
                          <Image
                            src={story.coverImageUrl}
                            alt={story.title || "Story Cover"}
                            fill
                            unoptimized
                            className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50/40 p-4 text-center">
                            <FileText className="w-8 h-8 text-gray-400/60" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Cover Image</span>
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 z-10 flex gap-1.5 flex-wrap">
                          <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
                            PENDING
                          </span>
                          {story.category && (
                            <span className="bg-black/80 backdrop-blur-xs text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
                              {story.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-gray-950 tracking-tight leading-snug line-clamp-2 group-hover/card:text-emerald-700 transition-colors">
                            {story.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">By {story.authorName || story.authorEmail}</span>
                          </p>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-3.5 border-t border-gray-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStory(story)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-900 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Read story"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                            <span>Read</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(story.id, "APPROVED")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-gray-950 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Approve story"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingStory(story)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Reject story"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Reject</span>
                          </button>
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

        {/* TAB: CONTACT INQUIRIES */}
        {activeTab === "inquiries" && (
          <div className="space-y-6 font-poppins">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-gray-200/80 shadow-xs">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inquiries by name, email, subject or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black shadow-xs"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => {
                    setInquiryStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 outline-none focus:border-black shadow-xs cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>
            </div>

            {inquiriesList.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-[28px] p-12 text-center text-gray-400 font-medium">
                No contact form inquiries found.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Master Inbox List (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  {inquiriesList.map((inq) => {
                    const isSelected = selectedInquiry?.id === inq.id;
                    return (
                      <button
                        key={inq.id}
                        onClick={() => setSelectedInquiry(inq)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? "bg-white border-black shadow-md ring-1 ring-black/5"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-950 text-xs truncate">{inq.name}</span>
                          <span
                            className={`font-bold text-[9px] uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                              inq.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : inq.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md truncate">
                            {inq.subject || "General Inquiry"}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatDateTime(inq.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {inq.message || "No message content."}
                        </p>
                      </button>
                    );
                  })}

                  <PaginationFooter meta={inquiriesMeta} onPageChange={handlePageChange} />
                </div>

                {/* Detail View Panel (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-gray-200 rounded-[28px] p-6 sm:p-8 shadow-xs sticky top-24">
                  {selectedInquiry ? (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-base shrink-0">
                            {selectedInquiry.name ? selectedInquiry.name[0].toUpperCase() : "C"}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-950">{selectedInquiry.name}</h3>
                            <p className="text-xs text-gray-500">
                              <a href={`mailto:${selectedInquiry.email}`} className="hover:underline text-emerald-700 font-medium">
                                {selectedInquiry.email}
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase px-3 py-1 rounded-xl">
                            {selectedInquiry.subject || "General Inquiry"}
                          </span>
                          <span
                            className={`font-bold text-[10px] uppercase px-3 py-1 rounded-xl ${
                              selectedInquiry.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : selectedInquiry.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {selectedInquiry.status}
                          </span>
                        </div>
                      </div>

                      {/* Meta stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Submitted On</span>
                          <span className="font-semibold text-gray-900">{formatDateTime(selectedInquiry.createdAt)}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Contact Phone</span>
                          {selectedInquiry.phone ? (
                            <a href={`tel:${selectedInquiry.phone.replace(/\s+/g, "")}`} className="font-semibold text-gray-900 underline hover:text-black">
                              {selectedInquiry.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </div>
                      </div>

                      {/* Message Body */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Inquiry Message</h4>
                        <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 leading-relaxed font-normal whitespace-pre-wrap min-h-[160px]">
                          {selectedInquiry.message || "No message content provided."}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                        <a
                          href={`mailto:${selectedInquiry.email}?subject=RE: ${encodeURIComponent(selectedInquiry.subject || 'AKAM Inquiry')}`}
                          className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                        >
                          <Mail className="w-4 h-4" /> Reply via Email
                        </a>

                        <div className="flex items-center gap-2">
                          {selectedInquiry.status !== "RESOLVED" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              onClick={async () => {
                                await handleUpdateInquiryStatus(selectedInquiry.id, "RESOLVED");
                                setSelectedInquiry((prev) => prev ? { ...prev, status: "RESOLVED" } : null);
                              }}
                              className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                            >
                              Mark Resolved
                            </Button>
                          )}
                          {selectedInquiry.status !== "DISMISSED" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<XCircle className="w-3.5 h-3.5 text-gray-500" />}
                              onClick={async () => {
                                await handleUpdateInquiryStatus(selectedInquiry.id, "DISMISSED");
                                setSelectedInquiry((prev) => prev ? { ...prev, status: "DISMISSED" } : null);
                              }}
                              className="text-xs font-semibold border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-gray-400 font-medium space-y-2">
                      <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Select an inquiry from the list</p>
                      <p className="text-xs text-gray-400">Click any contact inquiry on the left to read its full message and respond.</p>
                    </div>
                  )}
                </div>
              </div>
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
                    <button
                      type="button"
                      onClick={() => handleToggleFeaturedAuthor(u.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                        u.isFeatured
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${u.isFeatured ? "text-emerald-600 fill-emerald-600" : "text-gray-400"}`} />
                      {u.isFeatured ? "Masika Featured" : "+ Feature"}
                    </button>
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
                      <th className="py-4 px-6">Masika Featured</th>
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
                        <td className="py-4 px-6 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleFeaturedAuthor(u.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                              u.isFeatured
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${u.isFeatured ? "text-emerald-600 fill-emerald-600" : "text-gray-400"}`} />
                            {u.isFeatured ? "Featured Author" : "+ Feature Author"}
                          </button>
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

        {/* TAB 6: HOME PAGE EDITOR'S NOTE */}
        {(activeTab === "settings" || activeTab === "editors-note") && (
          <div className="space-y-6 font-poppins">
            {/* Editor's Note Management Card */}
            <div className="bg-white border border-gray-200 rounded-[28px] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3.5 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-lg shadow-xs">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-950">Home Page Editor's Note</h3>
                  <p className="text-xs text-gray-500">Edit the featured Editor's Note title and message displayed on the main homepage.</p>
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

        {/* TAB 8: COMMUNITY MODERATION */}
        {activeTab === "communities" && (
          <div className="space-y-6 font-poppins">
            {/* Subtab Toggle Header */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <button
                onClick={() => setCommSubTab("reports")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  commSubTab === "reports"
                    ? "bg-black text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Flagged Community Queue ({commReportsMeta.total})
              </button>
              <button
                onClick={() => setCommSubTab("communities")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  commSubTab === "communities"
                    ? "bg-black text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Active Communities Roster ({communitiesList.length})
              </button>
            </div>

            {/* Subtab 1: Community Flagged Queue */}
            {commSubTab === "reports" && (
              <div className="space-y-4">
                {loading ? (
                  <div className="py-20 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
                  </div>
                ) : commReportsList.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-[28px] border border-gray-200 p-8 shadow-xs">
                    <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Community Queue Clean!</h3>
                    <p className="text-xs text-gray-500">There are no flagged community posts or comments requiring moderation.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-700">
                        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3">Reported Item</th>
                            <th className="px-4 py-3">Reporter</th>
                            <th className="px-4 py-3">Reason / Details</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Moderation Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commReportsList.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-4 py-3 max-w-xs">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-block mb-1">
                                  {item.postId ? "POST" : "COMMENT"}
                                </span>
                                <p className="font-semibold text-gray-900 line-clamp-2">
                                  {item.postTitle || item.commentBody || "Community Content"}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900">{item.reporterName || "User"}</p>
                                <p className="text-[10px] text-gray-500">{item.reporterEmail}</p>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="font-semibold text-rose-600">{item.reason}</p>
                                {item.details && <p className="text-[10px] text-gray-500 line-clamp-1">{item.details}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === "PENDING"
                                      ? "bg-amber-100 text-amber-800"
                                      : item.status === "ACTIONED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {item.postId && (
                                    <>
                                      <button
                                        onClick={() => handleLockPost(item.postId)}
                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold"
                                        title="Lock Thread"
                                      >
                                        Lock
                                      </button>
                                      <button
                                        onClick={() => handlePinPost(item.postId)}
                                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold"
                                        title="Pin Post"
                                      >
                                        Pin
                                      </button>
                                      <button
                                        onClick={() => handleRemoveCommPost(item.postId)}
                                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold"
                                        title="Remove Post"
                                      >
                                        Remove Post
                                      </button>
                                    </>
                                  )}
                                  {item.commentId && (
                                    <button
                                      onClick={() => handleRemoveCommComment(item.commentId)}
                                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold"
                                      title="Soft Remove Comment"
                                    >
                                      Remove Comment
                                    </button>
                                  )}
                                  {item.status === "PENDING" && (
                                    <button
                                      onClick={() => handleUpdateCommReportStatus(item.id, "ACTIONED")}
                                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                                    >
                                      Resolve
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationFooter meta={commReportsMeta} onPageChange={(p) => handlePageChange(p)} />
                  </div>
                )}
              </div>
            )}

            {/* Subtab 2: Communities Roster */}
            {commSubTab === "communities" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">All Platform Communities ({communitiesList.length})</h4>
                    <p className="text-xs text-gray-500">Add new categories/communities or manage existing spaces.</p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    iconPosition="left"
                    onClick={() => setShowAddCommModal(true)}
                    className="text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Add Community
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {communitiesList.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs"
                              style={{ backgroundColor: comm.color || "#29ABE1" }}
                            >
                              {comm.name[0]}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">{comm.name}</h4>
                              <p className="text-[10px] text-gray-400 font-mono">{"r/" + comm.slug}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCommunity(comm.slug, comm.name)}
                            title="Delete Community"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {comm.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                            {comm.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-[11px] text-gray-500 font-medium">
                          <span className="font-semibold text-gray-900">{comm.memberCount}</span> members ·{" "}
                          <span className="font-semibold text-gray-900">{comm.postCount}</span> posts
                        </div>

                        <Link
                          href={`/communities/${comm.slug}`}
                          target="_blank"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          View Feed <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: EVENTS & WORKSHOPS */}
        {(activeTab as string) === "events" && (
          <div className="space-y-6 font-poppins">
            {/* Header Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl flex-wrap">
                {[
                  { id: "ALL", label: "All Events" },
                  { id: "READING_SESSION", label: "Reading Sessions" },
                  { id: "DISCUSSION", label: "Discussions" },
                  { id: "WORKSHOP", label: "Workshops" },
                  { id: "PAST_ARCHIVE", label: "Past Archives" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventFilterType(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      eventFilterType === f.id
                        ? "bg-black text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                iconPosition="left"
                onClick={() => {
                  resetEventForm();
                  setShowAddEventModal(true);
                }}
                className="text-xs font-semibold cursor-pointer shadow-xs whitespace-nowrap"
              >
                Add Event / Workshop
              </Button>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventsList.map((ev) => {
                const fullImgUrl = ev.imageSrc
                  ? (ev.imageSrc.startsWith("/") ? `${API_BASE_URL.replace(/\/api$/, "")}${ev.imageSrc}` : ev.imageSrc)
                  : null;

                return (
                  <div
                    key={ev.id}
                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all font-poppins"
                  >
                    <div>
                      {/* Image Preview Banner Container */}
                      <div className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden mb-4 bg-gray-100 border border-gray-200/80 shadow-xs group">
                        {fullImgUrl ? (
                          <img
                            src={fullImgUrl}
                            alt={ev.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-gradient-to-br from-emerald-50/60 to-gray-150">
                            <Calendar className="w-10 h-10 text-emerald-600/40" />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                              {ev.type.replace("_", " ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Type & Status Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {ev.type.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePublishEvent(ev.id)}
                            title="Toggle Published Status"
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition ${
                              ev.isPublished
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            {ev.isPublished ? "Published" : "Draft (Hidden)"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingEventId(ev.id);
                              setEventFormType(ev.type);
                              setEventFormTitle(ev.title);
                              setEventFormDesc(ev.description);
                              setEventFormLoc(ev.location);
                              setEventFormTime(ev.time || "");
                              setEventFormDay(ev.day || "");
                              setEventFormMonthYear(ev.monthYear || "");
                              setEventFormImage(ev.imageSrc || "");
                              setEventFormRegisterHref(ev.registerHref || "");
                              setEventFormPublished(ev.isPublished);
                              setShowAddEventModal(true);
                            }}
                            title="Edit Event"
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            title="Delete Event"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-950 mb-2 leading-snug">{ev.title}</h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {ev.description}
                    </p>

                    {/* Meta Details */}
                    <div className="space-y-1.5 text-xs text-gray-500 font-medium mb-4">
                      <div>📍 {ev.location}</div>
                      {ev.time && <div>⏰ {ev.time}</div>}
                      {ev.day && ev.monthYear && (
                        <div>🗓️ {ev.day} {ev.monthYear}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                        👥 {ev.registrationCount || 0} Registered
                      </span>
                      <button
                        onClick={() => handleViewRegistrations(ev)}
                        className="text-xs font-bold text-black hover:text-emerald-700 underline cursor-pointer"
                      >
                        View Attendees →
                      </button>
                    </div>

                    {ev.type !== "PAST_ARCHIVE" && (
                      <button
                        onClick={() => handleOpenArchiveModal(ev)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-700" />
                        <span>Move to Past Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Server-Side Pagination Footer */}
            <PaginationFooter
              meta={eventsMeta}
              onPageChange={(p) => fetchDashboardData("events", p, searchQuery)}
            />
          </div>
        )}

        {/* Upcoming Book Releases Tab Panel */}
        {activeTab === "books" && (
          <div className="space-y-6 font-poppins">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
              <div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Publishing Showcase
                </span>
                <h2 className="text-2xl font-bold text-gray-950 mt-1.5 tracking-tight">Upcoming Book Releases</h2>
                <p className="text-xs text-gray-500 mt-1">Manage physical book showcase cards & pre-order links displayed on the homepage.</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetBookForm();
                  setShowAddBookModal(true);
                }}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                Add Book Release
              </Button>
            </div>

            {/* Books List Grid */}
            {booksList.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-gray-200/80 shadow-xs">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No Book Releases Added Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">Click below to add a book release showcase to display on the homepage.</p>
                <Button variant="primary" size="sm" onClick={() => { resetBookForm(); setShowAddBookModal(true); }}>
                  Add First Book Release
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {booksList.map((book) => (
                  <div key={book.id} className="bg-white rounded-[24px] p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="bg-[#F5EDFF] text-[#8122DB] text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {book.editionTag || "Print Edition"}
                        </span>
                        <button
                          onClick={() => handleTogglePublishBook(book.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${
                            book.isPublished ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {book.isPublished ? "Published" : "Draft (Hidden)"}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-gray-950 tracking-tight leading-snug">{book.title}</h3>
                      <p className="text-xs font-semibold text-gray-500 mb-3">{book.author}</p>
                      <div className="border-b-2 border-[#EBE0FF] my-3" />
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-normal">{book.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      {book.preorderLink ? (
                        <a
                          href={book.preorderLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
                        >
                          Pre-order Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">No preorder URL</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingBookId(book.id);
                            setBookFormTitle(book.title);
                            setBookFormAuthor(book.author);
                            setBookFormEditionTag(book.editionTag || "Print Edition");
                            setBookFormDesc(book.description);
                            setBookFormCoverImage(book.coverImage || "");
                            setBookFormPreorderLink(book.preorderLink || "");
                            setBookFormPublished(book.isPublished);
                            setShowAddBookModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Delete Book Release"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Server-Side Pagination Footer */}
            <PaginationFooter
              meta={booksMeta}
              onPageChange={(p) => fetchDashboardData("books", p, searchQuery)}
            />
          </div>
        )}

        {/* Media Showcase Tab Panel */}
        {activeTab === "media" && (
          <div className="space-y-6 font-poppins">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Video & Media Showcase
                </span>
                <h2 className="text-2xl font-bold text-gray-950 mt-1.5 tracking-tight">Media Showcase Videos</h2>
                <p className="text-xs text-gray-500 mt-1">Manage videos displayed on the /media showcase page (Thumbnails auto-generated from YouTube).</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetMediaForm();
                  setShowAddMediaModal(true);
                }}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                Add Media Video
              </Button>
            </div>

            {/* Media List Grid */}
            {mediaList.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-gray-200/80 shadow-xs">
                <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No Media Videos Added Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">Click below to add a YouTube video to the media showcase.</p>
                <Button variant="primary" size="sm" onClick={() => { resetMediaForm(); setShowAddMediaModal(true); }}>
                  Add First Media Video
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaList.map((item) => (
                  <div key={item.id} className="bg-white rounded-[24px] p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      {/* Thumbnail Preview */}
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3">
                        <img
                          src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-xs">
                          {item.category}
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-950 tracking-tight leading-snug">{item.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleFeaturedMedia(item.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                              item.isFeatured ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title={item.isFeatured ? "Currently featured on Homepage" : "Click to feature on Homepage"}
                          >
                            {item.isFeatured ? "★ Featured" : "☆ Feature"}
                          </button>
                          <button
                            onClick={() => handleTogglePublishMedia(item.id)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${
                              item.isPublished ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {item.isPublished ? "Published" : "Draft"}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-normal">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1 truncate"
                      >
                        YouTube Link <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingMediaId(item.id);
                            setMediaFormTitle(item.title);
                            setMediaFormCategory(item.category);
                            setMediaFormYoutubeUrl(item.youtubeUrl);
                            setMediaFormDesc(item.description);
                            setMediaFormPublished(item.isPublished);
                            setMediaFormFeatured(item.isFeatured || false);
                            setShowAddMediaModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Delete Media Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Server-Side Pagination Footer */}
            <PaginationFooter
              meta={mediaMeta}
              onPageChange={(p) => fetchDashboardData("media", p, searchQuery)}
            />
          </div>
        )}

        {/* Masika Digital Editions Tab Panel */}
        {activeTab === "editions" && (
          <div className="space-y-6 font-poppins">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
              <div>
                <span className="bg-violet-100 text-violet-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Masika
                </span>
                <h2 className="text-2xl font-bold text-gray-950 mt-1.5 tracking-tight">Masika (Digital Editions)</h2>
                <p className="text-xs text-gray-500 mt-1">Upload PDF magazines with cover images. Preview and publish interactive digital flipbook editions for Masika readers.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => { resetEditionForm(); setShowAddEditionModal(true); }}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                Add Edition
              </Button>
            </div>

            {/* Editions List */}
            {editionsList.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-gray-200/80 shadow-xs">
                <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No Editions Added Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">Upload your first PDF magazine edition with a cover image.</p>
                <Button variant="primary" size="sm" onClick={() => { resetEditionForm(); setShowAddEditionModal(true); }}>
                  Add First Edition
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editionsList.map((item) => (
                  <div key={item.id} className="bg-white rounded-[24px] border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    {/* Cover preview */}
                    <div className="relative w-full aspect-[3/4] bg-gray-100">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                          <Archive className="w-10 h-10" />
                          <span className="text-xs font-medium text-gray-400">No cover</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleTogglePublishEdition(item.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer shadow-sm ${
                            item.isPublished ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {item.isPublished ? "Published" : "Draft"}
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div>
                        <h3 className="text-sm font-bold text-gray-950 tracking-tight leading-snug">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Sort order: {item.sortOrder}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.pdfUrl && (
                          <button
                            type="button"
                            onClick={() => setOpenFlipbookEdition(item)}
                            className="px-3 py-1.5 bg-[#E4F953] hover:bg-[#d8ed40] text-[#040706] text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Preview Flipbook
                          </button>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingEditionId(item.id);
                              setEditionFormTitle(item.title);
                              setEditionFormPdfUrl(item.pdfUrl);
                              setEditionFormCoverImage(item.coverImage || "");
                              setEditionFormSortOrder(item.sortOrder || 0);
                              setEditionFormPublished(item.isPublished);
                              setShowAddEditionModal(true);
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEdition(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <PaginationFooter
              meta={editionsMeta}
              onPageChange={(p) => fetchDashboardData("editions", p, searchQuery)}
            />
          </div>
        )}
      </main>

      {/* Add/Edit Edition Modal */}
      {showAddEditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl font-poppins max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowAddEditionModal(false); resetEditionForm(); }}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="bg-violet-100 text-violet-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {editingEditionId ? "Edit Edition" : "Add Edition"}
              </span>
              <h3 className="text-xl font-bold text-gray-950 mt-2">
                {editingEditionId ? "Update Edition" : "Upload New Edition"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Upload a PDF magazine and cover image.</p>
            </div>

            <form onSubmit={handleSaveEdition} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Edition Title *</label>
                <input
                  type="text"
                  value={editionFormTitle}
                  onChange={(e) => setEditionFormTitle(e.target.value)}
                  placeholder="e.g. Akam September 2025"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">PDF Magazine *</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                  {editionFormPdfUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-left">
                        <p className="text-xs font-semibold text-violet-700 truncate">✓ PDF uploaded</p>
                        <a href={editionFormPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:underline truncate block max-w-full">
                          {editionFormPdfUrl.split("/").pop()}
                        </a>
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition">
                        Replace
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleEditionPdfUpload} disabled={uploadingEditionPdf} />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      {uploadingEditionPdf ? (
                        <><RefreshCw className="w-6 h-6 text-violet-500 animate-spin" /><span className="text-xs text-gray-500">Uploading PDF…</span></>
                      ) : (
                        <><Archive className="w-6 h-6 text-gray-400" /><span className="text-xs font-semibold text-gray-600">Click to upload PDF</span><span className="text-[10px] text-gray-400">Max 50MB</span></>
                      )}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleEditionPdfUpload} disabled={uploadingEditionPdf} />
                    </label>
                  )}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cover Image <span className="font-normal text-gray-400">(optional)</span></label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                  {editionFormCoverImage ? (
                    <div className="flex items-center gap-3">
                      <img src={editionFormCoverImage} alt="Cover preview" className="w-16 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700">✓ Cover uploaded</p>
                        <label className="mt-1.5 cursor-pointer px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition inline-block">
                          Change
                          <input type="file" accept="image/*" className="hidden" onChange={handleEditionCoverUpload} disabled={uploadingEditionCover} />
                        </label>
                      </div>
                      <button type="button" onClick={() => setEditionFormCoverImage("")} className="p-1 text-gray-400 hover:text-rose-500 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      {uploadingEditionCover ? (
                        <><RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" /><span className="text-xs text-gray-500">Uploading cover…</span></>
                      ) : (
                        <><BookOpen className="w-6 h-6 text-gray-400" /><span className="text-xs font-semibold text-gray-600">Click to upload cover image</span><span className="text-[10px] text-gray-400">JPG, PNG, WebP</span></>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleEditionCoverUpload} disabled={uploadingEditionCover} />
                    </label>
                  )}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sort Order <span className="font-normal text-gray-400">(lower = shown first)</span></label>
                <input
                  type="number"
                  value={editionFormSortOrder}
                  onChange={(e) => setEditionFormSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Published</p>
                  <p className="text-[10px] text-gray-500">Show this edition on the Masika page</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditionFormPublished(!editionFormPublished)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                    editionFormPublished ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    editionFormPublished ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => { setShowAddEditionModal(false); resetEditionForm(); }}
                  className="flex-1 border border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submittingEdition || !editionFormTitle.trim() || !editionFormPdfUrl.trim()}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  {submittingEdition ? "Saving…" : editingEditionId ? "Update Edition" : "Save Edition"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Add Community Modal */}
      {showAddCommModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl font-poppins">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-950">Add New Community</h3>
              <button
                onClick={() => setShowAddCommModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Community Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCommName(val);
                    if (!newCommSlug) {
                      setNewCommSlug(val.toLowerCase().trim().replace(/\s+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Science & Philosophy"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  {"URL Slug (r/...)"}
                </label>
                <input
                  type="text"
                  value={newCommSlug}
                  onChange={(e) => setNewCommSlug(e.target.value)}
                  placeholder="e.g. science-philosophy"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCommColor}
                    onChange={(e) => setNewCommColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={newCommColor}
                    onChange={(e) => setNewCommColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddCommModal(false)}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={creatingComm || !newCommName.trim()}
                  className="px-6 py-2"
                >
                  {creatingComm ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-950">
                {editingEventId ? "Edit Event / Workshop" : "Add Event / Workshop"}
              </h3>
              <button
                onClick={() => {
                  setShowAddEventModal(false);
                  resetEventForm();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Event Category / Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "READING_SESSION", label: "Reading Session" },
                    { id: "DISCUSSION", label: "Discussion" },
                    { id: "WORKSHOP", label: "Workshop" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEventFormType(t.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                        eventFormType === t.id
                          ? "bg-black text-white border-black font-bold shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventFormTitle}
                  onChange={(e) => setEventFormTitle(e.target.value)}
                  placeholder="e.g. Voices of Classic Malayalam Short Stories"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={eventFormDesc}
                  onChange={(e) => setEventFormDesc(e.target.value)}
                  placeholder="Provide event details, speakers, or topics..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Location / Platform <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventFormLoc}
                  onChange={(e) => setEventFormLoc(e.target.value)}
                  placeholder="e.g. Trivandrum Public Library & Online Stream"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              {/* Single Selectable Date & Time Input Box */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Event Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [datePart, timePart] = val.split("T");
                    if (datePart) {
                      const [y, m, d] = datePart.split("-");
                      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                      if (!isNaN(dateObj.getTime())) {
                        const dayStr = String(dateObj.getDate()).padStart(2, "0");
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const monthYearStr = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                        setEventFormDay(dayStr);
                        setEventFormMonthYear(monthYearStr);
                      }
                    }
                    if (timePart) {
                      const [h, min] = timePart.split(":");
                      let hour = parseInt(h, 10);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      hour = hour % 12 || 12;
                      const formattedHour = String(hour).padStart(2, "0");
                      setEventFormTime(`${formattedHour}:${min} ${ampm}`);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs cursor-pointer"
                />

                {/* Selected Schedule Display Pill */}
                {(eventFormDay || eventFormMonthYear || eventFormTime) && (
                  <div className="mt-2 text-xs text-gray-700 font-medium bg-gray-100/80 px-3.5 py-2 rounded-xl flex items-center gap-2 border border-gray-200/60">
                    <span className="font-bold text-gray-900">Selected Schedule:</span>
                    <span>
                      {eventFormDay ? `${eventFormDay} ` : ""}
                      {eventFormMonthYear ? `${eventFormMonthYear}` : ""}
                      {eventFormTime ? ` @ ${eventFormTime}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Cover Image Upload (Only for Workshop and Past Archive) */}
              {["WORKSHOP", "PAST_ARCHIVE"].includes(eventFormType) && (
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                    Workshop Cover Image <span className="text-rose-500">*</span>
                  </label>
                  {eventFormImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-40 bg-gray-50 flex items-center justify-center group">
                      <img
                        src={eventFormImage.startsWith("/") ? `${API_BASE_URL.replace(/\/api$/, "")}${eventFormImage}` : eventFormImage}
                        alt="Event Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEventFormImage("")}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-200 hover:border-black rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEventImageUpload}
                        disabled={uploadingEventImage}
                        className="hidden"
                      />
                      <div className="text-center">
                        <span className="text-xs font-bold text-gray-900">
                          {uploadingEventImage ? "Uploading Image..." : "📁 Select Cover Image from Device"}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* Stream / Meeting Link (Optional) - Commented out as requested
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Stream / Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  value={eventFormRegisterHref}
                  onChange={(e) => setEventFormRegisterHref(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://youtube.com/live/..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>
              */}

              {/* Published Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="event-publish-checkbox"
                  checked={eventFormPublished}
                  onChange={(e) => setEventFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="event-publish-checkbox" className="text-xs font-bold text-gray-900 cursor-pointer">
                  Publish Immediately on Events Page
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddEventModal(false);
                    resetEventForm();
                  }}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingEvent || !eventFormTitle.trim() || !eventFormDesc.trim()}
                  className="px-6 py-2"
                >
                  {submittingEvent ? "Saving..." : editingEventId ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Modal for Editorial Team */}
      {showRegistrationsModal && selectedEventForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-2xl bg-white rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Attendee Registrations
                </span>
                <h3 className="text-xl font-bold text-gray-950 mt-1">
                  {selectedEventForReg.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedEventForReg(null);
                  setRegistrationsList([]);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRegistrations ? (
              <div className="py-12 text-center text-xs font-semibold text-gray-500">
                Loading attendee registrations...
              </div>
            ) : registrationsList.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 p-6">
                No user registrations recorded yet for this event.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pb-2 border-b border-gray-100">
                  <span>Total Attendees: <strong className="text-gray-900">{registrationsList.length}</strong></span>
                  <button
                    onClick={() => {
                      const csvHeader = "Name,Email,Phone,Notes,Registered At\n";
                      const csvRows = registrationsList.map(r => 
                        `"${r.name}","${r.email}","${r.phone || ''}","${(r.notes || '').replace(/"/g, '""')}","${new Date(r.createdAt).toLocaleString()}"`
                      ).join("\n");
                      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `registrations-${selectedEventForReg.id}.csv`;
                      a.click();
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-black hover:text-white text-gray-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    📥 Export CSV
                  </button>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {registrationsList.map((reg) => (
                    <div key={reg.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-gray-950">{reg.name}</div>
                          <div className="text-xs text-gray-600 font-medium mt-0.5">{reg.email} {reg.phone ? `• ${reg.phone}` : ''}</div>
                          {reg.notes && (
                            <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200/60 p-2 rounded-xl mt-2 font-normal">
                              💬 &quot;{reg.notes}&quot;
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move to Past Archive Modal with Image Picker */}
      {showArchiveModal && selectedEventForArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Move to Past Archive
                </span>
                <h3 className="text-xl font-bold text-gray-950 mt-1 leading-snug">
                  {selectedEventForArchive.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setSelectedEventForArchive(null);
                  setArchiveImage("");
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmArchive} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Upload or confirm a cover image for this event to be displayed in the <strong>Past Event Archive</strong>.
              </p>

              {/* Archive Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Archive Cover Image (Recommended)
                </label>
                {archiveImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-40 bg-gray-50 flex items-center justify-center group">
                    <img
                      src={archiveImage.startsWith("/") ? `${API_BASE_URL.replace(/\/api$/, "")}${archiveImage}` : archiveImage}
                      alt="Archive Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setArchiveImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-black rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArchiveImageUpload}
                      disabled={uploadingArchiveImage}
                      className="hidden"
                    />
                    <div className="text-center">
                      <span className="text-xs font-bold text-gray-900">
                        {uploadingArchiveImage ? "Uploading Image..." : "📁 Select Cover Image for Archive"}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSelectedEventForArchive(null);
                    setArchiveImage("");
                  }}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={archivingEvent || uploadingArchiveImage}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white border-none cursor-pointer"
                >
                  {archivingEvent ? "Archiving..." : "Confirm & Move to Archive"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Book Release Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-950">
                {editingBookId ? "Edit Book Release" : "Add Book Release"}
              </h3>
              <button
                onClick={() => {
                  setShowAddBookModal(false);
                  resetBookForm();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookFormTitle}
                  onChange={(e) => setBookFormTitle(e.target.value)}
                  placeholder="e.g. Before Darkness Falls"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Author <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookFormAuthor}
                  onChange={(e) => setBookFormAuthor(e.target.value)}
                  placeholder="e.g. By Priyanka Menon"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Edition Tag
                </label>
                <input
                  type="text"
                  value={bookFormEditionTag}
                  onChange={(e) => setBookFormEditionTag(e.target.value)}
                  placeholder="e.g. Print Edition, Hardcover, Collector Edition"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={bookFormDesc}
                  onChange={(e) => setBookFormDesc(e.target.value)}
                  placeholder="The novel published on Akam is now available as a book..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Pre-order Link (Opens in new tab)
                </label>
                <input
                  type="url"
                  value={bookFormPreorderLink}
                  onChange={(e) => setBookFormPreorderLink(e.target.value)}
                  placeholder="https://amazon.com/..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="book-publish-checkbox"
                  checked={bookFormPublished}
                  onChange={(e) => setBookFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="book-publish-checkbox" className="text-xs font-bold text-gray-900 cursor-pointer">
                  Publish Immediately on Homepage Showcase
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddBookModal(false);
                    resetBookForm();
                  }}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingBook || !bookFormTitle.trim() || !bookFormAuthor.trim() || !bookFormDesc.trim()}
                  className="px-6 py-2"
                >
                  {submittingBook ? "Saving..." : editingBookId ? "Update Book" : "Create Book"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Media Video Modal */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-950">
                {editingMediaId ? "Edit Media Video" : "Add Media Video"}
              </h3>
              <button
                onClick={() => {
                  setShowAddMediaModal(false);
                  resetMediaForm();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mediaFormTitle}
                  onChange={(e) => setMediaFormTitle(e.target.value)}
                  placeholder="e.g. Sambhashanangal"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mediaFormCategory}
                  onChange={(e) => setMediaFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-black shadow-xs cursor-pointer"
                >
                  <option value="interviews">Interviews</option>
                  <option value="conversations">Conversations</option>
                  <option value="cultural">Cultural Programmes</option>
                  <option value="recordings">Event Recordings</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  YouTube Video Link <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={mediaFormYoutubeUrl}
                  onChange={(e) => setMediaFormYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ✨ Thumbnail auto-generated directly from YouTube ID (No image upload required).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={mediaFormDesc}
                  onChange={(e) => setMediaFormDesc(e.target.value)}
                  placeholder="Unraveling Malayalam literature, art, and heritage through candid dialogues..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="media-publish-checkbox"
                    checked={mediaFormPublished}
                    onChange={(e) => setMediaFormPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <label htmlFor="media-publish-checkbox" className="text-xs font-bold text-gray-900 cursor-pointer">
                    Publish Immediately on Media Showcase Page
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="media-featured-checkbox"
                    checked={mediaFormFeatured}
                    onChange={(e) => setMediaFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="media-featured-checkbox" className="text-xs font-bold text-gray-900 cursor-pointer">
                    ★ Feature on Homepage (Display in Featured Video section)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddMediaModal(false);
                    resetMediaForm();
                  }}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingMedia || !mediaFormTitle.trim() || !mediaFormYoutubeUrl.trim() || !mediaFormDesc.trim()}
                  className="px-6 py-2"
                >
                  {submittingMedia ? "Saving..." : editingMediaId ? "Update Video" : "Create Video"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Masika Edition Flipbook Modal */}
      {openFlipbookEdition && (
        <EditionFlipbook
          pdfUrl={openFlipbookEdition.pdfUrl}
          title={openFlipbookEdition.title}
          onClose={() => setOpenFlipbookEdition(null)}
        />
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
