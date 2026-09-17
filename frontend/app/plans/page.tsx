"use client";

import React, { useState, useEffect } from "react";
import ReadingPlansSection from "@/components/ReadingPlansSection";
import AboutDigitalEdition from "@/components/AboutDigitalEdition";
import PayUModal from "@/components/PayUModal";
import StudentVerificationModal, { StudentApplicationData } from "@/components/StudentVerificationModal";

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [payUModalOpen, setPayUModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  // User subscription states
  const [isPassActive, setIsPassActive] = useState(false);
  const [studentStatus, setStudentStatus] = useState<"NONE" | "PENDING_APPROVAL" | "APPROVED">("NONE");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const activePass = localStorage.getItem("akam_masika_pass") === "true";
      setIsPassActive(activePass);

      const storedStudent = localStorage.getItem("akam_student_application");
      if (storedStudent) {
        try {
          const parsed = JSON.parse(storedStudent) as StudentApplicationData;
          setStudentStatus(parsed.status === "APPROVED" ? "APPROVED" : "PENDING_APPROVAL");
        } catch {
          // ignore corrupted data
        }
      }
    }
  }, []);

  const handleStudentStatusChange = (newStatus: "PENDING_APPROVAL" | "APPROVED" | "NONE") => {
    setStudentStatus(newStatus);
  };

  const masikaTotalAmount = billingCycle === "monthly" ? 149 : 1248;

  return (
    <main className="min-h-screen bg-white font-poppins text-gray-900 pb-16">
      {/* ── 3 Main Pricing Cards Grid with Student Pass & Masika Pass ─ */}
    

      {/* ── Features Comparison Table Section ────────────────────────── */}
      <ReadingPlansSection
        onSubscribe={() => setPayUModalOpen(true)}
        onStudentApply={() => setStudentModalOpen(true)}
      />

      {/* ── PayU Checkout Modal ───────────────────────────────────────── */}
      <PayUModal
        isOpen={payUModalOpen}
        onClose={() => setPayUModalOpen(false)}
        planName="Masika Pass"
        billingCycle={billingCycle}
        priceAmount={masikaTotalAmount}
        onSuccess={() => setIsPassActive(true)}
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

