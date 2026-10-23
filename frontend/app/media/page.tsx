import MediaSection from "@/components/MediaSection";
import FeaturedVideo from "@/components/FeaturedVideo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akam Media — Interviews, Discussions, Debates & Cultural Programmes",
  description:
    "Explore Malayalam literature, art, and heritage through candid dialogues, oral histories, and cultural discourse with regional thinkers.",
  alternates: {
    canonical: "https://akamdigital.in/media",
  },
  openGraph: {
    title: "Akam Media — Interviews, Discussions, Debates & Cultural Programmes",
    description:
      "Explore Malayalam literature, art, and heritage through candid dialogues, oral histories, and cultural discourse with regional thinkers.",
    url: "https://akamdigital.in/media",
    type: "website",
  },
};

export default function MediaPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Media Section */}
      <MediaSection />


    </div>
  );
}
