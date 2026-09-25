"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Filter,
  Download,
  RotateCw,
  Plus,
  Mail,
  Building,
  User,
  X,
  Sparkles,
  Undo2,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  CreditCard,
  Camera,
  Calendar,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";
import { useRouter, useSearchParams } from "next/navigation";

export interface StudentApplication {
  id: string;
  referenceId: string;
  fullName: string;
  institution: string;
  email: string;
  idCardUrl?: string;
  idCardName?: string;
  submittedAt: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  endDate?: string;
}

export const formatDateForInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getFutureDateString = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return formatDateForInput(d);
};

export const getAcademicYearEndString = () => {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-05-31`;
};

interface StudentVerificationsPanelProps {
  currentUserEmail?: string;
  currentUserName?: string;
  onNotify?: (msg: string) => void;
}

const PRESET_REJECT_REASONS = [
  "Student ID card photo is blurry or unreadable. Please resubmit a clear photo.",
  "Student identity card has expired for the current academic year.",
  "Institution or registration roll number could not be verified.",
  "Uploaded document is not an official institutional student identity card.",
];

export const StudentVerificationsPanel: React.FC<StudentVerificationsPanelProps> = ({
  currentUserEmail = "editorial@akamdigital.com",
  currentUserName = "Akam Editorial Board",
  onNotify,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Status Filter state
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">("ALL");

  // Search input & debounced search for server-side queries
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Server-side Infinite Scroll & Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [hasMore, setHasMore] = useState(true);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Global KPI statistics from server
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleStatusFilterChange = (newStatus: "ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED") => {
    setStatusFilter(newStatus);
  };

  // Lightbox Modal
  const [selectedAppForPreview, setSelectedAppForPreview] = useState<StudentApplication | null>(null);
  const [imageRotation, setImageRotation] = useState(0);

  // Reject Reason Modal
  const [rejectingApp, setRejectingApp] = useState<StudentApplication | null>(null);
  const [rejectReason, setRejectReason] = useState(PRESET_REJECT_REASONS[0]);

  // Approve Application Modal (Allows setting subscription ending date)
  const [approvingApp, setApprovingApp] = useState<StudentApplication | null>(null);
  const [approveEndDate, setApproveEndDate] = useState<string>("");
  const [approveNotes, setApproveNotes] = useState<string>("");
  const [approveSubmitting, setApproveSubmitting] = useState<boolean>(false);

  // Delete In-App Modal
  const [deletingApp, setDeletingApp] = useState<StudentApplication | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Grant Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCollege, setManualCollege] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualEndDate, setManualEndDate] = useState<string>(() => getFutureDateString(6));
  const [manualIdCardFile, setManualIdCardFile] = useState<File | null>(null);
  const [manualIdCardPreview, setManualIdCardPreview] = useState<string>("");
  const [manualIdCardName, setManualIdCardName] = useState<string>("");
  const [manualIsDragOver, setManualIsDragOver] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const manualFileInputRef = useRef<HTMLInputElement | null>(null);
  const manualCameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleManualFileChange = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }
    setManualIdCardFile(file);
    setManualIdCardName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setManualIdCardPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleManualDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setManualIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleManualFileChange(e.dataTransfer.files[0]);
    }
  };

  const showToast = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
      return;
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Server-side fetch applications function
  const fetchApplications = useCallback(
    async (targetPage = 1, isReset = false) => {
      if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const queryParams = new URLSearchParams({
          page: String(targetPage),
          limit: String(pageSize),
        });

        if (statusFilter !== "ALL") {
          queryParams.set("status", statusFilter);
        }

        if (debouncedSearch.trim()) {
          queryParams.set("search", debouncedSearch.trim());
        }

        const res = await apiFetch(
          `${API_BASE_URL}/editorial/student-verifications?${queryParams.toString()}`
        );

        if (res.ok) {
          const json = await res.json();
          let items: StudentApplication[] = [];
          let moreAvailable = false;
          let count = 0;

          if (Array.isArray(json)) {
            items = json;
            moreAvailable = false;
            count = json.length;
          } else if (json && Array.isArray(json.data)) {
            items = json.data;
            moreAvailable = !!json.hasMore;
            count = json.total ?? json.data.length;
            if (json.stats) {
              setStats(json.stats);
            }
          }

          setTotalCount(count);
          setHasMore(moreAvailable);
          setPage(targetPage);

          setApplications((prev) => {
            if (isReset || targetPage === 1) {
              return items;
            }
            // De-duplicate items by referenceId or id when appending next page
            const existingKeys = new Set(prev.map((i) => i.referenceId || i.id));
            const newItems = items.filter((i) => !existingKeys.has(i.referenceId || i.id));
            return [...prev, ...newItems];
          });
        }
      } catch (err) {
        console.error("Error fetching student verifications:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, debouncedSearch, pageSize]
  );

  // Trigger server-side fetch on filter or search changes
  useEffect(() => {
    fetchApplications(1, true);
  }, [statusFilter, debouncedSearch, fetchApplications]);

  // Refresh student verifications when subscriptions are granted or cancelled anywhere
  useEffect(() => {
    const onSyncRefresh = () => {
      fetchApplications(1, true);
    };
    window.addEventListener("akam_subscription_refresh", onSyncRefresh);
    return () => window.removeEventListener("akam_subscription_refresh", onSyncRefresh);
  }, [fetchApplications]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchApplications(page + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, page, fetchApplications]);

  // Open approval modal to configure subscription ending date
  const openApproveModal = (app: StudentApplication) => {
    setApprovingApp(app);
    if (app.endDate) {
      try {
        const d = new Date(app.endDate);
        if (!isNaN(d.getTime())) {
          setApproveEndDate(formatDateForInput(d));
        } else {
          setApproveEndDate(getFutureDateString(6));
        }
      } catch {
        setApproveEndDate(getFutureDateString(6));
      }
    } else {
      setApproveEndDate(getFutureDateString(6));
    }
    setApproveNotes(
      app.reviewNotes || "Approved by Akam Editorial Board. Verified student credentials."
    );
  };

  const handleConfirmApprove = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!approvingApp) return;

    if (!approveEndDate) {
      alert("Please select a subscription ending date.");
      return;
    }

    setApproveSubmitting(true);
    try {
      await handleUpdateStatus(
        approvingApp,
        "APPROVED",
        approveNotes.trim() || "Approved by Akam Editorial Board",
        approveEndDate,
      );
      setApprovingApp(null);
    } finally {
      setApproveSubmitting(false);
    }
  };

  // Update application decision (Approve, Reject, or Re-evaluate/Pending)
  const handleUpdateStatus = async (
    app: StudentApplication,
    newStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED",
    notes?: string,
    endDate?: string,
  ) => {
    const targetId = app.referenceId || app.id;

    // Optimistically update state immediately
    adjustStatsOnStatusChange(app.status, newStatus);
    setApplications((prev) =>
      prev.map((item) =>
        item.referenceId === targetId || item.id === targetId
          ? {
              ...item,
              status: newStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUserName,
              reviewNotes: notes !== undefined ? notes : item.reviewNotes,
              endDate: newStatus === "APPROVED" ? (endDate || item.endDate) : undefined,
            }
          : item
      )
    );

    if (newStatus === "APPROVED") {
      const formattedEnd = endDate
        ? new Date(endDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "6 months";
      showToast(
        `Free Scholar Pass approved for ${app.fullName} (Valid until ${formattedEnd}). Welcome email sent to ${app.email}.`
      );
    } else if (newStatus === "REJECTED") {
      showToast(`Application for ${app.fullName} rejected. Feedback email sent to ${app.email}.`);
    } else {
      showToast(`Application for ${app.fullName} reverted to Pending Review.`);
    }

    // Close modals
    setRejectingApp(null);
    setApprovingApp(null);
    if (
      selectedAppForPreview?.referenceId === targetId ||
      selectedAppForPreview?.id === targetId
    ) {
      setSelectedAppForPreview(null);
    }

    // Remote sync
    try {
      await apiFetch(`${API_BASE_URL}/editorial/student-verifications/${targetId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes: notes || (newStatus === "APPROVED" ? "Approved by Akam Editorial Board" : "Rejected"),
          reviewedBy: currentUserName,
          endDate: endDate,
        }),
      });
    } catch (err) {
      console.warn("Backend status update failed, local state preserved:", err);
    }

    // LocalStorage sync
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("akam_student_application");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.referenceId === targetId || parsed.email === app.email) {
            parsed.status = newStatus;
            parsed.reviewedAt = new Date().toISOString();
            if (notes) parsed.reviewNotes = notes;
            if (newStatus === "APPROVED" && endDate) parsed.endDate = endDate;
            localStorage.setItem("akam_student_application", JSON.stringify(parsed));
            if (newStatus === "APPROVED") {
              localStorage.setItem("akam_masika_pass", "true");
              localStorage.setItem("akam_pass_type", "Student Special Pass (100% Free)");
              if (endDate) {
                localStorage.setItem("akam_subscription_end_date", endDate);
              }
            } else if (newStatus === "REJECTED") {
              localStorage.removeItem("akam_masika_pass");
              localStorage.removeItem("akam_pass_type");
              localStorage.removeItem("akam_subscription_end_date");
            }
          }
        }
        window.dispatchEvent(new Event("akam_subscription_refresh"));
      } catch (e) {
        // ignore
      }
    }
  };

  // Delete application
  const confirmDelete = async () => {
    if (!deletingApp) return;
    const targetId = deletingApp.referenceId || deletingApp.id;
    const targetName = deletingApp.fullName;

    // Optimistically remove from state
    setApplications((prev) => prev.filter((item) => item.referenceId !== targetId && item.id !== targetId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      pending: prev.pending - (deletingApp.status === "PENDING_APPROVAL" ? 1 : 0),
      approved: prev.approved - (deletingApp.status === "APPROVED" ? 1 : 0),
      rejected: prev.rejected - (deletingApp.status === "REJECTED" ? 1 : 0),
    }));
    setDeletingApp(null);
    showToast(`Application record for ${targetName} deleted.`);

    // Remote delete
    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/student-verifications/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.warn("Backend delete returned error status:", res.status);
      }
    } catch (err) {
      console.warn("Backend delete failed:", err);
    }

    // LocalStorage delete if matches
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("akam_student_application");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (
            parsed.referenceId === targetId ||
            parsed.id === targetId ||
            (deletingApp.email && parsed.email === deletingApp.email)
          ) {
            localStorage.removeItem("akam_student_application");
            localStorage.removeItem("akam_masika_pass");
            localStorage.removeItem("akam_pass_type");
          }
        } catch {
          // ignore
        }
      }
    }
  };

  // Manual Add Student Pass
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualCollege.trim() || !manualEmail.trim()) {
      alert("Please fill in the student's name, college, and email.");
      return;
    }

    setManualSubmitting(true);
    let finalIdCardUrl = manualIdCardPreview || "";
    let finalIdCardName = manualIdCardName || "";

    if (manualIdCardFile) {
      try {
        const formData = new FormData();
        formData.append("file", manualIdCardFile);

        const uploadRes = await fetch(`${API_BASE_URL}/uploads/image`, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const json = await uploadRes.json();
          if (json?.url || json?.path) {
            finalIdCardUrl = json.url || json.path;
          }
        }
      } catch (err) {
        console.warn("Upload failed, utilizing preview reference:", err);
      }
    }

    const targetEndDate = manualEndDate
      ? new Date(manualEndDate).toISOString()
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const refId = `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newApp: StudentApplication = {
      id: refId,
      referenceId: refId,
      fullName: manualName.trim(),
      institution: manualCollege.trim(),
      email: manualEmail.trim(),
      idCardUrl: finalIdCardUrl,
      idCardName: finalIdCardName,
      submittedAt: new Date().toISOString(),
      status: "APPROVED",
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUserName,
      reviewNotes: "Direct scholar pass granted by Akam Editorial Board.",
      endDate: targetEndDate,
    };

    setApplications((prev) => [newApp, ...prev]);
    setTotalCount((prev) => prev + 1);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      approved: prev.approved + 1,
    }));
    setShowManualModal(false);
    showToast(`Complimentary Scholar Pass granted to ${newApp.fullName}.`);

    try {
      const res = await apiFetch(`${API_BASE_URL}/editorial/student-verifications/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: refId,
          fullName: newApp.fullName,
          institution: newApp.institution,
          email: newApp.email,
          idCardUrl: newApp.idCardUrl,
          idCardName: newApp.idCardName,
          reviewNotes: newApp.reviewNotes,
          reviewedBy: currentUserName,
          endDate: targetEndDate,
        }),
      });

      if (res.ok) {
        const savedRecord = await res.json();
        if (savedRecord && savedRecord.referenceId) {
          setApplications((prev) => [
            savedRecord,
            ...prev.filter((p) => (p.referenceId || p.id) !== refId),
          ]);
        }
      } else {
        const errData = await res.json().catch(() => null);
        console.error("Could not sync manual grant to backend:", errData);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("akam_subscription_refresh"));
      }
    } catch (err) {
      console.warn("Could not sync manual grant to backend:", err);
    } finally {
      setManualSubmitting(false);
    }

    setManualName("");
    setManualCollege("");
    setManualEmail("");
    setManualEndDate(getFutureDateString(6));
    setManualIdCardFile(null);
    setManualIdCardPreview("");
    setManualIdCardName("");
  };

  // Optimistically update stats on status change helper
  const adjustStatsOnStatusChange = (oldStatus: string, newStatus: string) => {
    if (oldStatus === newStatus) return;
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - (oldStatus === "PENDING_APPROVAL" ? 1 : 0) + (newStatus === "PENDING_APPROVAL" ? 1 : 0),
      approved: prev.approved - (oldStatus === "APPROVED" ? 1 : 0) + (newStatus === "APPROVED" ? 1 : 0),
      rejected: prev.rejected - (oldStatus === "REJECTED" ? 1 : 0) + (newStatus === "REJECTED" ? 1 : 0),
    }));
  };

  return (
    <div className="space-y-6 font-poppins relative">
      {/* Editorial Feedback Banner (Matches Other Tabs) */}
      {toastMessage && (
        <div className="mb-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Action Bar (Matches Editorial Theme) ───────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#040706] text-[#E4F953] flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-950">Student Pass Management</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-semibold text-gray-600">{stats.total} Total Submissions</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and verify institutional ID cards for complimentary digital access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fetchApplications(1, true)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            className="border border-gray-300 shadow-xs cursor-pointer"
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowManualModal(true)}
            icon={<Plus className="w-4 h-4 text-[#E4F953]" />}
            className="bg-[#040706] hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Grant Student Pass
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards (Akam Theme) ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div
          onClick={() => handleStatusFilterChange("ALL")}
          className={`bg-white border rounded-[24px] p-5 transition-all duration-200 cursor-pointer shadow-xs group ${
            statusFilter === "ALL"
              ? "border-gray-950 ring-2 ring-gray-950 bg-gray-50/70 shadow-sm"
              : "border-gray-200/80 hover:border-gray-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-600">All Submissions</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950 tracking-tight">{stats.total}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="text-[11px] text-gray-500 font-medium">Full student roster</span>
          </div>
        </div>

        {/* Pending Card */}
        <div
          onClick={() => handleStatusFilterChange("PENDING_APPROVAL")}
          className={`bg-white border rounded-[24px] p-5 transition-all duration-200 cursor-pointer shadow-xs group ${
            statusFilter === "PENDING_APPROVAL"
              ? "border-gray-950 ring-2 ring-gray-950 bg-amber-50/40 shadow-sm"
              : "border-gray-200/80 hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
              PENDING
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950 tracking-tight">{stats.pending}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] text-amber-800 font-semibold">Awaiting Verification</span>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => handleStatusFilterChange("APPROVED")}
          className={`bg-white border rounded-[24px] p-5 transition-all duration-200 cursor-pointer shadow-xs group ${
            statusFilter === "APPROVED"
              ? "border-gray-950 ring-2 ring-gray-950 bg-emerald-50/40 shadow-sm"
              : "border-gray-200/80 hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
              APPROVED
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-950 tracking-tight">{stats.approved}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-emerald-800 font-medium">100% Free Active Passes</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => handleStatusFilterChange("REJECTED")}
          className={`bg-white border rounded-[24px] p-5 transition-all duration-200 cursor-pointer shadow-xs group ${
            statusFilter === "REJECTED"
              ? "border-gray-950 ring-2 ring-gray-950 bg-rose-50/40 shadow-sm"
              : "border-gray-200/80 hover:border-rose-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
              REJECTED
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-950 tracking-tight">{stats.rejected}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[11px] text-rose-800 font-medium">Requires Resubmission</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls (Akam Editorial Theme) ───────── */}
      <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, college, roll number, or reference..."
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black focus:bg-white shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { key: "ALL", label: "All", count: stats.total },
              { key: "PENDING_APPROVAL", label: "Pending", count: stats.pending },
              { key: "APPROVED", label: "Approved", count: stats.approved },
              { key: "REJECTED", label: "Rejected", count: stats.rejected },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusFilterChange(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#040706] text-white shadow-xs"
                    : "bg-gray-100 hover:bg-gray-200/80 text-gray-700 hover:text-gray-950"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    isActive ? "bg-[#E4F953] text-[#040706]" : "bg-white text-gray-700 shadow-2xs"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Applications Cards / List ───────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 p-16 text-center shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center mx-auto mb-3 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 font-semibold">Loading student verification roster...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[28px] border border-gray-200 p-8 shadow-xs">
          <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {searchQuery ? "No Matching Applications Found" : "Verification Roster Up to Date!"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `No student verification records found matching "${searchQuery}". Try adjusting your search query.`
              : "There are no student verification applications matching your current filter criteria."}
          </p>
          {searchQuery && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Clear Search Query
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const isPending = app.status === "PENDING_APPROVAL";
            const isApproved = app.status === "APPROVED";
            const isRejected = app.status === "REJECTED";

            return (
              <div
                key={app.referenceId || app.id}
                className={`bg-white rounded-[24px] border p-5 sm:p-6 transition-all duration-300 hover:shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 group/card shadow-xs ${
                  isPending
                    ? "border-amber-200/90"
                    : isApproved
                    ? "border-emerald-200/80"
                    : "border-gray-200/80"
                }`}
              >
                {/* Student Info & Details */}
                <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                  {/* ID Card Thumbnail */}
                  <div
                    onClick={() => {
                      if (app.idCardUrl) {
                        setImageRotation(0);
                        setSelectedAppForPreview(app);
                      }
                    }}
                    className={`relative w-28 h-20 sm:w-32 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 border border-gray-200/90 shrink-0 transition-all flex items-center justify-center ${
                      app.idCardUrl
                        ? "cursor-pointer group/thumb hover:border-[#040706] hover:shadow-md"
                        : "cursor-default"
                    }`}
                    title={app.idCardUrl ? "Click to inspect Student ID Card" : "No ID Card uploaded"}
                  >
                    {app.idCardUrl ? (
                      <>
                        <img
                          src={formatAssetUrl(app.idCardUrl)}
                          alt={app.fullName}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CreditCard className="w-2.5 h-2.5 text-[#E4F953]" />
                          <span>ID Card</span>
                        </div>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                          <Eye className="w-4 h-4 text-[#E4F953]" />
                          <span>Inspect</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-gray-400">
                        <CreditCard className="w-5 h-5 mb-1 text-gray-300" />
                        <span className="text-[9px] font-medium text-gray-400">No ID Card</span>
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                        {app.referenceId || app.id}
                      </span>

                      {/* Status Badges Matching Editorial Theme */}
                      {isPending && (
                        <span className="bg-[#E4F953] text-[#040706] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#040706]" />
                          PENDING
                        </span>
                      )}
                      {isApproved && (
                        <span className="bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          APPROVED
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 text-white" />
                          REJECTED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-950 truncate tracking-tight group-hover/card:text-emerald-800 transition-colors">
                      {app.fullName}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                      <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{app.institution}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-0.5">
                      <a
                        href={`mailto:${app.email}`}
                        className="text-gray-700 hover:text-emerald-800 flex items-center gap-1.5 hover:underline font-medium"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{app.email}</span>
                      </a>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-400">
                        Submitted: {new Date(app.submittedAt).toLocaleDateString()} at{" "}
                        {new Date(app.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Subscription End Date Badge for Approved Pass */}
                    {isApproved && (
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-xl shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Pass Valid Until:</span>
                          <span className="font-bold text-gray-950">
                            {app.endDate
                              ? new Date(app.endDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Active (Standard 6 Mo)"}
                          </span>
                          {app.endDate &&
                            (new Date(app.endDate).getTime() < Date.now() ? (
                              <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-md ml-1">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-medium ml-1">
                                ({Math.max(
                                  0,
                                  Math.ceil(
                                    (new Date(app.endDate).getTime() - Date.now()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                )}{" "}
                                days left)
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Review Notes (If any) */}
                    {app.reviewNotes && (
                      <div className="mt-2 text-[11px] bg-gray-50 border border-gray-200/80 rounded-xl p-2.5 text-gray-700 max-w-xl">
                        <strong className="font-semibold text-gray-900">Editorial Review Note:</strong> {app.reviewNotes}
                        {app.reviewedBy && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">Reviewed by: {app.reviewedBy}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar (Editorial Theme) */}
                <div className="flex lg:flex-col items-center justify-end gap-2 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  <div className="flex items-center gap-1.5 w-full lg:w-auto flex-wrap justify-end">
                    {/* Inspect ID button */}
                    <button
                      type="button"
                      disabled={!app.idCardUrl}
                      onClick={() => {
                        if (app.idCardUrl) {
                          setImageRotation(0);
                          setSelectedAppForPreview(app);
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all shadow-2xs ${
                        app.idCardUrl
                          ? "bg-white hover:bg-gray-100 border border-gray-300 text-gray-900 cursor-pointer active:scale-95"
                          : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                      }`}
                      title={app.idCardUrl ? "View uploaded student ID card" : "No ID card uploaded"}
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      <span>View ID Card</span>
                    </button>

                    {/* Pending Actions */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApproveModal(app)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-950 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Approve Free Scholar Pass (Set End Date)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectReason(PRESET_REJECT_REASONS[0]);
                            setRejectingApp(app);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Reject application"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* Approved Actions */}
                    {isApproved && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApproveModal(app)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Edit or extend subscription ending date"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Edit Expiry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectReason("Scholar status revoked by editorial review.");
                            setRejectingApp(app);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Revoke Scholar Pass"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Revoke</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(app, "PENDING_APPROVAL")}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
                          title="Revert status to Pending Review"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>To Pending</span>
                        </button>
                      </>
                    )}

                    {/* Rejected Actions */}
                    {isRejected && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApproveModal(app)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-950 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Approve pass (Set End Date)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(app, "PENDING_APPROVAL")}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl transition-all cursor-pointer"
                          title="Move back to Pending for Re-evaluation"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Re-evaluate</span>
                        </button>
                      </>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setDeletingApp(app)}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                      title="Delete application permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Infinite Scroll Sentinel & Status Indicators ───────────── */}
      <div ref={sentinelRef} className="h-6 w-full" />

      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <div className="bg-white border border-gray-200/80 px-5 py-3 rounded-2xl shadow-xs flex items-center gap-3 animate-in fade-in">
            <Loader2 className="w-4 h-4 text-[#040706] animate-spin" />
            <span className="text-xs font-semibold text-gray-700">Loading more student applications...</span>
          </div>
        </div>
      )}

      {!hasMore && applications.length > 0 && (
        <div className="text-center py-6">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100/80 px-4 py-2 rounded-full border border-gray-200/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#040706]" />
            All {totalCount} student applications loaded
          </span>
        </div>
      )}

      {/* ── Lightbox ID Card Preview Modal ──────────────────────── */}
      {selectedAppForPreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gray-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    Student ID Inspection: {selectedAppForPreview.fullName}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-300 truncate">
                    {selectedAppForPreview.institution} • {selectedAppForPreview.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 sm:p-2 text-gray-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-1 text-xs"
                  title="Rotate image"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[11px] hidden sm:inline">Rotate</span>
                </button>

                {selectedAppForPreview.idCardUrl && (
                  <a
                    href={formatAssetUrl(selectedAppForPreview.idCardUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 sm:p-2 text-gray-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-1 text-xs"
                    title="Open original in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-[11px] hidden sm:inline">Original</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAppForPreview(null)}
                  className="p-1.5 sm:p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Canvas Container */}
            <div className="flex-1 bg-slate-950 p-3 sm:p-8 flex items-center justify-center overflow-auto min-h-[200px] sm:min-h-[350px]">
              {selectedAppForPreview.idCardUrl ? (
                <div
                  className="transition-transform duration-300 max-h-[50vh] sm:max-h-[60vh] flex items-center justify-center"
                  style={{ transform: `rotate(${imageRotation}deg)` }}
                >
                  <img
                    src={formatAssetUrl(selectedAppForPreview.idCardUrl)}
                    alt={selectedAppForPreview.fullName}
                    className="max-h-[48vh] sm:max-h-[58vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/20"
                  />
                </div>
              ) : (
                <div className="text-center p-6 sm:p-8 text-gray-400">
                  <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-300">No Student ID Card Uploaded</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">This record was submitted or granted without an attached ID card image.</p>
                </div>
              )}
            </div>

            {/* Bottom Decision Footer */}
            <div className="bg-white p-3.5 sm:p-5 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-gray-500 flex items-center justify-between sm:justify-start">
                <span>Ref: <span className="font-mono font-bold text-gray-800">{selectedAppForPreview.referenceId}</span></span>
                <span className="mx-2 hidden sm:inline">•</span>
                <span>
                  Status:{" "}
                  <strong
                    className={`font-semibold ${
                      selectedAppForPreview.status === "APPROVED"
                        ? "text-emerald-600"
                        : selectedAppForPreview.status === "REJECTED"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}
                  >
                    {selectedAppForPreview.status}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {selectedAppForPreview.status !== "APPROVED" ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => openApproveModal(selectedAppForPreview)}
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    className="col-span-2 sm:col-span-1 justify-center bg-gray-950 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    Approve Free Pass
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => openApproveModal(selectedAppForPreview)}
                    icon={<Calendar className="w-4 h-4 text-[#E4F953] shrink-0" />}
                    className="col-span-2 sm:col-span-1 justify-center bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    Edit Expiry Date
                  </Button>
                )}

                {selectedAppForPreview.status !== "REJECTED" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRejectReason(PRESET_REJECT_REASONS[0]);
                      setRejectingApp(selectedAppForPreview);
                    }}
                    icon={<XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                    className="justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Reject
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const toDel = selectedAppForPreview;
                    setSelectedAppForPreview(null);
                    setDeletingApp(toDel);
                  }}
                  icon={<Trash2 className="w-4 h-4 text-rose-600 shrink-0" />}
                  className="justify-center border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Delete
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedAppForPreview(null)}
                  className="col-span-2 sm:col-span-1 justify-center border border-gray-300 hover:bg-gray-100 text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Prompt Modal (In-App) ─────────────────── */}
      {rejectingApp && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-[24px] p-6 shadow-2xl space-y-4 border border-gray-200/80">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Reject Application</h3>
              </div>
              <button
                onClick={() => setRejectingApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              State the reason for rejecting <strong>{rejectingApp.fullName}</strong>&rsquo;s student ID verification.
            </p>

            {/* Quick Reason Chips */}
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 mb-1.5">Quick Select Reason:</span>
              <div className="space-y-1.5">
                {PRESET_REJECT_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`w-full text-left text-xs p-2.5 rounded-xl border transition cursor-pointer ${
                      rejectReason === preset
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-medium"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Review Note / Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#040706] focus:ring-1 focus:ring-[#040706]"
                placeholder="Specify rejection details..."
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectingApp(null)}
                className="w-full sm:w-auto justify-center text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!rejectReason.trim()}
                onClick={() => handleUpdateStatus(rejectingApp, "REJECTED", rejectReason)}
                className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── In-App Delete Confirmation Modal ──────────────────────── */}
      {deletingApp && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl space-y-4 border border-gray-200/80">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-gray-950">Delete Application?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete the record for <strong>{deletingApp.fullName}</strong> (
                {deletingApp.referenceId})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeletingApp(null)}
                className="flex-1 text-xs font-semibold py-2.5 rounded-xl cursor-pointer border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Application / Set Subscription End Date Modal ─ */}
      {approvingApp && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-[24px] p-6 shadow-2xl space-y-4 border border-gray-200/80 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gray-950 text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-950">
                    {approvingApp.status === "APPROVED" ? "Update Pass Expiry Date" : "Approve Student Scholar Pass"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Configure subscription ending date and confirm student scholarship
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{approvingApp.fullName}</span>
                <span className="font-mono text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  {approvingApp.referenceId || approvingApp.id}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-gray-600 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{approvingApp.institution}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{approvingApp.email}</span>
                </div>
              </div>
              {approvingApp.idCardUrl && (
                <div className="pt-1.5 border-t border-gray-200/70 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Attached ID Card:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageRotation(0);
                      setSelectedAppForPreview(approvingApp);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect ID Document
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              {/* Subscription Ending Date Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Subscription Ending Date (Access Expiry) <span className="text-red-500">*</span>
                  </label>
                  {approveEndDate && !isNaN(new Date(approveEndDate).getTime()) && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {Math.ceil((new Date(approveEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 0
                        ? `~${Math.ceil((new Date(approveEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days access`
                        : "Past date"}
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 mr-0.5">Quick Presets:</span>
                  {[
                    { label: "1 Month", val: getFutureDateString(1) },
                    { label: "3 Months", val: getFutureDateString(3) },
                    { label: "6 Months (Standard)", val: getFutureDateString(6) },
                    { label: "1 Year", val: getFutureDateString(12) },
                    { label: "Academic (31 May)", val: getAcademicYearEndString() },
                  ].map((preset) => {
                    const isSelected = approveEndDate === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setApproveEndDate(preset.val)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer ${
                          isSelected
                            ? "bg-gray-950 border-gray-950 text-white font-semibold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Date Input */}
                <div>
                  <input
                    type="date"
                    required
                    min={formatDateForInput(new Date())}
                    value={approveEndDate}
                    onChange={(e) => setApproveEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-black shadow-xs transition"
                  />
                </div>

                {/* Duration summary banner */}
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Student pass will remain <strong>Active & 100% Free</strong> until{" "}
                    <strong>
                      {approveEndDate && !isNaN(new Date(approveEndDate).getTime())
                        ? new Date(approveEndDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "selected date"}
                    </strong>
                    . An email with this expiry date will be delivered to the student.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setApprovingApp(null)}
                  className="w-full sm:w-auto justify-center text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer shadow-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={approveSubmitting}
                  disabled={!approveEndDate}
                  className="w-full sm:w-auto justify-center bg-gray-950 hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  {approvingApp.status === "APPROVED" ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E4F953]" />
                      Update Expiry Date
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Confirm & Approve Pass
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manual Add Student Pass Modal ───────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-2xl space-y-4 border border-gray-200/80">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gray-950 text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-950">Direct Editorial Scholar Grant</h3>
                  <p className="text-[11px] text-gray-500">Manually issue a 100% complimentary student pass</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Sandra Pillai"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black shadow-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  College / University / School <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualCollege}
                  onChange={(e) => setManualCollege(e.target.value)}
                  placeholder="e.g. S.N. College, Kollam"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black shadow-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black shadow-xs transition"
                />
              </div>

              {/* Subscription Ending Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Subscription Ending Date <span className="text-red-500">*</span>
                  </label>
                  {manualEndDate && !isNaN(new Date(manualEndDate).getTime()) && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {Math.ceil((new Date(manualEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 0
                        ? `~${Math.ceil((new Date(manualEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                        : "Past"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {[
                    { label: "1 Mo", val: getFutureDateString(1) },
                    { label: "3 Mo", val: getFutureDateString(3) },
                    { label: "6 Mo (Default)", val: getFutureDateString(6) },
                    { label: "1 Yr", val: getFutureDateString(12) },
                    { label: "Academic (31 May)", val: getAcademicYearEndString() },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setManualEndDate(preset.val)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition font-medium cursor-pointer ${
                        manualEndDate === preset.val
                          ? "bg-gray-950 border-gray-950 text-white font-semibold"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="date"
                  required
                  min={formatDateForInput(new Date())}
                  value={manualEndDate}
                  onChange={(e) => setManualEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black shadow-xs transition"
                />
              </div>

              {/* Student ID Card Document / Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Student ID Card Document / Photo
                  </label>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Optional
                  </span>
                </div>

                {/* Hidden File and Camera Inputs */}
                <input
                  type="file"
                  ref={manualCameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleManualFileChange(e.target.files[0]);
                    }
                  }}
                />
                <input
                  type="file"
                  ref={manualFileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleManualFileChange(e.target.files[0]);
                    }
                  }}
                />

                {!manualIdCardPreview ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => manualCameraInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Camera className="w-4 h-4 text-[#E4F953]" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => manualFileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <UploadCloud className="w-4 h-4 text-gray-600" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setManualIsDragOver(true);
                      }}
                      onDragLeave={() => setManualIsDragOver(false)}
                      onDrop={handleManualDrop}
                      onClick={() => manualFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                        manualIsDragOver
                          ? "border-black bg-gray-100"
                          : "border-gray-200 hover:border-gray-400 bg-gray-50/70 hover:bg-gray-50"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-gray-400" />
                      <span className="text-[11px] text-gray-500">
                        Or drag & drop student ID card photo (PNG, JPG, WebP up to 10MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-emerald-200 rounded-2xl p-3 bg-emerald-50/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                        <img
                          src={manualIdCardPreview}
                          alt="ID Card Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {manualIdCardName || "Student_ID_Card.png"}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready to attach
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => manualFileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualIdCardFile(null);
                          setManualIdCardPreview("");
                          setManualIdCardName("");
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowManualModal(false)}
                  className="w-full sm:w-auto justify-center text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-900 cursor-pointer shadow-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={manualSubmitting}
                  className="w-full sm:w-auto justify-center bg-gray-950 hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  Grant Active Scholar Pass
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentVerificationsPanel;
