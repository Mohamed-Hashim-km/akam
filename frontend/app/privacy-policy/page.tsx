import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  FileText,
  Cookie,
  Database,
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  Scale,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Privacy Policy — AKAM Digital",
  description:
    "Learn how AKAM Digital collects, uses, and safeguards your personal information, reading history, author submissions, and subscription data in compliance with India's DPDP Act.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 15, 2026";

  const privacyHighlights = [
    {
      icon: <EyeOff className="w-5 h-5 text-[#22B573]" />,
      title: "We Never Sell Your Data",
      desc: "Your reading habits, personal email, phone numbers, and author manuscripts are never sold or rented to third-party ad brokers.",
    },
    {
      icon: <Lock className="w-5 h-5 text-[#22B573]" />,
      title: "Secure OTP Authentication",
      desc: "We use passwordless, cryptographic One-Time Passwords (OTP) to prevent credential stuffing and protect your account.",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[#22B573]" />,
      title: "Complete User Control",
      desc: "You can view, update, export, or request permanent deletion of your reading profile and submitted manuscripts at any time.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#22B573]" />,
      title: "DPDP Act Compliant",
      desc: "Our privacy architecture complies with India's Digital Personal Data Protection (DPDP) Act 2023 and modern encryption benchmarks.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins text-gray-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-[#DBF4FF] py-16 sm:py-24 lg:py-28 font-poppins flex items-center justify-center">
        <div className="container px-4 mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-sky-200 text-sky-800 text-xs sm:text-sm font-medium mb-6 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#22B573]" />
            <span>Privacy &amp; Data Protection &middot; Effective {lastUpdated}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#040706] text-center mb-6 leading-[1.2] tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-base sm:text-lg text-gray-700 font-normal leading-relaxed text-center max-w-2xl mx-auto">
            At AKAM Digital, we respect your privacy as deeply as we respect the written word. This policy describes how we collect, protect, and handle your data across our digital reading and publishing ecosystem.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-16 lg:py-24">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-5xl">
          
          {/* Privacy Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
            {privacyHighlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#F8FAF9] border border-gray-200/80 rounded-2xl p-6 flex items-start gap-4 hover:border-[#22B573]/50 transition-all shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#040706] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-12 text-gray-700 leading-relaxed text-sm sm:text-base">
            
            {/* Section 1 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  1
                </span>
                Overview &amp; Scope
              </h2>
              <p className="mb-4">
                This Privacy Policy applies to all digital services offered by <strong>AKAM Digital</strong> (&ldquo;AKAM&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), including our website (<a href="https://akam.in" className="text-[#22B573] underline">akam.in</a>), authoring studio, reader accounts, serialized story channels, and the Masika digital publication edition.
              </p>
              <p>
                By accessing our platform, registering an account, or submitting literary works, you consent to the data collection and processing practices described herein.
              </p>
            </section>

            {/* Section 2 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  2
                </span>
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-dark-text mb-1.5">A. Information You Provide Directly:</h4>
                  <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                    <li><strong>Account Credentials:</strong> Full name, email address, and verified phone number during passwordless OTP login.</li>
                    <li><strong>Author Profile Data:</strong> Pen name, biographical note, profile avatar photo, and social links.</li>
                    <li><strong>Literary Submissions:</strong> Manuscript text, story titles, category classification, chapter installments, and embedded cover art.</li>
                    <li><strong>Reader Engagement:</strong> Reader reviews, star ratings, bookmarks, reading lists, and public comments.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-dark-text mb-1.5">B. Information Collected Automatically:</h4>
                  <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                    <li><strong>Device &amp; Usage Telemetry:</strong> Browser type, operating system version, page view timestamps, and story reading progress (to remember your bookmark location).</li>
                    <li><strong>IP Address &amp; Session Tokens:</strong> Anonymized network identifiers used solely for security audits, rate-limiting, and fraud prevention.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  3
                </span>
                How We Use Your Information
              </h2>
              <p className="mb-3">
                We process your information strictly for legitimate literary, editorial, and platform operations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>To authenticate your identity securely via SMS and email OTP.</li>
                <li>To format, index, and distribute your approved manuscripts across the AKAM digital library.</li>
                <li>To facilitate editorial communication regarding submission status, copyediting queries, or publication approvals.</li>
                <li>To process and manage reader subscriptions, renewals, and digital access passes.</li>
                <li>To personalize your reading experience, including chapter bookmarks and curated story recommendations.</li>
                <li>To protect against plagiarism, unlawful scraping, malicious bot activity, and terms violations.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  4
                </span>
                Cookies &amp; Local Storage
              </h2>
              <p className="mb-4">
                AKAM Digital uses minimal, essential cookies and browser LocalStorage items to ensure seamless reading and secure sessions:
              </p>
              <div className="bg-[#F8FAF9] border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Cookie className="w-4 h-4 text-[#22B573] shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-dark-text text-sm">Authentication Session (akam_user / akam_logged_in):</span>
                    <p className="text-xs text-gray-600 mt-0.5">Retains your encrypted session token so you stay logged in while switching between chapters.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Cookie className="w-4 h-4 text-[#22B573] shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-dark-text text-sm">Reading Preferences:</span>
                    <p className="text-xs text-gray-600 mt-0.5">Saves your preferred reading layout, font size, and flipbook view settings locally on your device.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  5
                </span>
                Data Sharing &amp; Third-Party Services
              </h2>
              <p className="mb-4">
                <strong>We do not sell, rent, or trade your personal data.</strong> We only share information with trusted third-party service providers bound by strict confidentiality and security agreements:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li><strong>Payment Processors:</strong> Authorized, PCI-DSS compliant Indian payment gateways for processing Masika Pass subscriptions. We do not store credit/debit card numbers on our servers.</li>
                <li><strong>Cloud Infrastructure:</strong> High-security cloud hosting providers with end-to-end data encryption in transit and at rest.</li>
                <li><strong>Legal Compliance:</strong> We may disclose data if required by applicable Indian law, court order, or governmental authority.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  6
                </span>
                Your Privacy Rights (DPDP Act)
              </h2>
              <p className="mb-4">
                Under the Indian Digital Personal Data Protection (DPDP) Act and recognized international standards, you hold clear rights regarding your personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F4FAF6] border border-[#22B573]/30 rounded-xl p-4">
                  <h4 className="font-semibold text-dark-text text-sm mb-1">Right to Access &amp; Summary</h4>
                  <p className="text-xs text-gray-600">Request a summary of your personal data processed by AKAM.</p>
                </div>
                <div className="bg-[#F4FAF6] border border-[#22B573]/30 rounded-xl p-4">
                  <h4 className="font-semibold text-dark-text text-sm mb-1">Right to Correction &amp; Update</h4>
                  <p className="text-xs text-gray-600">Update inaccurate or incomplete profile and author details at any time.</p>
                </div>
                <div className="bg-[#F4FAF6] border border-[#22B573]/30 rounded-xl p-4">
                  <h4 className="font-semibold text-dark-text text-sm mb-1">Right to Data Erasure</h4>
                  <p className="text-xs text-gray-600">Request complete deletion of your user account and personal identifiers.</p>
                </div>
                <div className="bg-[#F4FAF6] border border-[#22B573]/30 rounded-xl p-4">
                  <h4 className="font-semibold text-dark-text text-sm mb-1">Right to Grievance Redressal</h4>
                  <p className="text-xs text-gray-600">Escalate any privacy concern directly to our Grievance Officer.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  7
                </span>
                Data Security &amp; Retention
              </h2>
              <p className="mb-4">
                We implement industry-standard administrative, physical, and technical safeguards, including HTTPS (TLS 1.3 encryption), parameterized database queries, and restricted access controls to prevent unauthorized access, alteration, or disclosure.
              </p>
              <p className="text-gray-600">
                We retain personal data only for as long as your account remains active or as required to fulfill our legal, taxation, or editorial archiving obligations.
              </p>
            </section>

            {/* Section 8 */}
            <section className="pb-4">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  8
                </span>
                Grievance Officer &amp; Privacy Contact
              </h2>
              <p className="mb-6">
                To exercise any of your data rights or if you have questions regarding this Privacy Policy, please contact our designated Grievance Officer:
              </p>

              <div className="bg-[#F8FAF9] border border-gray-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#22B573] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Privacy Desk</div>
                    <a href="mailto:contact@akam.in" className="text-sm font-medium text-dark-text hover:text-[#22B573]">
                      contact@akam.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#22B573] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Phone</div>
                    <a href="tel:+918129811311" className="text-sm font-medium text-dark-text hover:text-[#22B573]">
                      +91 81298 11311
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#22B573] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Headquarters</div>
                    <div className="text-sm font-medium text-dark-text">
                      Kairali Books Building, Kannur, Kerala
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Call to Action Card */}
          <div className="mt-16 bg-[#22B573] text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <h3 className="text-2xl font-semibold mb-2">
                Questions about our Terms of Service?
              </h3>
              <p className="text-sm text-white/90">
                Review the conditions governing reader subscriptions, author publishing rights, and community standards.
              </p>
            </div>
            <Link href="/terms" className="shrink-0">
              <Button variant="secondary" size="md" className="bg-white text-dark-bg hover:bg-slate-100 font-semibold shadow-xs">
                Terms of Service
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
