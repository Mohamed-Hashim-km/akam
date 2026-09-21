"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Shield, Download, Sparkles, Check, Lock, GraduationCap } from "lucide-react";
import Button from "./ui/Button";
import dynamic from "next/dynamic";

const PayUModal = dynamic(() => import("./PayUModal"), { ssr: false });
const StudentVerificationModal = dynamic(() => import("./StudentVerificationModal"), { ssr: false });
const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });

interface SubscriptionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  context?: "emagazine" | "edition";
}

const BENEFITS = [
  { icon: BookOpen, text: "Access all e-magazine editions — past & future" },
  { icon: Download, text: "Download any edition as PDF" },
  { icon: Sparkles, text: "Curated literary picks every edition" },
  { icon: Shield, text: "Ad-free, distraction-free reading" },
];

const SubscriptionGateModal: React.FC<SubscriptionGateModalProps> = ({
  isOpen,
  onClose,
  onSubscribed,
  context = "emagazine",
}) => {
  const [payUOpen, setPayUOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const u = localStorage.getItem("akam_user");
        const token = localStorage.getItem("akam_token");
        if (u && token) {
          try {
            setUser(JSON.parse(u));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      };
      loadUser();
      window.addEventListener("akam_user_updated", loadUser);
      return () => window.removeEventListener("akam_user_updated", loadUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribeSuccess = () => {
    setPayUOpen(false);
    onClose();
    if (onSubscribed) onSubscribed();
  };

  const handleCtaClick = () => {
    if (!user) {
      setAuthOpen(true);
    } else {
      setPayUOpen(true);
    }
  };

  return (
    <>
      {/* Gate Modal */}
      {!payUOpen && !studentModalOpen && !authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-poppins animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden">
            {/* Decorative top gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E4F953] via-emerald-400 to-emerald-600" />

            <div className="p-6 sm:p-8">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lock Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-950 mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#E4F953]" />
              </div>

              {/* Headline */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 text-center mb-1.5">
                {context === "emagazine"
                  ? "Subscribers Only"
                  : "This Edition is for Subscribers"}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <GraduationCap className="w-3 h-3" />
                  100% Free for Students
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  ₹399 / 6 Months
                </span>
              </div>

              <p className="text-xs text-gray-500 text-center mb-5 leading-relaxed">
                The AKAM E-Magazine is an exclusive curated journal. Subscribe for unlimited access or claim your complimentary student pass.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-6">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Pricing pill */}
              <div className="bg-gray-950 text-white rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                    6-Month Plan
                  </p>
                  <p className="text-lg font-bold">₹399</p>
                </div>
                <span className="bg-[#E4F953] text-gray-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                  Best Value
                </span>
              </div>

              {/* CTA */}
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center cursor-pointer"
                onClick={handleCtaClick}
              >
                {user ? "Subscribe Now — ₹399 / 6 months" : "Sign in to Subscribe"}
              </Button>

              {/* Divider */}
              <div className="my-4 flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="shrink-0 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none">
                  OR FOR STUDENTS
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Student Scholar Pass Option */}
              <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0FA975] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-950 truncate">Student Scholar Pass</span>
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-sm shrink-0">
                        FREE
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 truncate">Complimentary access with college ID</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0FA975] hover:bg-[#0d8f63] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer shrink-0 active:scale-95"
                >
                  Apply Free
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayU Payment Modal */}
      {payUOpen && (
        <PayUModal
          isOpen={payUOpen}
          onClose={() => setPayUOpen(false)}
          planName="Akam Digital Pass"
          priceAmount={399}
          billingCycle="sixmonth"
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {/* Student Verification Modal */}
      {studentModalOpen && (
        <StudentVerificationModal
          isOpen={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          onStatusChange={(status) => {
            if (status === "APPROVED") {
              setStudentModalOpen(false);
              onClose();
              if (onSubscribed) onSubscribed();
            }
          }}
        />
      )}

      {/* Auth Modal */}
      {authOpen && (
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setAuthOpen(false);
            setPayUOpen(true);
          }}
        />
      )}
    </>
  );
};

export default SubscriptionGateModal;
