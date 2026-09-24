"use client";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, apiFetch } from "./config";

export interface SubscriptionState {
  isSubscribed: boolean;
  subscriptionEndDate: string | null;
  isStudent: boolean;
  isLoading: boolean;
}

function readFromLocalStorage(): Omit<SubscriptionState, "isLoading"> {
  if (typeof window === "undefined") {
    return { isSubscribed: false, subscriptionEndDate: null, isStudent: false };
  }
  try {
    const raw = localStorage.getItem("akam_user");
    const masikaPass = localStorage.getItem("akam_masika_pass") === "true";
    let isStudentApproved = false;
    const studentAppRaw = localStorage.getItem("akam_student_application");
    if (studentAppRaw) {
      try {
        const studentApp = JSON.parse(studentAppRaw);
        if (studentApp?.status === "APPROVED") {
          isStudentApproved = true;
        }
      } catch {}
    }

    if (!raw) {
      const active = masikaPass || isStudentApproved;
      return { isSubscribed: active, subscriptionEndDate: null, isStudent: isStudentApproved };
    }

    const user = JSON.parse(raw);
    const roleUpper = (user?.role || "").toUpperCase();
    const isEditorOrAdmin = ["ADMIN", "EDITOR", "EDITORIAL", "CHIEF_EDITOR", "STAFF_EDITOR"].includes(roleUpper);
    if (isEditorOrAdmin) {
      return { isSubscribed: true, subscriptionEndDate: null, isStudent: false };
    }

    const endDate: string | null = user?.subscriptionEndDate ?? null;
    const status: string | null = user?.subscriptionStatus ?? null;

    // Explicit cancellation takes priority over cached local passes
    if (status === "CANCELLED") {
      return { isSubscribed: false, subscriptionEndDate: endDate, isStudent: false };
    }

    const isActive =
      status === "ACTIVE" && (endDate == null || new Date(endDate) > new Date());
    const hasAccess = isActive || masikaPass || isStudentApproved;

    return {
      isSubscribed: hasAccess,
      subscriptionEndDate: endDate,
      isStudent: isStudentApproved,
    };
  } catch {
    return { isSubscribed: false, subscriptionEndDate: null, isStudent: false };
  }
}

export function useSubscription(): SubscriptionState & {
  refreshSubscription: () => Promise<void>;
} {
  const [state, setState] = useState<Omit<SubscriptionState, "isLoading">>(
    readFromLocalStorage,
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
    if (!token) {
      setState(readFromLocalStorage());
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/subscription/me`);
      if (res.ok) {
        const data = await res.json();
        // If cancelled or inactive, clear local pass flags
        if (!data.isActive) {
          localStorage.removeItem("akam_masika_pass");
          localStorage.removeItem("akam_pass_type");
          if (data.status === "CANCELLED") {
            const app = localStorage.getItem("akam_student_application");
            if (app) {
              try {
                const p = JSON.parse(app);
                p.status = "REJECTED";
                p.reviewNotes = "Scholar pass cancelled by editorial desk";
                localStorage.setItem("akam_student_application", JSON.stringify(p));
              } catch {}
            }
          }
        }
        // Merge into localStorage user object if changed
        const raw = localStorage.getItem("akam_user");
        if (raw) {
          const user = JSON.parse(raw);
          const roleUpper = (user?.role || "").toUpperCase();
          const isEditorOrAdmin = ["ADMIN", "EDITOR", "EDITORIAL", "CHIEF_EDITOR", "STAFF_EDITOR"].includes(roleUpper);
          const effectiveActive = isEditorOrAdmin || data.isActive === true;
          const newStatus = effectiveActive ? "ACTIVE" : (data.status || (data.endDate ? "EXPIRED" : null));
          const newEndDate = isEditorOrAdmin ? null : (data.endDate ?? null);
          const newIsStudent = data.isStudent ?? false;

          if (
            user.subscriptionStatus !== newStatus ||
            user.subscriptionEndDate !== newEndDate ||
            user.isStudent !== newIsStudent
          ) {
            const updated = {
              ...user,
              subscriptionStatus: newStatus,
              subscriptionEndDate: newEndDate,
              isStudent: newIsStudent,
            };
            localStorage.setItem("akam_user", JSON.stringify(updated));
          }
        }
        const rawUser = localStorage.getItem("akam_user");
        const parsedRole = rawUser ? (JSON.parse(rawUser)?.role || "").toUpperCase() : "";
        const isEditor = ["ADMIN", "EDITOR", "EDITORIAL", "CHIEF_EDITOR", "STAFF_EDITOR"].includes(parsedRole);

        setState({
          isSubscribed: isEditor || data.isActive === true,
          subscriptionEndDate: data.endDate ?? null,
          isStudent: data.isStudent ?? false,
        });
      }
    } catch {
      // Fallback to localStorage if server unreachable
      setState(readFromLocalStorage());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Re-validate in background on mount if logged in
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
    if (token) {
      refreshSubscription();
    }
  }, [refreshSubscription]);

  // 2. Sync state on akam_user_updated & akam_subscription_refresh events
  useEffect(() => {
    const sync = () => setState(readFromLocalStorage());
    window.addEventListener("akam_user_updated", sync);
    window.addEventListener("akam_subscription_refresh", refreshSubscription);
    return () => {
      window.removeEventListener("akam_user_updated", sync);
      window.removeEventListener("akam_subscription_refresh", refreshSubscription);
    };
  }, [refreshSubscription]);

  // 3. Auto-sync on window focus / tab visibility (when admin grants pass or user returns to tab)
  useEffect(() => {
    const handleRevalidate = () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
      if (token) {
        refreshSubscription();
      }
    };

    window.addEventListener("focus", handleRevalidate);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleRevalidate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSubscription]);

  return { ...state, isLoading, refreshSubscription };
}
