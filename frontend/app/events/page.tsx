import React from "react";
import type { Metadata } from "next";
import EventsHero from "@/components/EventsHero";
import EventSessions from "@/components/EventSessions";
import PastEventArchive from "@/components/PastEventArchive";

// ISR: revalidate every 60 seconds (only for metadata / hero shell)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Literary Events & Workshops | Akam Digital",
  description:
    "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
  openGraph: {
    title: "Literary Events & Workshops | Akam Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
    images: [
      {
        url: "https://akamdigital.vercel.app/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "Akam Digital Events",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Literary Events & Workshops | Akam Digital",
    description:
      "Explore upcoming reading sessions, author discussions, creative writing masterclasses, film screenings, and past literary archives on Akam.",
    images: ["https://akamdigital.vercel.app/images/ogImage/ogImage.png"],
  },
};

export default async function EventsPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Unified Event Sessions Section - fetches live from API (no ISR cache) */}
      <EventSessions />

      {/* Past Event Archive Section - fetches live from API (no ISR cache) */}
      <PastEventArchive />
    </div>
  );
}
