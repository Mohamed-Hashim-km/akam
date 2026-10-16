"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Calendar, MapPin, Clock, Ticket, CreditCard, AlertCircle, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

declare global {
  interface Window {
    bolt?: {
      launch: (
        payload: Record<string, any>,
        handlers: {
          responseHandler: (response: any) => void;
          catchException: (error: any) => void;
        },
      ) => void;
    };
  }
}

interface EventRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string;
    location: string;
    time?: string;
    day?: string;
    monthYear?: string;
    isPaid?: boolean;
    price?: number;
  } | null;
}

export default function EventRegisterModal({
  isOpen,
  onClose,
  event,
}: EventRegisterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmedTxnId, setConfirmedTxnId] = useState<string | null>(null);
  const [payuError, setPayuError] = useState<string | null>(null);
  const [resolvedMeta, setResolvedMeta] = useState<{ isPaid?: boolean; price?: number } | null>(null);

  useEffect(() => {
    setResolvedMeta(null);
    if (isOpen && event?.id) {
      apiFetch(`${API_BASE_URL}/events/${event.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.isPaid !== undefined) {
            setResolvedMeta({
              isPaid: Boolean(data.isPaid),
              price: data.price !== undefined ? Number(data.price) : 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, event?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setSuccessMsg(null);
      setConfirmedTxnId(null);
      setPayuError(null);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const effectiveIsPaid = resolvedMeta?.isPaid !== undefined ? resolvedMeta.isPaid : Boolean(event.isPaid);
  const effectivePrice = resolvedMeta?.price !== undefined ? resolvedMeta.price : (Number(event.price) || 0);

  const isPaid = Boolean(effectiveIsPaid && effectivePrice > 0);
  const ticketPrice = effectivePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setPayuError(null);

    // Paid Event: PayU Checkout Flow
    if (isPaid) {
      if (!phone.trim()) {
        alert("Please provide your phone number for payment & ticket verification.");
        return;
      }

      setSubmitting(true);
      try {
        // Ensure PayU Bolt SDK is available
        if (typeof window !== "undefined") {
          await new Promise<void>((resolve, reject) => {
            const isProdPayU = process.env.NEXT_PUBLIC_PAYU_ENV === "PRODUCTION";
            const targetSrc = isProdPayU
              ? "https://jssdk.payu.in/bolt/bolt.min.js"
              : "https://jssdk-uat.payu.in/bolt/bolt.min.js";

            const existing = document.querySelector('script[src*="bolt.min.js"]') as HTMLScriptElement | null;
            if (existing && window.bolt) {
              if (existing.src.includes(isProdPayU ? "jssdk.payu.in" : "jssdk-uat.payu.in")) {
                resolve();
                return;
              }
              existing.remove();
              delete (window as any).bolt;
            }

            const script = document.createElement("script");
            script.src = targetSrc;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load PayU Checkout SDK"));
            document.head.appendChild(script);
          });
        }

        // Fetch secure signed PayU Bolt payload from backend
        const res = await apiFetch(`${API_BASE_URL}/events/${event.id}/bolt-payload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            notes: notes.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to initialize PayU payment checkout");
        }

        const boltPayload = await res.json();

        if (!window.bolt || typeof window.bolt.launch !== "function") {
          throw new Error("PayU Bolt gateway is not available");
        }

        // Launch official PayU Bolt modal popup
        window.bolt.launch(
          {
            key: boltPayload.key,
            txnid: boltPayload.txnid,
            hash: boltPayload.hash,
            amount: boltPayload.amount,
            firstname: boltPayload.firstname,
            email: boltPayload.email,
            phone: boltPayload.phone,
            productinfo: boltPayload.productinfo,
            surl: boltPayload.surl,
            furl: boltPayload.furl,
            mode: "dropout",
          },
          {
            responseHandler: async function (BOLT: any) {
              console.log("[Event PayU Bolt Response]:", BOLT);
              const response = BOLT?.response;
              if (response && response.txnStatus === "SUCCESS") {
                const finalTxn = response.txnid || boltPayload.txnid;

                try {
                  const regRes = await apiFetch(`${API_BASE_URL}/events/${event.id}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: name.trim(),
                      email: email.trim(),
                      phone: phone.trim(),
                      notes: notes.trim() || undefined,
                      txnId: finalTxn,
                      amount: ticketPrice,
                      isPaid: true,
                      paymentStatus: "COMPLETED",
                    }),
                  });

                  if (regRes.ok) {
                    window.location.href = `/events/thank-you?status=success&txnid=${encodeURIComponent(finalTxn)}&eventId=${encodeURIComponent(event.id)}`;
                    return;
                  } else {
                    const regErr = await regRes.json().catch(() => ({}));
                    setPayuError(regErr.message || "Payment succeeded but registration recording failed. Please reach out to support.");
                  }
                } catch (err: any) {
                  console.error(err);
                  setPayuError("Network error while recording registration. Please reach out to support.");
                }
              } else if (response && response.txnStatus === "CANCEL") {
                setPayuError("Payment checkout was cancelled. You can retry whenever you are ready.");
              } else {
                setPayuError(response?.error_Message || "Payment was not completed. Please try again.");
              }
              setSubmitting(false);
            },
            catchException: function (err: any) {
              console.error("[Event PayU Bolt Exception]:", err);
              setPayuError(err?.message || "PayU checkout modal was closed or encountered an error.");
              setSubmitting(false);
            },
          }
        );
      } catch (err: any) {
        console.error(err);
        setPayuError(err?.message || "Failed to launch PayU payment.");
        setSubmitting(false);
      }
      return;
    }

    // Free Event Flow
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          isPaid: false,
          paymentStatus: "FREE",
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const regTxn = json?.registration?.txnId || json?.registration?.id || "";
        window.location.href = `/events/thank-you?status=success&txnid=${encodeURIComponent(regTxn)}&eventId=${encodeURIComponent(event.id)}`;
        return;
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.message || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setSuccessMsg(null);
    setConfirmedTxnId(null);
    setPayuError(null);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) handleModalClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins"
    >
      <div className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="space-y-1">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                <CreditCard className="w-3 h-3 text-amber-700" />
                Paid Event • ₹{ticketPrice}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#E4F953] text-[#040706] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                <Ticket className="w-3 h-3 text-[#040706]" />
                Free Event Registration
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight leading-snug pt-1">
              {event.title}
            </h3>
          </div>
          <button
            onClick={handleModalClose}
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0 ml-2 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paid Admission Fee Card */}
        {isPaid && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-200/90 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                ₹
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Event Admission Pass</span>
                <span className="text-xs text-amber-950 font-bold block">Official Registration Ticket</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-950 font-poppins tracking-tight">₹{ticketPrice}</span>
              <span className="text-[10px] text-amber-700 block font-semibold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                PayU Secure
              </span>
            </div>
          </div>
        )}

        {/* Event Meta Brief */}
        <div className="bg-gray-50/80 rounded-2xl p-4 mb-5 border border-gray-200/70 text-xs text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Location */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Location</span>
              <span className="font-semibold text-gray-900 break-words block text-xs leading-snug">{event.location}</span>
            </div>
          </div>

          {/* Date */}
          {(event.day || event.monthYear) && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Date</span>
                <span className="font-semibold text-gray-900 break-words block text-xs leading-snug">
                  {event.day ? `${event.day} ` : ""}{event.monthYear || ""}
                </span>
              </div>
            </div>
          )}

          {/* Time */}
          {event.time && (
            <div className="flex items-start gap-2.5 sm:col-span-2 pt-2.5 border-t border-gray-200/60">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-sky-600 uppercase tracking-wider block font-bold">Time</span>
                <span className="font-bold text-gray-950 break-words block text-xs sm:text-sm leading-snug">
                  {event.time}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Event Description */}
        {event.description && (
          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl px-4 py-3 mb-5">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block mb-0.5">About this event</span>
            <p className="text-xs text-gray-700 leading-relaxed font-poppins">{event.description}</p>
          </div>
        )}

        {/* PayU Error Message */}
        {payuError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Payment Notice</span>
              <span className="font-medium">{payuError}</span>
            </div>
          </div>
        )}

        {/* Success Confirmation Card */}
        {successMsg ? (
          <div className="py-6 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-6 text-center flex flex-col items-center animate-in fade-in space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <div>
              <h4 className="text-lg font-bold text-emerald-950">Registration Confirmed!</h4>
              <p className="text-xs text-emerald-800 max-w-sm leading-relaxed font-medium mt-1">{successMsg}</p>
            </div>

            {confirmedTxnId && (
              <div className="w-full bg-white/90 border border-emerald-200 rounded-xl p-3 text-left space-y-1 mt-2">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Transaction Receipt</div>
                <div className="text-xs font-mono text-gray-800 font-bold break-all">ID: {confirmedTxnId}</div>
                <div className="text-[11px] text-gray-600">Amount Paid: ₹{ticketPrice} via PayU</div>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleModalClose}
              className="mt-3 px-6 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Nair"
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Phone Number {isPaid ? <span className="text-rose-500">*</span> : <span className="text-gray-400 font-normal lowercase">(optional)</span>}</span>
                {isPaid && <span className="text-[10px] text-amber-700 font-medium">Required for PayU ticket receipt</span>}
              </label>
              <input
                type="tel"
                required={isPaid}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                Questions or Notes for Speakers <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topic or question you'd like addressed during the session?"
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleModalClose}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting || !name.trim() || !email.trim() || (isPaid && !phone.trim())}
                className={`px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 ${
                  isPaid ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-600 font-bold" : ""
                }`}
              >
                {submitting ? (
                  isPaid ? "Opening PayU Checkout..." : "Confirming..."
                ) : isPaid ? (
                  `Pay ₹${ticketPrice} & Register`
                ) : (
                  "Confirm Free Registration"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
