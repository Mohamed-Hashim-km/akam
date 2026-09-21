"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, X } from "lucide-react";
import Button from "./ui/Button";
import dynamic from "next/dynamic";
import AuthModal from "./AuthModal";

const PayUModal = dynamic(() => import("./PayUModal"), { ssr: false });
const StudentVerificationModal = dynamic(() => import("./StudentVerificationModal"), { ssr: false });

interface FreemiumPaywallProps {
  /** Set true to actually render the paywall overlay */
  visible: boolean;
  /** True if user is logged-in (but not subscribed) */
  isLoggedIn: boolean;
  onDismiss?: () => void;
  onSubscribed?: () => void;
}

const FreemiumPaywall: React.FC<FreemiumPaywallProps> = ({
  visible,
  isLoggedIn,
  onDismiss,
  onSubscribed,
}) => {
  const [payUOpen, setPayUOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  if (!visible) return null;

  const handleCTA = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
    } else {
      setPayUOpen(true);
    }
  };

  const handleSubscribeSuccess = () => {
    setPayUOpen(false);
    if (onSubscribed) onSubscribed();
  };

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    // After login, open PayU right away
    setTimeout(() => setPayUOpen(true), 400);
  };

  return (
    <>
      {/* Paywall overlay — sticky at bottom of story, not a full block */}
      <div className="relative w-full pointer-events-none font-poppins" aria-live="polite">
        {/* Gradient fade from transparent to white */}
        <div className="h-32 bg-gradient-to-b from-transparent to-white w-full -mt-32 pointer-events-none" />

        {/* Paywall card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl mx-auto max-w-3xl lg:max-w-4xl pointer-events-auto overflow-hidden">
          {/* Accent top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#E4F953] via-emerald-400 to-emerald-600" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gray-950 flex items-center justify-center shrink-0">
              <Lock className="w-7 h-7 text-[#E4F953]" />
            </div>

            {/* Text block */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1">
                Free Preview Ended
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-gray-950 mb-1">
                Subscribe to keep reading
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You&apos;ve reached the end of your free preview. Get full access to
                every story and the AKAM E-Magazine for 6 months.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
                iconPosition="right"
                className="whitespace-nowrap cursor-pointer"
                onClick={handleCTA}
              >
                {isLoggedIn ? "Subscribe — ₹399 / 6 Mo" : "Sign in to Subscribe"}
              </Button>
              <button
                type="button"
                onClick={() => setStudentModalOpen(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2 cursor-pointer transition-colors"
              >
                Student? 100% Free Pass
              </button>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                  Dismiss for now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal (if not logged in) */}
      {authOpen && (
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
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
        />
      )}
    </>
  );
};

export default FreemiumPaywall;
