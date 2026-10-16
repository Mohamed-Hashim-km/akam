"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

function PaymentStatusContent() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "success";
  const txnid = searchParams.get("txnid") || "";
  const reason = searchParams.get("reason") || "Payment could not be completed. Please try again.";
  const isSuccess = status === "success";

  useEffect(() => {
    if (isSuccess && typeof window !== "undefined") {
      // Set local storage markers
      localStorage.setItem("akam_masika_pass", "true");
      localStorage.setItem("akam_pass_type", "6-Month Akam Digital Pass");
      localStorage.setItem("akam_pass_cycle", "sixmonth");
      if (txnid) localStorage.setItem("akam_pass_txn", txnid);
      localStorage.setItem("akam_pass_date", new Date().toISOString());

      // Sync user subscription status from backend
      const syncUser = async () => {
        try {
          const res = await apiFetch(`${API_BASE_URL}/subscription/me`);
          if (res.ok) {
            const subData = await res.json();
            const rawUser = localStorage.getItem("akam_user");
            if (rawUser) {
              const userObj = JSON.parse(rawUser);
              localStorage.setItem(
                "akam_user",
                JSON.stringify({
                  ...userObj,
                  subscriptionStatus: "ACTIVE",
                  subscriptionEndDate: subData.endDate ?? null,
                  isStudent: false,
                }),
              );
            }
          }
        } catch {
          // ignore network failure
        } finally {
          window.dispatchEvent(new Event("akam_user_updated"));
        }
      };

      syncUser();
    }
  }, [isSuccess, txnid]);

  if (!isSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#EFF8FC] font-poppins">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight mb-4">
            Payment Incomplete
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8">
            {reason}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/plans">
              <Button variant="primary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
                Back to Plans
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#EFF8FC] font-poppins">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-950 tracking-tight mb-4">
          Thank You
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto mb-8">
          Your 6-Month Akam Digital Pass has been confirmed and activated. You now have full digital reading access to all stories and editions.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
              Back to Home
            </Button>
          </Link>
          <Link href="/emagazine">
            <Button variant="secondary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
              Read E-Magazine
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center bg-[#EFF8FC] font-poppins">
          <div className="w-8 h-8 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
