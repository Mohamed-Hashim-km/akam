import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LatestStories from "@/components/LatestStories";
import UpcomingEvents from "@/components/UpcomingEvents";
import UpcomingBookReleases from "@/components/UpcomingBookReleases";
import FeaturedVideo from "@/components/FeaturedVideo";
import ExploreByInterest from "@/components/ExploreByInterest";
import ReaderReviews from "@/components/ReaderReviews";
import EditorsNote from "@/components/EditorsNote";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Hero Section */}
      <HeroSection />

      {/* Latest Stories Section */}
      <LatestStories />

      {/* Upcoming Events Section */}
      <UpcomingEvents />

      {/* Upcoming Book Releases Section */}
      <UpcomingBookReleases />

      {/* Featured Video Section */}
      <FeaturedVideo />

      {/* Explore By Interest Section */}
      <ExploreByInterest />

      {/* Reader Reviews Section */}
      <ReaderReviews />

      {/* Editor's Note Section */}
      <EditorsNote />

      {/* Footer Section */}
      <Footer />
    </main>
  );
}









