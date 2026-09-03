"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Calendar, MapPin, Clock, Ticket } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface EventRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    location: string;
    time?: string;
    day?: string;
    monthYear?: string;
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

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

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
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Your registration for "${event.title}" has been confirmed!`);
        setTimeout(() => {
          setSuccessMsg(null);
          setName("");
          setEmail("");
          setPhone("");
          setNotes("");
          onClose();
        }, 2500);
      } else {
        const json = await res.json();
        alert(json.message || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-poppins">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-[#E4F953] text-[#040706] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              <Ticket className="w-3 h-3 text-[#040706]" />
              Event Registration
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight leading-snug pt-1">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Meta Brief */}
        <div className="bg-gray-50/80 rounded-2xl p-4 mb-6 border border-gray-200/70 text-xs text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Location</span>
              <span className="font-semibold text-gray-900 truncate block">{event.location}</span>
            </div>
          </div>

          {(event.day || event.time) && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                {event.time ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Schedule</span>
                <span className="font-semibold text-gray-900 truncate block">
                  {event.day && event.monthYear ? `${event.day} ${event.monthYear}` : ""}
                  {event.time ? (event.day ? ` @ ${event.time}` : event.time) : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successMsg ? (
          <div className="py-8 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-6 text-center flex flex-col items-center animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-3" />
            <h4 className="text-lg font-bold text-emerald-950 mb-1">Registration Confirmed!</h4>
            <p className="text-xs text-emerald-800 max-w-sm leading-relaxed font-medium">{successMsg}</p>
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
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                Questions or Notes for Speakers (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topic or question you'd like addressed during the session?"
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting || !name.trim() || !email.trim()}
                className="px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? "Confirming..." : "Confirm Registration"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
