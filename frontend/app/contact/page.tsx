import ContactSection from "@/components/ContactSection";
import ContactFormSection from "@/components/ContactFormSection";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact AKAM — Reach Out To The Akam Team",
  description:
    "Reach out to the Akam team. Email us at akamliveconnect@gmail.com or submit your inquiry through our contact form.",
  alternates: {
    canonical: "https://akamdigital.in/contact",
  },
  openGraph: {
    title: "Contact AKAM — Reach Out To The Akam Team",
    description:
      "Reach out to the Akam team. Email us at akamliveconnect@gmail.com or submit your inquiry through our contact form.",
    url: "https://akamdigital.in/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col font-poppins bg-white">
      <ContactSection />
      <ContactFormSection />
    </div>
  );
}
