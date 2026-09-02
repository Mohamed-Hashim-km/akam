"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Calendar, MapPin, Clock } from "lucide-react";
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
        setSuccessMsg(`You have successfully registered for "${event.title}"!`);
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
      <div className="relative w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Event Registration
            </span>
            <h3 className="text-xl font-bold text-gray-950 mt-1.5 leading-snug">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Meta Brief */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 text-xs text-gray-600 space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-800">{event.location}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{event.time}</span>
            </div>
          )}
          {event.day && event.monthYear && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{event.day} {event.monthYear}</span>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successMsg ? (
          <div className="py-8 text-center flex flex-col items-center animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h4 className="text-lg font-bold text-gray-950 mb-1">Registration Confirmed!</h4>
            <p className="text-xs text-gray-600 max-w-sm leading-relaxed">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Nair"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                Questions or Notes for Speakers (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topic or question you'd like addressed during the session?"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="border border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || !name.trim() || !email.trim()}
                className="px-6 py-2"
              >
                {submitting ? "Submitting..." : "Confirm Registration"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
