import MasikaHero from "@/components/MasikaHero";
import FeaturedArtist from "@/components/FeaturedArtist";
import PreviousEditions from "@/components/PreviousEditions";
import AboutDigitalEdition from "@/components/AboutDigitalEdition";
import LatestStories from "@/components/LatestStories";

export const metadata = {
  title: "Akam Masika — The Official Digital Journal of AKAM",
  description:
    "The official digital journal of AKAM. Each edition gathers the editorial board's handpicked selection of contemporary Malayalam serialized fiction, poetry, and cultural essays.",
};

export default function MasikaPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Masika Hero Section */}
      <MasikaHero />

      {/* Featured Artist Section */}
      <FeaturedArtist />

      {/* Previous Editions Section */}
      <PreviousEditions />

      {/* About Digital Edition & Pricing Section */}
      <AboutDigitalEdition />

      
    </div>
  );
}
