import MediaSection from "@/components/MediaSection";
import FeaturedVideo from "@/components/FeaturedVideo";

export const metadata = {
  title: "Akam Media — Interviews, Conversations & Cultural Programmes",
  description:
    "Explore Malayalam literature, art, and heritage through candid dialogues, oral histories, and cultural discourse with regional thinkers.",
};

export default function MediaPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Media Section */}
      <MediaSection />


    </div>
  );
}
