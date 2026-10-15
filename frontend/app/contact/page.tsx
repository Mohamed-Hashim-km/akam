import ContactSection from "@/components/ContactSection";
import ContactFormSection from "@/components/ContactFormSection";

export const metadata = {
  title: "Contact AKAM — Reach Out To The Akam Team",
  description: "Reach out to the Akam team. Email us at contact@akam.in or submit your inquiry through our contact form.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      <ContactSection />
      <ContactFormSection />
    </div>
  );
}
