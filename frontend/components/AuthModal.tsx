"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Phone, User, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Check } from "lucide-react";
import Button from "./ui/Button";

import { API_BASE_URL } from "@/lib/config";

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
  const [step, setStep] = useState<"email" | "details" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Reset modal state when opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setError(null);
      setMessage(null);
      setOtp("");
      setName("");
      setPhone("");
      setAcceptedPrivacy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: User enters email only
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user already exists and whether phone & consent are already on file
      const checkRes = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const checkData = await checkRes.json();

      if (checkRes.ok && checkData.requiresDetails === false) {
        // Returning user with phone & consent already on file:
        // Do NOT ask again — send OTP code directly and go straight to verification!
        const otpRes = await fetch(`${API_BASE_URL}/auth/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const otpData = await otpRes.json();
        if (!otpRes.ok) throw new Error(otpData.message || "Failed to send OTP");

        setMessage(otpData.message || "Verification code sent to your email!");
        setStep("otp");
        return;
      } else {
        // New user or missing phone/consent: advance to details step
        if (checkData?.name && !name) {
          setName(checkData.name);
        }
        if (checkData?.phone && !phone) {
          setPhone(checkData.phone);
        }
        if (checkData?.hasConsent) {
          setAcceptedPrivacy(true);
        }
        setStep("details");
      }
    } catch {
      // Fallback to details step if check endpoint fails
      setStep("details");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: User enters Name, Phone Number, and accepts Privacy Policy
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      setStep("email");
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
      const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim(),
          phone: phone.trim(),
          privacyPolicyAccepted: acceptedPrivacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setMessage(data.message || "Verification code sent to your email!");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: User verifies the 6-digit OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          code: otp,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          privacyPolicyAccepted: acceptedPrivacy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      // Save user info in localStorage
      localStorage.setItem("akam_user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("akam_token", data.token);
      }
      document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
      window.dispatchEvent(new Event("akam_user_updated"));

      setStep("success");
      if (onSuccess) onSuccess(data.user, data.token);

      setTimeout(() => {
        onClose();
        setStep("email");
        if (redirectTo) {
          router.push(redirectTo);
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-poppins animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden">
        {/* Top Navigation Row: Back Button, Badge, and Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {(step === "details" || step === "otp") && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(step === "otp" && (name || phone || acceptedPrivacy) ? "details" : "email");
                }}
                className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="bg-[#E4F953] text-[#040706] font-bold text-xs tracking-wider uppercase px-3 py-1 rounded-lg inline-block">
              AKAM Digital Pass
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
            {step === "email" && "Welcome to AKAM"}
            {step === "details" && "Complete Your Profile"}
            {step === "otp" && "Verify your Email"}
            {step === "success" && "Authenticated!"}
          </h3>
          <p className="text-sm text-[#646464] mt-1 font-normal">
            {step === "email" && "Enter your email address to sign in or get started."}
            {step === "details" && "Please provide your details & accept terms to continue."}
            {step === "otp" && `We sent a 6-digit code to ${email}`}
            {step === "success" && (redirectTo ? `Redirecting to ${redirectTo}...` : "Redirecting...")}
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

        {/* STEP 1: Email Only */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
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
              icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group py-3 text-sm font-medium shadow-xs cursor-pointer"
            >
              {loading ? "Checking..." : "Continue"}
            </Button>
          </form>
        )}

        {/* STEP 2: Name, Phone Number & Privacy Consent */}
        {step === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            {/* Email chip with quick change option */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
                className="text-xs text-black font-semibold hover:underline cursor-pointer ml-2 shrink-0"
              >
                Change
              </button>
            </div>

            {/* Full Name Input (Above Phone Number) */}
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
                  autoFocus
                />
              </div>
            </div>

            {/* Phone Number Input */}
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

            {/* Custom Themed Privacy Policy Consent Checkbox */}
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

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              iconPosition="right"
              className="group py-3 text-sm font-medium shadow-xs cursor-pointer"
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </Button>
          </form>
        )}

        {/* STEP 3: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
                className="text-xs text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
              >
                Change email address
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
