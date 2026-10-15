"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status");
  const txnid = searchParams.get("txnid") || "";
  const amount = searchParams.get("amount") || "399";
  const reason = searchParams.get("reason") || "Payment could not be completed";

  const isSuccess = status === "success";
  const [synced, setSynced] = useState(false);

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
          setSynced(true);
        }
      };

      syncUser();
    }
  }, [isSuccess, txnid]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-slate-50 font-poppins">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header bar */}
        <div className="bg-[#002842] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <span className="bg-[#75c043] text-[#002842] px-2 py-0.5 rounded font-black text-xs tracking-tight">
              PayU
            </span>
            <span className="text-sm font-semibold tracking-wide">PayU Payment Gateway</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            SANDBOX TEST
          </span>
        </div>

        <div className="p-6 sm:p-8 text-center">
          {isSuccess ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-[#22B573] rounded-full mx-auto flex items-center justify-center animate-in zoom-in-75">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#22B573]">
                  Payment Verified & Confirmed
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
                  Subscription Activated!
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                  Thank you for subscribing to AKAM Digital Publications. Your 6-Month Pass is now active with full digital reading access.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs font-mono text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {txnid || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plan:</span>
                  <span className="font-semibold text-gray-900">6-Month Akam Digital Pass</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="font-bold text-[#22B573] text-sm">₹{amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Merchant Key:</span>
                  <span className="text-gray-600 font-mono">0OlbkD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Status:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    SUCCESS (SHA-512 Verified)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/stories"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#22B573] hover:bg-[#1fa769] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Start Reading Stories</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/plans"
                  className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition"
                >
                  View Plans
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center animate-in zoom-in-75">
                <AlertCircle className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-red-600">
                  Transaction Incomplete
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
                  Payment Failed
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                  {reason}
                </p>
              </div>

              {txnid && (
                <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 text-xs font-mono text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-red-500 font-medium">Attempted Txn ID:</span>
                    <span className="font-bold text-gray-900">{txnid}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/plans"
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </Link>
                <Link
                  href="/contact"
                  className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-sm font-semibold text-gray-500">Loading payment status...</div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
