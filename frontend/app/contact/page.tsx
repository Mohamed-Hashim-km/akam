import ContactSection from "@/components/ContactSection";
import ContactFormSection from "@/components/ContactFormSection";

export const metadata = {
  title: "Contact AKAM — Reach Out To The Akam Team",
  description:
    "Reach out to the Akam team. Email us at contact@akam.in or visit us at Kairali Books Building, Kannur, Kerala. Call us at +91 9383748193.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col font-poppins bg-white min-h-screen">
      <ContactSection />
      <ContactFormSection />
    </div>
  );
}
