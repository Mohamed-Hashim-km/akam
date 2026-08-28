"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

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

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 4000);
  };

  const wordCount = formData.message.trim()
    ? formData.message.trim().split(/\s+/).length
    : 0;

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold text-gray-950 tracking-tight text-center mb-10 sm:mb-14 font-poppins">
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

          {/* Row 4: Submit Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              className="bg-[#8A8F8D] hover:bg-gray-800 text-white font-medium px-8 py-3 rounded-full text-sm transition-all shadow-xs cursor-pointer"
            >
              {submitted ? "Message Sent!" : "Send Message"}
            </button>
          </div>

        </form>

      </div>
    </section>
  );
};

export default ContactFormSection;
