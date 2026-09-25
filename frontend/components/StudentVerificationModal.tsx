"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  UploadCloud,
  Camera,
  Trash2,
  Calendar,
} from "lucide-react";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";

export interface StudentApplicationData {
  fullName: string;
  institution: string;
  email: string;
  idCardUrl?: string;
  idCardName?: string;
  referenceId: string;
  submittedAt: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  endDate?: string;
}

export interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NONE") => void;
}

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const router = useRouter();
  const [existingApplication, setExistingApplication] = useState<StudentApplicationData | null>(null);

  // Form State: student name, university, email, id card photo
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [idCardName, setIdCardName] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Flag when user explicitly clicks "Re-apply"
  const [isReapplying, setIsReapplying] = useState(false);

  // Load existing application from localStorage and sync live status with backend
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      setIsReapplying(false);
      return;
    }

    if (isReapplying) return;

    let userEmail: string | null = null;
    let userName: string | null = null;
    try {
      const userStr = localStorage.getItem("akam_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.email) userEmail = u.email;
        if (u?.name) userName = u.name;
      }
    } catch {
      // ignore
    }

    if (!email && userEmail) setEmail(userEmail);
    if (!fullName && userName) setFullName(userName);

    let currentApp: StudentApplicationData | null = null;
    const stored = localStorage.getItem("akam_student_application");
    if (stored) {
      try {
        currentApp = JSON.parse(stored) as StudentApplicationData;
        setExistingApplication(currentApp);
        if (onStatusChange) {
          onStatusChange(currentApp.status);
        }
      } catch {
        // ignore
      }
    }

    const identifier = currentApp?.referenceId || currentApp?.email || userEmail;
    if (identifier) {
      apiFetch(`${API_BASE_URL}/student-verifications/status/${encodeURIComponent(identifier)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isReapplying) return;
          if (data && data.status && data.status !== "NONE") {
            const synced: StudentApplicationData = {
              ...(currentApp || {}),
              ...data,
              status: data.status,
              referenceId: data.referenceId || data.id,
              fullName: data.fullName || currentApp?.fullName || "",
              institution: data.institution || currentApp?.institution || "",
              email: data.email || currentApp?.email || "",
              idCardUrl: data.idCardUrl || currentApp?.idCardUrl || "",
              idCardName: data.idCardName || currentApp?.idCardName || "",
              submittedAt: data.submittedAt || currentApp?.submittedAt || new Date().toISOString(),
              reviewNotes: data.reviewNotes || currentApp?.reviewNotes,
              reviewedAt: data.reviewedAt || currentApp?.reviewedAt,
              reviewedBy: data.reviewedBy || currentApp?.reviewedBy,
              endDate: data.endDate || currentApp?.endDate,
            };
            setExistingApplication(synced);
            localStorage.setItem("akam_student_application", JSON.stringify(synced));
            if (data.status === "APPROVED") {
              localStorage.setItem("akam_masika_pass", "true");
              localStorage.setItem("akam_pass_type", "Student Special Pass (100% Free)");
              if (data.endDate) {
                localStorage.setItem("akam_subscription_end_date", data.endDate);
              }
            } else if (data.status === "REJECTED") {
              localStorage.removeItem("akam_masika_pass");
              localStorage.removeItem("akam_pass_type");
              localStorage.removeItem("akam_subscription_end_date");
            }
            if (onStatusChange) {
              onStatusChange(data.status);
            }
          } else if (data && data.status === "NONE") {
            setExistingApplication(null);
            localStorage.removeItem("akam_student_application");
            if (localStorage.getItem("akam_pass_type")?.includes("Student")) {
              localStorage.removeItem("akam_masika_pass");
              localStorage.removeItem("akam_pass_type");
            }
            if (onStatusChange) {
              onStatusChange("NONE");
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }
    setErrorMessage("");
    setIdCardFile(file);
    setIdCardName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIdCardPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartReapply = () => {
    setIsReapplying(true);
    if (existingApplication) {
      if (existingApplication.fullName) setFullName(existingApplication.fullName);
      if (existingApplication.institution) setInstitution(existingApplication.institution);
      if (existingApplication.email) setEmail(existingApplication.email);
    }
    setIdCardFile(null);
    setIdCardPreview("");
    setIdCardName("");
    setErrorMessage("");
    setExistingApplication(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!institution.trim()) {
      setErrorMessage("Please enter your college or university.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!idCardFile && !idCardPreview) {
      setErrorMessage("Please upload your student ID card photo or document.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    let uploadedUrl = idCardPreview;

    // Upload ID card file to backend uploads/image endpoint
    if (idCardFile) {
      try {
        const formData = new FormData();
        formData.append("file", idCardFile);

        const uploadRes = await fetch(`${API_BASE_URL}/uploads/image`, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const json = await uploadRes.json();
          if (json?.url) {
            uploadedUrl = json.url.startsWith("http")
              ? json.url
              : `${API_BASE_URL.replace(/\/api$/, "")}${json.url.startsWith("/") ? "" : "/"}${json.url}`;
          }
        }
      } catch (err) {
        console.warn("Backend upload failed, utilizing preview reference:", err);
      }
    }

    const refId = `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const applicationRecord: StudentApplicationData = {
      fullName: fullName.trim(),
      institution: institution.trim(),
      email: email.trim(),
      idCardUrl: uploadedUrl,
      idCardName: idCardName || "Student_ID_Card.jpg",
      referenceId: refId,
      submittedAt: new Date().toISOString(),
      status: "PENDING_APPROVAL",
    };

    // Sync to backend database
    try {
      const res = await apiFetch(`${API_BASE_URL}/student-verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationRecord),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn("Backend student verification sync status:", res.status, errJson);
      }
    } catch (apiErr) {
      console.warn("Could not sync student application to backend, stored locally:", apiErr);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("akam_student_application", JSON.stringify(applicationRecord));
      window.dispatchEvent(new Event("akam_subscription_refresh"));
    }

    setIsReapplying(false);
    setExistingApplication(applicationRecord);
    setIsSubmitting(false);

    if (onStatusChange) {
      onStatusChange("PENDING_APPROVAL");
    }

    // Redirect to profile page after a short delay so the user can see the success state
    setTimeout(() => {
      onClose();
      router.push("/profile");
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl font-poppins overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002842] via-[#083a5c] to-[#0FA975] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl text-[#39D39E]">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Student Pass Application
                </span>
                {existingApplication?.status === "REJECTED" ? (
                  <span className="bg-rose-500/25 text-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-400/50 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-300" />
                    REVOKED / REJECTED
                  </span>
                ) : existingApplication?.status === "APPROVED" ? (
                  <span className="bg-emerald-400/25 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    ACTIVE SCHOLAR
                  </span>
                ) : existingApplication?.status === "PENDING_APPROVAL" ? (
                  <span className="bg-amber-400/25 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    UNDER REVIEW
                  </span>
                ) : (
                  <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                    100% FREE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-200">Akam Editorial Board Scholar Access Initiative</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* ── CASE 1: APPLICATION ALREADY SUBMITTED ── */}
          {existingApplication && !isReapplying ? (
            <div className="space-y-5">
              {existingApplication.status === "PENDING_APPROVAL" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-amber-900">
                        Application Under Editorial Review
                      </h4>
                      <span className="bg-amber-200/70 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your application and student ID card have been submitted to the Akam Editorial Board. Our team verifies enrolled students within <strong>24 to 48 hours</strong>. You will receive email confirmation once approved.
                    </p>
                  </div>
                </div>
              ) : existingApplication.status === "APPROVED" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-emerald-950 flex flex-col sm:flex-row items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-emerald-900">
                        Student Pass Verified & Approved!
                      </h4>
                      <span className="bg-emerald-200/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active Scholar
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      The Editorial Board has verified your student credentials. You now have complimentary all-access to every monthly Masika edition and archive downloads.
                    </p>
                    {existingApplication.endDate && (
                      <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-950">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Pass Valid Until:</span>
                        <span className="font-bold underline decoration-emerald-500">
                          {new Date(existingApplication.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : existingApplication.status === "REJECTED" ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-950 flex flex-col sm:flex-row items-start gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-rose-950">
                        Application Revoked / Rejected
                      </h4>
                      <span className="bg-rose-200 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Action Required
                      </span>
                    </div>
                    {existingApplication.reviewNotes && (
                      <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium leading-relaxed">
                        <strong className="block text-rose-950 font-bold mb-0.5">Editorial Board Feedback:</strong>
                        {existingApplication.reviewNotes}
                      </div>
                    )}
                    {existingApplication.reviewedAt && (
                      <p className="text-[11px] text-rose-700 font-medium">
                        Reviewed on {new Date(existingApplication.reviewedAt).toLocaleDateString()}
                        {existingApplication.reviewedBy ? ` by ${existingApplication.reviewedBy}` : ""}
                      </p>
                    )}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleStartReapply}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-apply with Updated Student ID
                      </button>
                      <a
                        href="mailto:editorial@akamdigital.com"
                        className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Contact Editorial Desk
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Submitted Details Review Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-500">Application Ref:</span>
                  <span className="font-mono font-bold text-gray-900">{existingApplication.referenceId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Student Name:</span>
                  <span className="font-medium text-gray-900">{existingApplication.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">University / College:</span>
                  <span className="font-medium text-gray-900">{existingApplication.institution}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{existingApplication.email}</span>
                </div>
                {existingApplication.endDate && (
                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Pass Valid Until:
                    </span>
                    <span className="font-bold text-gray-950">
                      {new Date(existingApplication.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {existingApplication.idCardUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="block text-gray-500 mb-1.5 font-medium">Uploaded Student ID Card:</span>
                    <div className="relative rounded-xl overflow-hidden border border-gray-300 max-h-48 bg-slate-900/5 flex items-center justify-center">
                      <img
                        src={formatAssetUrl(existingApplication.idCardUrl)}
                        alt="Uploaded Student ID"
                        className="object-contain max-h-48 w-full rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── CASE 2: NEW APPLICATION FORM ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isReapplying ? (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 text-amber-950 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-xs text-amber-950 block">
                        Re-applying with Updated Student ID
                      </strong>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        Please review your details and upload a valid student ID card. Your application will be sent to the editorial desk for approval.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReapplying(false);
                      const stored = localStorage.getItem("akam_student_application");
                      if (stored) {
                        try {
                          setExistingApplication(JSON.parse(stored));
                        } catch {}
                      }
                    }}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Editorial Notice Banner */
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#0FA975] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-semibold text-emerald-900 block mb-0.5">
                      Editorial Board Verification
                    </strong>
                    To support bona fide students of literature, humanities, and arts, Akam offers a 100% free digital
                    subscription pass. Please provide your student details and ID card photo below.
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Inputs: Student Name, University, Email */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Anjali Nair"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    University / College <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University of Kerala / Calicut University"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Editorial approval status will be dispatched to this email address.
                  </span>
                </div>
              </div>

              {/* ID Card Upload Section */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Upload Student ID Card <span className="text-red-500">*</span>
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {!idCardPreview ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0FA975] to-[#0d8a5f] hover:from-[#0da06e] hover:to-[#0c7d55] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo (Camera)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <UploadCloud className="w-4 h-4 text-gray-600" />
                        <span>Upload from Gallery</span>
                      </button>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                        isDragOver
                          ? "border-[#0FA975] bg-emerald-50/50"
                          : "border-gray-200 hover:border-[#0FA975] hover:bg-gray-50"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-gray-400" />
                      <span className="text-[11px] text-gray-500">
                        Or drag & drop student ID card photo here (JPG, PNG, WebP up to 10MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 border border-gray-200 shrink-0">
                        <img src={idCardPreview} alt="ID preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-gray-900 truncate block">
                          {idCardName || "Student_ID.jpg"}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                          ID Card ready for verification
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-white transition cursor-pointer font-medium"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdCardFile(null);
                          setIdCardPreview("");
                          setIdCardName("");
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Remove ID Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#0FA975] hover:bg-[#0d8f63] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Editorial Board...</span>
                    </>
                  ) : (
                    <span>Submit Application for Editorial Approval</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentVerificationModal;
