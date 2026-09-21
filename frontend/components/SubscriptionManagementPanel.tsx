"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  User,
  Plus,
  Mail,
  ShieldCheck,
  GraduationCap,
  Ban,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";
import StudentVerificationsPanel from "./StudentVerificationsPanel";
import { useRouter, useSearchParams } from "next/navigation";

interface SubscriberItem {
  id: string;
  userId: string;
  planType: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  startDate: string;
  endDate: string;
  isStudent: boolean;
  txnId: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
}

interface StatsData {
  total: number;
  active: number;
  paid: number;
  student: number;
  cancelled?: number;
  expired: number;
  estimatedRevenue: number;
}

interface SubscriptionManagementPanelProps {
  currentUserEmail?: string;
  currentUserName?: string;
  onNotify?: (msg: string) => void;
}

export const SubscriptionManagementPanel: React.FC<SubscriptionManagementPanelProps> = ({
  currentUserEmail = "editorial@akamdigital.com",
  currentUserName = "Akam Editorial Board",
  onNotify,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sub-Tab State: 'subscribers' | 'verifications'
  const [subTab, setSubTab] = useState<"subscribers" | "verifications">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("subTab");
      if (p === "verifications" || p === "verification") return "verifications";
    }
    return "subscribers";
  });

  // Sync subTab with URL query param
  useEffect(() => {
    const p = searchParams?.get("subTab");
    if (p === "verifications" || p === "verification") {
      setSubTab("verifications");
    } else if (p === "subscribers") {
      setSubTab("subscribers");
    }
  }, [searchParams]);

  const handleSubTabChange = (nextTab: "subscribers" | "verifications") => {
    setSubTab(nextTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "subscriptions");
    params.set("subTab", nextTab);
    params.set("page", "1");
    router.push(`/editorial?${params.toString()}`);
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PAID" | "STUDENT">("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    paid: 0,
    student: 0,
    cancelled: 0,
    expired: 0,
    estimatedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Grant Modal state
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantMonths, setGrantMonths] = useState(6);
  const [grantIsStudent, setGrantIsStudent] = useState(false);
  const [grantNote, setGrantNote] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  // Cancel Confirmation modal state
  const [cancellingSub, setCancellingSub] = useState<SubscriberItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/subscription/editorial/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setFetchError(null);
      } else {
        console.warn(`[SubscriptionPanel] stats request failed with status: ${res.status}`);
      }
    } catch (e: any) {
      console.error("Failed to load subscription stats", e);
      setFetchError(e.message || "Failed to connect to subscription service");
    }
  }, []);

  // Fetch subscribers list
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await apiFetch(`${API_BASE_URL}/subscription/editorial/list?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSubscribers(json.data || []);
        setTotalCount(json.total || 0);
        setTotalPages(json.totalPages || 1);
        setFetchError(null);
      } else {
        console.warn(`[SubscriptionPanel] list request failed with status: ${res.status}`);
        setSubscribers([]);
      }
    } catch (e: any) {
      console.error("Failed to load subscriber list", e);
      setSubscribers([]);
      setFetchError(e.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const onSyncRefresh = () => {
      fetchStats();
      fetchList();
    };
    window.addEventListener("akam_subscription_refresh", onSyncRefresh);
    return () => window.removeEventListener("akam_subscription_refresh", onSyncRefresh);
  }, [fetchStats, fetchList]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchList()]);
  };

  // Grant Subscription
  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantEmail.trim()) {
      setGrantError("Please enter the user's email address");
      return;
    }
    setGrantLoading(true);
    setGrantError(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/subscription/editorial/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: grantEmail.trim(),
          durationMonths: grantMonths,
          isStudent: grantIsStudent,
          note: grantNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to grant subscription");
      }
      setGrantModalOpen(false);
      setGrantEmail("");
      setGrantNote("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("akam_subscription_refresh"));
      }
      if (onNotify) {
        onNotify(`✅ Successfully granted ${grantMonths}-month pass to ${grantEmail}`);
      }
      handleRefresh();
    } catch (err: any) {
      setGrantError(err.message || "An error occurred");
    } finally {
      setGrantLoading(false);
    }
  };

  // Cancel Subscription
  const handleCancelConfirm = async () => {
    if (!cancellingSub) return;
    setCancelLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/subscription/editorial/${cancellingSub.id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setCancellingSub(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("akam_subscription_refresh"));
        }
        if (onNotify) {
          onNotify(`Subscription for ${cancellingSub.userEmail} cancelled`);
        }
        handleRefresh();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to cancel subscription");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  // Helper date formatter
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  // Remaining days calculation
  const getRemainingDaysText = (endDateStr: string, isActive: boolean, status?: string) => {
    if (status?.toUpperCase() === "CANCELLED") {
      return "Cancelled";
    }
    try {
      const end = new Date(endDateStr).getTime();
      const now = Date.now();
      const diffDays = Math.round((end - now) / (1000 * 60 * 60 * 24));
      if (!isActive || diffDays <= 0) {
        return "Expired";
      }
      if (diffDays === 1) return "1 day left";
      return `${diffDays} days left`;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Sub-Tabs Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
            Section Navigation
          </span>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch between digital subscribers roster and student scholarship verification.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-2xs shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSubTabChange("subscribers")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl transition cursor-pointer text-center ${
              subTab === "subscribers"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Subscribers</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200/80 text-gray-700 font-mono shrink-0">
              {stats.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange("verifications")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl transition cursor-pointer text-center ${
              subTab === "verifications"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">Student Verifications</span>
          </button>
        </div>
      </div>

      {subTab === "verifications" ? (
        <StudentVerificationsPanel
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          onNotify={onNotify}
        />
      ) : (
        <>
          {/* Top KPI Stat Cards & Actions */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Overview & Revenue Metrics
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 mr-1" />}
                  onClick={() => {
                    setGrantError(null);
                    setGrantModalOpen(true);
                  }}
                  className="flex-1 sm:flex-initial justify-center cursor-pointer"
                >
                  Grant Pass
                </Button>
              </div>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {/* Card 1: Active Subscribers */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Active Passes
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-950">{stats.active}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">Currently valid</p>
              </div>

              {/* Card 2: Paid 6-Mo Passes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Paid (₹399)
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-950">{stats.paid}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">6-Month Digital Passes</p>
              </div>

              {/* Card 3: Free Student Passes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Student Passes
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-950">{stats.student}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-[11px] text-purple-600 font-medium truncate">100% Free Grant</span>
                  <button
                    type="button"
                    onClick={() => handleSubTabChange("verifications")}
                    className="text-[10px] sm:text-[11px] text-purple-600 hover:text-purple-800 font-semibold underline flex items-center gap-0.5 ml-auto cursor-pointer"
                  >
                    Verify <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Card 4: Est. Revenue */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Est. Revenue
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-950 truncate">₹{stats.estimatedRevenue.toLocaleString()}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">From subscriptions</p>
              </div>

              {/* Card 5: Expired / Total */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Total Records
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-950">{stats.total}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">
                  {stats.cancelled !== undefined ? `${stats.cancelled} cancelled · ${stats.expired} expired` : `${stats.expired} inactive`}
                </p>
              </div>
            </div>
          </div>

      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800">Connection notice:</span>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      {/* Filter and Search Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or transaction ID..."
            className="w-full pl-10 pr-9 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-hidden focus:border-gray-950 transition text-gray-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Status Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold gap-1 sm:gap-0">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                statusFilter === "ALL" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => {
                setStatusFilter("ACTIVE");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                statusFilter === "ACTIVE" ? "bg-white text-emerald-700 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter("CANCELLED");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                statusFilter === "CANCELLED" ? "bg-white text-rose-700 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => {
                setStatusFilter("EXPIRED");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                statusFilter === "EXPIRED" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Expired
            </button>
          </div>

          {/* Type Filter */}
          <div className="grid grid-cols-3 sm:flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setTypeFilter("ALL");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                typeFilter === "ALL" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setTypeFilter("PAID");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                typeFilter === "PAID" ? "bg-white text-blue-700 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Paid (₹399)
            </button>
            <button
              onClick={() => {
                setTypeFilter("STUDENT");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                typeFilter === "STUDENT" ? "bg-white text-purple-700 shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Student Free
            </button>
          </div>
        </div>
      </div>

      {/* Subscribers Table (Desktop) & Cards List (Mobile) */}
      <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-600">Loading subscription records...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No subscribers found</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              {debouncedSearch || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "Try adjusting your filters or search query to find matching records."
                : "No users currently have an active or expired subscription record."}
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 mr-1" />}
              onClick={() => setGrantModalOpen(true)}
              className="cursor-pointer"
            >
              Grant First Pass
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-gray-100">
              {subscribers.map((item) => {
                const remainingText = getRemainingDaysText(item.endDate, item.isActive, item.status);
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    {/* Header: User Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.userAvatarUrl ? (
                          <img
                            src={formatAssetUrl(item.userAvatarUrl)}
                            alt={item.userName || "User"}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {(item.userName?.[0] || item.userEmail[0] || "U").toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-900 text-xs truncate">
                              {item.userName || "Unnamed Reader"}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 font-mono shrink-0">
                              {item.userRole}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 block font-mono truncate">
                            {item.userEmail}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0">
                        {item.status?.toUpperCase() === "CANCELLED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Ban className="w-3 h-3" />
                            Cancelled
                          </span>
                        ) : item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Row: Plan + Remaining */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50 text-xs">
                      <div>
                        {item.isStudent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                            <GraduationCap className="w-3 h-3" />
                            Student (Free)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            <ShieldCheck className="w-3 h-3" />
                            6-Month (₹399)
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          item.status?.toUpperCase() === "CANCELLED"
                            ? "text-rose-600 font-semibold"
                            : item.isActive
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {remainingText}
                      </span>
                    </div>

                    {/* Validity Period & Txn */}
                    <div className="bg-gray-50/70 rounded-xl p-2.5 space-y-1 text-[11px] text-gray-500 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Validity:</span>
                        <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Txn Ref:</span>
                        <span className="truncate max-w-[180px]">{item.txnId || "MANUAL"}</span>
                      </div>
                    </div>

                    {/* Actions Button */}
                    <div className="pt-1">
                      {item.isActive ? (
                        <button
                          onClick={() => setCancellingSub(item)}
                          className="w-full py-2 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cancel Subscription
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setGrantEmail(item.userEmail);
                            setGrantIsStudent(item.isStudent);
                            setGrantMonths(6);
                            setGrantModalOpen(true);
                          }}
                          className="w-full py-2 text-xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition border border-emerald-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Renew / Extend Pass
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Subscriber</th>
                    <th className="py-3.5 px-4">Plan / Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Valid Period</th>
                    <th className="py-3.5 px-4">Remaining</th>
                    <th className="py-3.5 px-4">Txn / Reference</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-normal">
                  {subscribers.map((item) => {
                    const remainingText = getRemainingDaysText(item.endDate, item.isActive, item.status);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* User Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {item.userAvatarUrl ? (
                              <img
                                src={formatAssetUrl(item.userAvatarUrl)}
                                alt={item.userName || "User"}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                                {(item.userName?.[0] || item.userEmail[0] || "U").toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 text-xs">
                                  {item.userName || "Unnamed Reader"}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 font-mono">
                                  {item.userRole}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400 block font-mono">
                                {item.userEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan Type Column */}
                        <td className="py-3.5 px-4">
                          {item.isStudent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                              <GraduationCap className="w-3 h-3" />
                              Student (Free)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <ShieldCheck className="w-3 h-3" />
                              6-Month Pass (₹399)
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {item.status?.toUpperCase() === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" />
                              Cancelled
                            </span>
                          ) : item.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              Expired
                            </span>
                          )}
                        </td>

                        {/* Period Column */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                          <div>{formatDate(item.startDate)}</div>
                          <div className="text-gray-400 text-[10px]">to {formatDate(item.endDate)}</div>
                        </td>

                        {/* Remaining Column */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] font-medium ${
                              item.status?.toUpperCase() === "CANCELLED"
                                ? "text-rose-600 font-semibold"
                                : item.isActive
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }`}
                          >
                            {remainingText}
                          </span>
                        </td>

                        {/* Txn ID Column */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 block max-w-[140px] truncate">
                            {item.txnId || "MANUAL"}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.isActive ? (
                              <button
                                onClick={() => setCancellingSub(item)}
                                title="Cancel or expire subscription"
                                className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setGrantEmail(item.userEmail);
                                  setGrantIsStudent(item.isStudent);
                                  setGrantMonths(6);
                                  setGrantModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-emerald-200 cursor-pointer"
                              >
                                Renew
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 text-center sm:text-left">
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal: Grant / Extend Subscription */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-poppins animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setGrantModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-950">Grant Subscription Pass</h3>
                <p className="text-xs text-gray-500">Assign or extend a digital pass for a registered user.</p>
              </div>
            </div>

            {grantError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{grantError}</span>
              </div>
            )}

            <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">User Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-gray-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Pass Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGrantIsStudent(false)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      !grantIsStudent
                        ? "border-blue-500 bg-blue-50/50 text-blue-950"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Paid Pass
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">₹399 Digital Access</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantIsStudent(true)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      grantIsStudent
                        ? "border-purple-500 bg-purple-50/50 text-purple-950"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      Student Pass
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">100% Free Grant</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Duration</label>
                <select
                  value={grantMonths}
                  onChange={(e) => setGrantMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-gray-950 bg-white"
                >
                  <option value={6}>6 Months (Standard Akam Pass)</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={3}>3 Months</option>
                  <option value={1}>1 Month</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Editorial Note / Reference (Optional)</label>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="e.g. Granted by Chief Editor / Offline payment"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-gray-950"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={grantLoading}
                  className="cursor-pointer"
                >
                  {grantLoading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Granting...
                    </span>
                  ) : (
                    "Confirm & Grant Pass"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Cancel */}
      {cancellingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-poppins animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-950 mb-1">Cancel Subscription?</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Are you sure you want to cancel the pass for{" "}
              <strong className="text-gray-800">{cancellingSub.userEmail}</strong>? The user will immediately revert
              to free preview access.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingSub(null)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer font-medium text-xs"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer font-medium text-xs disabled:opacity-50"
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel Pass"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementPanel;
