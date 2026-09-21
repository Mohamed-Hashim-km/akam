"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  ShieldCheck,
  Camera,
  FlipHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface StudentApplicationData {
  fullName: string;
  institution: string;
  studentIdNumber: string;
  course: string;
  email: string;
  idCardUrl: string;
  idCardName: string;
  referenceId: string;
  submittedAt: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
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
  const [existingApplication, setExistingApplication] = useState<StudentApplicationData | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [idCardName, setIdCardName] = useState<string>("");
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Viewfinder State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Flag when user explicitly clicks "Re-apply with Updated Student ID"
  const [isReapplying, setIsReapplying] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Load existing application from localStorage and sync live status with backend
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      setIsReapplying(false);
      return;
    }

    if (isReapplying) return;

    let userEmail: string | null = null;
    try {
      const userStr = localStorage.getItem("akam_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.email) userEmail = u.email;
      }
    } catch {
      // ignore
    }

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
              studentIdNumber: data.studentIdNumber || currentApp?.studentIdNumber || "",
              course: data.course || currentApp?.course || "",
              email: data.email || currentApp?.email || "",
              idCardUrl: data.idCardUrl || currentApp?.idCardUrl || "",
              idCardName: data.idCardName || currentApp?.idCardName || "student_id.jpg",
              submittedAt: data.submittedAt || currentApp?.submittedAt || new Date().toISOString(),
              reviewNotes: data.reviewNotes || currentApp?.reviewNotes,
              reviewedAt: data.reviewedAt || currentApp?.reviewedAt,
              reviewedBy: data.reviewedBy || currentApp?.reviewedBy,
            };
            setExistingApplication(synced);
            localStorage.setItem("akam_student_application", JSON.stringify(synced));
            if (data.status === "APPROVED") {
              localStorage.setItem("akam_masika_pass", "true");
              localStorage.setItem("akam_pass_type", "Student Special Pass (100% Free)");
            } else if (data.status === "REJECTED") {
              localStorage.removeItem("akam_masika_pass");
              localStorage.removeItem("akam_pass_type");
            }
            if (onStatusChange) {
              onStatusChange(data.status);
            }
          } else if (data && data.status === "NONE") {
            // Application was cleared or deleted from the editorial backend
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

  const handleStartReapply = () => {
    setIsReapplying(true);
    if (existingApplication) {
      if (existingApplication.fullName) setFullName(existingApplication.fullName);
      if (existingApplication.institution) setInstitution(existingApplication.institution);
      if (existingApplication.studentIdNumber && existingApplication.studentIdNumber !== "EDITORIAL_GRANT" && existingApplication.studentIdNumber !== "EDITORIAL_PASS") {
        setStudentIdNumber(existingApplication.studentIdNumber);
      }
      if (existingApplication.course && existingApplication.course !== "Academic Scholar") {
        setCourse(existingApplication.course);
      }
      if (existingApplication.email) setEmail(existingApplication.email);
    }
    setIdCardFile(null);
    setIdCardPreview("");
    setIdCardName("");
    setErrorMessage("");
    setExistingApplication(null);
  };

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;

    // Check size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    setErrorMessage("");
    setIdCardFile(file);
    setIdCardName(file.name);

    // Generate local preview URL
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

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setCameraLoading(false);
  };

  const openLiveCamera = async (facing: "environment" | "user" = "environment") => {
    setCameraLoading(true);
    setIsLiveCameraOpen(true);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCameraFacing(facing);
      setCameraLoading(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Could not start in-browser live camera stream, switching to direct mobile camera:", err);
      setCameraLoading(false);
      setIsLiveCameraOpen(false);
      // Fallback seamlessly to native camera capture
      cameraInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    openLiveCamera(nextFacing);
  };

  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `Student_ID_Camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          handleFileChange(file);
          stopLiveCamera();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !institution.trim() || !studentIdNumber.trim() || !course.trim() || !email.trim()) {
      setErrorMessage("Please complete all required student details.");
      return;
    }

    if (!idCardFile && !idCardPreview) {
      setErrorMessage("Please upload a photo or document of your valid student ID card.");
      return;
    }

    if (!acceptedDeclaration) {
      setErrorMessage("Please verify and accept the student declaration.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    let uploadedUrl = idCardPreview;

    // Attempt backend upload if file exists
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
        console.warn("Backend upload failed, utilizing local secure preview reference:", err);
      }
    }

    const refId = `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const applicationRecord: StudentApplicationData = {
      fullName,
      institution,
      studentIdNumber,
      course,
      email,
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
  };

  const handleSimulateApproval = () => {
    if (!existingApplication) return;
    const updated: StudentApplicationData = {
      ...existingApplication,
      status: "APPROVED",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("akam_student_application", JSON.stringify(updated));
      localStorage.setItem("akam_masika_pass", "true");
      localStorage.setItem("akam_pass_type", "Student Special Pass (100% Free)");
    }
    setExistingApplication(updated);
    if (onStatusChange) {
      onStatusChange("APPROVED");
    }
  };

  const handleResetApplication = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("akam_student_application");
    }
    setExistingApplication(null);
    setFullName("");
    setInstitution("");
    setStudentIdNumber("");
    setCourse("");
    setEmail("");
    setIdCardFile(null);
    setIdCardPreview("");
    setIdCardName("");
    if (onStatusChange) {
      onStatusChange("NONE");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl font-poppins overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
        {/* ── Live In-App Camera Viewfinder Overlay ── */}
        {isLiveCameraOpen && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-5 text-white animate-in fade-in">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-white">
                  Hold Student ID Inside Frame
                </span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                aria-label="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Camera Viewfinder & ID Framing Box */}
            <div className="relative w-full flex-1 my-3 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
                style={{ transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* ID Card Target Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-[340px] aspect-[1.586/1] rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                  {/* 4 Corner Brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  <span className="text-[11px] font-medium text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
                    Align student ID card here
                  </span>
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-gray-300">Accessing camera sensor...</span>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full flex items-center justify-around z-20 pt-2 pb-1">
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition flex flex-col items-center cursor-pointer"
                title="Switch camera"
              >
                <FlipHorizontal className="w-5 h-5" />
                <span className="text-[9px] mt-0.5 opacity-80">Flip</span>
              </button>

              {/* Shutter capture button */}
              <button
                type="button"
                onClick={captureLiveSnapshot}
                disabled={cameraLoading}
                className="w-16 h-16 rounded-full border-4 border-white bg-[#0FA975] hover:bg-[#0da06e] active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer"
                title="Capture ID photo"
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <Camera className="w-5 h-5 text-[#0FA975]" />
                </div>
              </button>

              {/* Fallback to Native Mobile Camera */}
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  cameraInputRef.current?.click();
                }}
                className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition flex flex-col items-center cursor-pointer"
                title="Open system camera"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-[9px] mt-0.5 opacity-80">Device App</span>
              </button>
            </div>
          </div>
        )}

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
                      Your student ID card and credentials have been submitted to the Akam Editorial Board. Our team
                      verifies enrolled students within <strong>24 to 48 hours</strong>. You will receive email
                      confirmation once approved.
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
                      The Editorial Board has verified your student credentials. You now have complimentary all-access to
                      every monthly Masika edition and archive downloads.
                    </p>
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
                      <span className="bg-rose-200/80 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Revoked
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      {existingApplication.reviewNotes ||
                        "Your student scholar pass was reviewed and could not be approved or was cancelled by the Editorial Board."}
                    </p>
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
                  <span className="text-gray-500">Institution:</span>
                  <span className="font-medium text-gray-900">{existingApplication.institution}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Course & Year:</span>
                  <span className="font-medium text-gray-900">{existingApplication.course}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Student ID / Roll No:</span>
                  <span className="font-mono text-gray-900">{existingApplication.studentIdNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{existingApplication.email}</span>
                </div>

                {existingApplication.idCardUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="block text-gray-500 mb-1.5 font-medium">Uploaded Student ID Card:</span>
                    <div className="relative rounded-xl overflow-hidden border border-gray-300 max-h-48 bg-slate-900/5 flex items-center justify-center">
                      <img
                        src={existingApplication.idCardUrl}
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
                        Please review your details and upload a valid, clear student ID card. Your new submission will be sent to the editorial desk for approval.
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
                      Editorial Team Verification Required
                    </strong>
                    To support bona fide students of literature, humanities, and schools, Akam offers a 100% free digital
                    subscription. Please upload your student ID card for our editorial board’s verification.
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Full Name <span className="text-red-500">*</span>
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
                    College / University / School <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University College, Thiruvananthapuram"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Course / Degree & Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. BA Malayalam Literature, 2nd Year"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Roll No / University Reg No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentIdNumber}
                    onChange={(e) => setStudentIdNumber(e.target.value)}
                    placeholder="e.g. 2024MAL0892"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu or personal@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0FA975] focus:ring-1 focus:ring-[#0FA975]"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Editorial approval status will be dispatched to this address.
                  </span>
                </div>
              </div>

              {/* File Upload Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Upload Student ID Card Photo / Document <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    Direct Camera or Gallery
                  </span>
                </div>

                {/* Direct Native Camera Input (Mobile Camera Capture) */}
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

                {/* Standard File Picker / Gallery */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {!idCardPreview ? (
                  <div className="space-y-2.5">
                    {/* Direct Touch Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Button 1: Direct Mobile Camera Access */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0FA975] to-[#0d8a5f] hover:from-[#0da06e] hover:to-[#0c7d55] text-white text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
                      >
                        <div className="p-2 rounded-xl bg-white/20">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-xs">Take Photo (Direct Camera)</span>
                          <span className="block text-[10px] text-emerald-100 font-normal">
                            Direct camera access on mobile
                          </span>
                        </div>
                      </button>

                      {/* Button 2: Choose from Gallery / Files */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs hover:border-gray-400 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
                      >
                        <div className="p-2 rounded-xl bg-gray-100">
                          <UploadCloud className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-xs">Upload from Gallery / Files</span>
                          <span className="block text-[10px] text-gray-500 font-normal">
                            JPG, PNG, WebP up to 10MB
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Secondary in-app live viewfinder scanner button */}
                    <div className="flex items-center justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => openLiveCamera("environment")}
                        className="text-[11px] text-[#0FA975] hover:text-[#0b7a54] font-medium inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Or open in-app Live ID Card Scanner (with framing guide)</span>
                      </button>
                    </div>

                    {/* Desktop drag & drop fallback */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                        isDragOver
                          ? "border-[#0FA975] bg-emerald-50/50"
                          : "border-gray-200 hover:border-[#0FA975] hover:bg-gray-50"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-gray-400" />
                      <span className="text-[11px] text-gray-500">Or drag & drop ID card file here</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-emerald-200 bg-emerald-50/30 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-gray-200 shrink-0">
                        <img src={idCardPreview} alt="ID preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-gray-900 truncate">{idCardName}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                          Photo ready for submission
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 rounded-lg transition flex items-center gap-1 cursor-pointer font-medium"
                        title="Retake photo using camera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-white transition cursor-pointer"
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
                        title="Remove uploaded ID"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Declaration Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedDeclaration}
                    onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0FA975] rounded border-gray-300 focus:ring-[#0FA975]"
                  />
                  <span>
                    I declare that I am currently a regular enrolled student at the declared institution and the ID
                    provided is authentic and belongs to me.
                  </span>
                </label>
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
