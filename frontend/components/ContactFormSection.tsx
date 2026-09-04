"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface ContactFormSectionProps {
  title?: string;
}

export const ContactFormSection: React.FC<ContactFormSectionProps> = ({
  title = "Reach Out To The Akam Team",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim()) {
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/contact-inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        setTimeout(() => {
          setSubmitted(false);
        }, 4000);
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.message || "Failed to submit message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong sending your message.");
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = formData.message.trim()
    ? formData.message.trim().split(/\s+/).length
    : 0;

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium text-dark-text tracking-tight text-center mb-10 sm:mb-14 font-poppins">
          {title}
        </h2>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto space-y-6 sm:space-y-7"
        >
          {/* Row 1: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="text-xs sm:text-sm text-gray-600 font-medium mb-2 block font-poppins">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-xs sm:text-sm text-gray-600 font-medium mb-2 block font-poppins">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email ID"
                className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Phone & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="text-xs sm:text-sm text-gray-600 font-medium mb-2 block font-poppins">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your contact number"
                className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="subject" className="text-xs sm:text-sm text-gray-600 font-medium mb-2 block font-poppins">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white appearance-none focus:outline-none focus:border-gray-400 transition-colors cursor-pointer pr-10"
                >
                  <option value="" disabled>
                    Select Inquiry Type
                  </option>
                  <option value="editorial">Editorial & Submissions</option>
                  <option value="events">Events & Workshops</option>
                  <option value="media">Media & Press</option>
                  <option value="general">General Inquiry</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="text-xs sm:text-sm text-gray-600 font-medium block font-poppins">
                Message
              </label>
              <span className="text-xs text-gray-400 font-normal">
                {wordCount}/250 words
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              placeholder=""
              className="w-full px-4 py-3.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors min-h-[140px] resize-y"
            />
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted && (
            <div className="p-4.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-medium shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Thank you! Your message has been sent to the AKAM Editorial Team.</span>
            </div>
          )}

          {/* Row 4: Submit Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting || submitted}
              className="px-10 py-3 text-sm font-medium shadow-xs cursor-pointer"
            >
              {submitting ? "Sending..." : submitted ? "Message Sent!" : "Send Message"}
            </Button>
          </div>

        </form>

      </div>
    </section>
  );
};

export default ContactFormSection;
