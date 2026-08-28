import HeroSection from "@/components/HeroSection";
import LatestStories from "@/components/LatestStories";
import UpcomingEvents from "@/components/UpcomingEvents";
import UpcomingBookReleases from "@/components/UpcomingBookReleases";
import FeaturedVideo from "@/components/FeaturedVideo";
import ExploreByInterest from "@/components/ExploreByInterest";
import ReaderReviews from "@/components/ReaderReviews";
import EditorsNote from "@/components/EditorsNote";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero Section */}
      <HeroSection />

      {/* Latest Stories Section */}
      <LatestStories />
      {/* Editor's Note Section */}
      <EditorsNote />
      {/* Explore By Interest Section */}
      <ExploreByInterest />

      {/* Upcoming Events Section */}
      <UpcomingEvents />
      {/* Featured Video Section */}
      <FeaturedVideo />
      {/* Upcoming Book Releases Section */}
      <UpcomingBookReleases />

      {/* Reader Reviews Section */}
      <ReaderReviews />
    </main>
  );
}









