"use client";

import React, { useState } from "react";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export interface SessionItem {
  id: string;
  category: "reading" | "discussions";
  title: string;
  description: string;
  location: string;
  time: string;
  day: string;
  monthYear: string;
  registerHref?: string;
}

export interface EventSessionsProps {
  sessions?: SessionItem[];
}

const defaultSessions: SessionItem[] = [
  {
    id: "1",
    category: "reading",
    title: "Voices of Classic Malayalam Short Stories",
    description:
      "A curated session featuring vocal renditions of iconic Malayalam short stories alongside critical literary insights.",
    location: "Trivandrum Public Library & Online Stream",
    time: "04:00 PM",
    day: "23",
    monthYear: "Aug 2026",
  },
  {
    id: "2",
    category: "reading",
    title: "Voices of Classic Malayalam Short Stories",
    description:
      "A curated session featuring vocal renditions of iconic Malayalam short stories alongside critical literary insights.",
    location: "Trivandrum Public Library & Online Stream",
    time: "04:00 PM",
    day: "29",
    monthYear: "Aug 2026",
  },
  {
    id: "3",
    category: "discussions",
    title: "Contemporary Fiction & Narrative Shifts",
    description:
      "A round-table discussion with modern novelists discussing regional aesthetics and global translations.",
    location: "Kochi Cultural Center & Live Stream",
    time: "05:30 PM",
    day: "04",
    monthYear: "Sep 2026",
  },
  {
    id: "4",
    category: "discussions",
    title: "Poetry Recitals & Critical Dialogue",
    description:
      "An evening of poetry readings accompanied by critical commentaries from leading Malayalam literary scholars.",
    location: "Calicut Town Hall & Live Stream",
    time: "06:00 PM",
    day: "12",
    monthYear: "Sep 2026",
  },
];

export const EventSessions: React.FC<EventSessionsProps> = ({
  sessions = defaultSessions,
}) => {
  const [activeTab, setActiveTab] = useState<"reading" | "discussions">("reading");

  const filteredSessions = sessions.filter((s) => s.category === activeTab);

  return (
    <section className="relative w-full bg-[#41A87A17] py-16 sm:py-20 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Category Pill Switcher */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="bg-white p-1.5 rounded-full border border-gray-100 inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab("reading")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "reading"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Reading Events
            </button>
            <button
              onClick={() => setActiveTab("discussions")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "discussions"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Discussions
            </button>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {filteredSessions.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between border border-gray-100 transition-all"
            >
              <div>
                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-medium text-dark-text tracking-tight leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#808985C4] font-normal leading-relaxed mt-3 mb-6 max-w-md">
                  {item.description}
                </p>

                {/* Meta details (Location & Time) */}
                <div className="space-y-2.5 text-xs sm:text-sm text-[#808985C4] font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#808985C4] shrink-0" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#808985C4] shrink-0" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Divider & Registration Row */}
              <div>
                <div className="border-b border-gray-100 my-6 w-full" />

                <div className="flex items-center justify-between">
                  {/* Date */}
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-4xl font-semibold text-dark-text tracking-tight leading-none">
                      {item.day}
                    </span>
                    <span className="text-xs text-[#808985C4] font-normal mt-1">
                      {item.monthYear}
                    </span>
                  </div>

                  {/* Register Button */}
                  <a
                    href={item.registerHref || "#register"}
                    className="border border-gray-300 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-1.5 transition-all group"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-900 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default EventSessions;
