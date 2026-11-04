"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Phone, User, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Check } from "lucide-react";
import Button from "./ui/Button";

import { API_BASE_URL, apiFetch } from "@/lib/config";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any, token: string) => void;
  redirectTo?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  redirectTo,
}) => {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset modal state when opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep("form");
      setError(null);
      setMessage(null);
      setOtp("");
      setName("");
      setPhone("");
      setAcceptedPrivacy(true);
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleAuthSuccess = (userData: any, token?: string) => {
    if (userData) {
      localStorage.setItem("akam_user", JSON.stringify(userData));
    }
    if (token) {
      localStorage.setItem("akam_token", token);
    }
    document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
    window.dispatchEvent(new Event("akam_user_updated"));

    setStep("success");
    if (onSuccess) onSuccess(userData, token || "");

    setTimeout(() => {
      onClose();
      setStep("form");
      if (redirectTo) {
        router.push(redirectTo);
      }
    }, 350);
  };

  // Auto-fill returning user's saved name/phone when a valid email is entered
  const fetchAndAutofillDetails = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) return;

    try {
      const checkRes = await apiFetch(`${API_BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, autoSendOtp: false }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData?.name) {
          setName(checkData.name);
        }
        if (checkData?.phone) {
          setPhone(checkData.phone);
        }
        if (checkData?.hasConsent) {
          setAcceptedPrivacy(true);
        }
      }
    } catch {
      // Ignore background autofill lookup errors
    }
  };

  // Real-time debounced auto-fill as the user types or pastes their email
  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) return;

    const timer = setTimeout(() => {
      fetchAndAutofillDetails(cleanEmail);
    }, 300);

    return () => clearTimeout(timer);
  }, [email]);

  const handleEmailBlur = () => {
    fetchAndAutofillDetails(email);
  };

  // Single-step Form: Submit Email, Name, Phone & Consent together
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!name || name.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (!phone || phone.trim().length < 8) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!acceptedPrivacy) {
      setError("You must accept the Privacy Policy and Terms of Service to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim(),
          phone: phone.trim(),
          privacyPolicyAccepted: acceptedPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join community");

      // For regular readers: Instant login without OTP!
      if (data?.token && data?.user) {
        handleAuthSuccess(data.user, data.token);
        return;
      }

      // Editorial users: OTP required
      setMessage(data.message || "Editorial verification code sent to your email!");
      setStep("otp");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // User verifies the 6-digit OTP code (Editorial Team Only)
  const handleVerifyOtp = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const codeToVerify = (codeOverride ?? otp).trim();
    if (!codeToVerify || codeToVerify.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          code: codeToVerify,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          privacyPolicyAccepted: acceptedPrivacy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      handleAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler for Editorial team
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await apiFetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          privacyPolicyAccepted: acceptedPrivacy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code");
      setMessage("New verification code sent to your email!");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-poppins animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden">
        {/* Top Navigation Row: Back Button, Badge, and Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step === "otp" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("form");
                }}
                className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="bg-[#E4F953] text-[#040706] font-bold text-xs tracking-wider uppercase px-3 py-1 rounded-lg inline-block">
              {step === "otp" ? "Editorial Access" : "Join Our Community"}
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header Titles */}
        <div className="mb-6">
          <h3 className="text-2xl sm:text-3xl font-semibold text-dark-text tracking-tight">
            {step === "form" && "Join AKAM Digital"}
            {step === "otp" && "Editorial Team Verification"}
            {step === "success" && "Welcome to AKAM!"}
          </h3>
          <p className="text-sm text-[#646464] mt-1 font-normal">
            {step === "form" && "Enter your details to become part of our storytelling community."}
            {step === "otp" && (message || `Enter the 6-digit verification code sent to ${email}`)}
            {step === "success" && (redirectTo ? `Redirecting to ${redirectTo}...` : "Welcome aboard!")}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {message && step === "otp" && !error && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{message}</span>
          </div>
        )}

        {/* SINGLE STEP: Email Address, Full Name & Phone Number */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="author@akamdigital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Full Name Input (under Email Address) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Number Input (under Full Name) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Privacy Policy Consent Checkbox */}
            <label
              htmlFor="privacy-checkbox"
              className="flex items-center gap-3 pt-1 cursor-pointer select-none group"
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  id="privacy-checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="sr-only peer"
                  required
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                    acceptedPrivacy
                      ? "bg-[#040706] border-[#040706] shadow-xs"
                      : "bg-white border-gray-300 group-hover:border-[#040706]"
                  }`}
                >
                  {acceptedPrivacy && (
                    <Check className="w-3.5 h-3.5 text-[#E4F953] stroke-[3]" />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 leading-snug">
                I agree to the{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  className="font-semibold text-black underline hover:text-[#21B573] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-black underline hover:text-[#21B573] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </a>.
              </span>
            </label>

            {/* Main Action Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group py-3 text-sm font-semibold shadow-xs cursor-pointer"
            >
              {loading ? "Joining..." : "Join Our Community"}
            </Button>
          </form>
        )}

        {/* STEP 3: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={(e) => handleVerifyOtp(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOtp(val);
                    if (val.length === 6 && !loading) {
                      handleVerifyOtp(undefined, val);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold tracking-widest text-gray-900 outline-none focus:border-black focus:bg-white transition-all text-center"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              className="py-3 text-sm font-medium shadow-xs cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("form");
                }}
                className="text-xs text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
              >
                Change details
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs text-gray-700 hover:text-black font-semibold disabled:text-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Authenticated Success */}
        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Authenticated!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
