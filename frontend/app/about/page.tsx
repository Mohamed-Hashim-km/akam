import AboutHero from "@/components/AboutHero";
import EditorialVow from "@/components/EditorialVow";
import AuthorsOfAkam from "@/components/AuthorsOfAkam";
import AboutKairaliBooks from "@/components/AboutKairaliBooks";

export const metadata = {
  title: "About AKAM — Preserving Heritage, Championing Modern Voices",
  description:
    "At our core, we believe that literature is the mirror of a society's soul. Rooted in the rich linguistic tradition of Malayalam.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* About Hero Section */}
      <AboutHero />

      {/* Editorial Vow Section */}
      <EditorialVow />

      {/* Authors Of Akam Section */}
      <AuthorsOfAkam />

      {/* About Kairali Books Section */}
      <AboutKairaliBooks />
    </div>
  );
}
