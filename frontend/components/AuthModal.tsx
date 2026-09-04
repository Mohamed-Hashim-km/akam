"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setMessage(data.message || "OTP code sent to your email!");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      // Save user info in localStorage
      localStorage.setItem("akam_user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("akam_token", data.token);
      }
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-xs tracking-wider uppercase px-3 py-1 rounded-lg inline-block mb-3">
            AKAM Digital Pass
          </span>
          <h3 className="text-2xl sm:text-3xl font-semibold text-dark-text tracking-tight">
            {step === "email" && "Welcome to AKAM"}
            {step === "otp" && "Verify your Email"}
            {step === "success" && "Authenticated!"}
          </h3>
          <p className="text-sm text-[#646464] mt-1 font-normal">
            {step === "email" && "Enter your email to receive a passwordless OTP code."}
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

        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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
              {loading ? "Sending OTP..." : "Continue with Email"}
            </Button>
          </form>
        )}

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
                onClick={() => setStep("email")}
                className="text-xs text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
              >
                Change email address
              </button>
            </div>
          </form>
        )}

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
