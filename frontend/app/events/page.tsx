import EventsHero from "@/components/EventsHero";
import EventSessions from "@/components/EventSessions";
import WorkshopsSection from "@/components/WorkshopsSection";
import PastEventArchive from "@/components/PastEventArchive";
import UpcomingEvents from "@/components/UpcomingEvents";

export const metadata = {
  title: "Akam Events — Live & Virtual Malayalam Literary Gatherings",
  description:
    "Akam Events is a dynamic cultural platform hosting literary discussions, interactive author readings, creative workshops, and panel discussions.",
};

export default function EventsPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Events Hero Section */}
      <EventsHero />

      {/* Event Sessions Section with #41A87A17 background */}
      <EventSessions />

      {/* Workshops Section */}
      <WorkshopsSection />

      {/* Past Event Archive Section */}
      <PastEventArchive />

    
    </div>
  );
}
