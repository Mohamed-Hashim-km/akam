"use client";

import React, { useState, useEffect } from "react";
import ReadingPlansSection from "@/components/ReadingPlansSection";
import AboutDigitalEdition from "@/components/AboutDigitalEdition";
import PayUModal from "@/components/PayUModal";
import AuthModal from "@/components/AuthModal";
import StudentVerificationModal, { StudentApplicationData } from "@/components/StudentVerificationModal";

export default function PlansPage() {
  const [payUModalOpen, setPayUModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"subscribe" | "student" | null>(null);
  const [user, setUser] = useState<any>(null);

  // User subscription states
  const [isPassActive, setIsPassActive] = useState(false);
  const [studentStatus, setStudentStatus] = useState<"NONE" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">("NONE");

  const loadUserState = () => {
    if (typeof window !== "undefined") {
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

      const activePass = localStorage.getItem("akam_masika_pass") === "true";
      setIsPassActive(activePass);

      const storedStudent = localStorage.getItem("akam_student_application");
      if (storedStudent) {
        try {
          const parsed = JSON.parse(storedStudent) as StudentApplicationData;
          setStudentStatus(parsed.status);
        } catch {
          // ignore corrupted data
        }
      }
    }
  };

  useEffect(() => {
    loadUserState();
    window.addEventListener("akam_user_updated", loadUserState);
    return () => window.removeEventListener("akam_user_updated", loadUserState);
  }, []);

  const handleStudentStatusChange = (newStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NONE") => {
    setStudentStatus(newStatus);
  };

  const handleSubscribeRequest = () => {
    if (!user) {
      setAuthAction("subscribe");
      setAuthModalOpen(true);
    } else {
      setPayUModalOpen(true);
    }
  };

  const handleStudentApplyRequest = () => {
    if (!user) {
      setAuthAction("student");
      setAuthModalOpen(true);
    } else {
      setStudentModalOpen(true);
    }
  };

  return (
    <main className="min-h-screen bg-white font-poppins text-gray-900 pb-16">
    

      {/* ── Features Comparison Table Section ────────────────────────── */}
      <ReadingPlansSection
        onSubscribe={handleSubscribeRequest}
        onStudentApply={handleStudentApplyRequest}
        isLoggedIn={Boolean(user)}
      />

      {/* ── PayU Checkout Modal ───────────────────────────────────────── */}
      <PayUModal
        isOpen={payUModalOpen}
        onClose={() => setPayUModalOpen(false)}
        planName="6-Month Akam Digital Pass"
        billingCycle="sixmonth"
        priceAmount={399}
        onSuccess={() => setIsPassActive(true)}
      />

      {/* ── Auth Modal (if user clicks subscribe or student pass while logged out) ───── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthAction(null);
        }}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAuthModalOpen(false);
          if (authAction === "student") {
            setStudentModalOpen(true);
          } else if (authAction === "subscribe") {
            setPayUModalOpen(true);
          }
          setAuthAction(null);
        }}
      />

      {/* ── Student ID Card Verification Modal ───────────────────────── */}
      <StudentVerificationModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onStatusChange={handleStudentStatusChange}
      />
    </main>
  );
}

