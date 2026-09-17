import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  BookOpen,
  Scale,
  CreditCard,
  PenTool,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Terms of Service — AKAM Digital",
  description:
    "Read the Terms of Service for AKAM Digital — India's premier digital literary channel for Malayalam literature, serialized stories, Masika digital pass, and editorial publishing.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "March 15, 2026";

  const keyPoints = [
    {
      icon: <PenTool className="w-5 h-5 text-[#22B573]" />,
      title: "Authors Retain Copyright",
      desc: "Authors retain full copyright ownership of their original manuscripts, grants AKAM a non-exclusive license to publish and distribute digitally.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#22B573]" />,
      title: "Editorial Curation Vow",
      desc: "Every published piece passes rigorous review by our editorial board. We reject plagiarized, hate-promoting, or automated spam content.",
    },
    {
      icon: <CreditCard className="w-5 h-5 text-[#22B573]" />,
      title: "Transparent Subscriptions",
      desc: "Masika Pass and reader memberships are billed clearly with no hidden fees and straightforward cancellation at any time.",
    },
    {
      icon: <Scale className="w-5 h-5 text-[#22B573]" />,
      title: "Respectful Community",
      desc: "Constructive literary critique, reader reviews, and thoughtful dialogue are protected and celebrated across all reader discussion channels.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins text-gray-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-[#DBF4FF] py-16 sm:py-24 lg:py-28 font-poppins flex items-center justify-center">
        <div className="container px-4 mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-sky-200 text-sky-800 text-xs sm:text-sm font-medium mb-6 shadow-2xs">
            <Scale className="w-4 h-4 text-[#22B573]" />
            <span>Legal Agreement &middot; Last Updated {lastUpdated}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#040706] text-center mb-6 leading-[1.2] tracking-tight">
            Terms of Service
          </h1>

          <p className="text-base sm:text-lg text-gray-700 font-normal leading-relaxed text-center max-w-2xl mx-auto">
            Please read these terms carefully before accessing or using AKAM Digital. By using our platform, you agree to these legal conditions governing reading, authoring, and subscriptions.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-16 lg:py-24">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-5xl">
          
          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
            {keyPoints.map((item, idx) => (
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

          {/* Legal Clauses */}
          <div className="space-y-12 text-gray-700 leading-relaxed text-sm sm:text-base">
            
            {/* Clause 1 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  1
                </span>
                Acceptance of Terms
              </h2>
              <p className="mb-4">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Reader&rdquo;, or &ldquo;Author&rdquo;) and <strong>AKAM Digital</strong> (operated in partnership with Kairali Books, Kannur, Kerala, India).
              </p>
              <p>
                By creating an account, browsing published works, submitting manuscripts, or subscribing to our digital publications (including Masika Digital Edition), you acknowledge that you have read, understood, and agreed to be bound by these Terms and our{" "}
                <Link href="/privacy-policy" className="text-[#22B573] font-medium hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            {/* Clause 2 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  2
                </span>
                User Accounts &amp; Authentication
              </h2>
              <div className="space-y-3">
                <p>
                  To write, submit stories, leave reader reviews, or access premium serialized literature, you must register for an account using a valid email address and verified phone number (via One-Time Password / OTP authentication).
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>You must provide accurate, current, and complete registration information.</li>
                  <li>You are solely responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.</li>
                  <li>You agree to notify us immediately at <a href="mailto:contact@akam.in" className="text-[#22B573] underline">contact@akam.in</a> of any unauthorized use or security breach.</li>
                </ul>
              </div>
            </section>

            {/* Clause 3 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  3
                </span>
                Author Submissions &amp; Editorial Review
              </h2>
              <p className="mb-4">
                AKAM is curated by an editorial board upholding the highest literary standards for Malayalam stories, essays, and poetry cycles.
              </p>
              <div className="bg-[#F4FAF6] border border-[#22B573]/30 rounded-2xl p-5 mb-4">
                <h4 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22B573]" />
                  Author Copyright Retention
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <strong>You retain complete copyright ownership of your work.</strong> By submitting a manuscript to AKAM, you grant AKAM Digital a non-exclusive, worldwide, royalty-free license to host, format, publish, index, and digitally distribute your work across AKAM web and mobile platforms.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>You represent and warrant that your submission is your original work and does not infringe upon third-party copyrights or moral rights.</li>
                <li>Submissions are subject to our <Link href="/editorial-guidelines" className="text-[#22B573] underline font-medium">Editorial Guidelines</Link>. We reserve the right to accept, decline, or request editorial modifications prior to publication.</li>
                <li>You may request archiving or removal of your work at any time by contacting our editorial desk, subject to reasonable processing periods.</li>
              </ul>
            </section>

            {/* Clause 4 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  4
                </span>
                Reader Subscriptions &amp; Masika Pass
              </h2>
              <div className="space-y-3">
                <p>
                  Certain features, premium serialized installments, offline downloads, and digital issues of Masika Magazine require an active subscription or digital pass.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Billing &amp; Payments:</strong> Subscription fees are billed in Indian Rupees (INR) through authorized, RBI-compliant payment gateways. All prices include applicable taxes.</li>
                  <li><strong>Renewal:</strong> Recurring plans renew automatically unless cancelled before the renewal date through your account profile.</li>
                  <li><strong>Refund Policy:</strong> Due to the immediate digital delivery of literary works and issues, fees paid are generally non-refundable, except where required by applicable consumer law.</li>
                </ul>
              </div>
            </section>

            {/* Clause 5 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  5
                </span>
                Prohibited Conduct &amp; Community Rules
              </h2>
              <p className="mb-4">
                To preserve a welcoming and high-integrity literary community, users agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Submit plagiarized text, unauthorized translations, or AI-generated spam without author attribution.</li>
                <li>Post defamatory, abusive, racially hostile, sexually explicit, or unlawful content in story texts or review comments.</li>
                <li>Scrape, crawl, extract, or harvest literary works or user information through automated tools without written authorization.</li>
                <li>Attempt to compromise platform security, reverse engineer services, or distribute malicious scripts.</li>
              </ul>
            </section>

            {/* Clause 6 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  6
                </span>
                Disclaimers &amp; Limitation of Liability
              </h2>
              <p className="mb-4">
                AKAM Digital provides services on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied.
              </p>
              <p className="text-gray-600">
                While our editorial board strives for absolute factual and linguistic rigor, views expressed in individual stories, memoirs, and essays reflect the viewpoints of the contributing authors and not necessarily AKAM Digital or Kairali Books. To the fullest extent permitted by Indian law, AKAM Digital shall not be liable for any indirect, incidental, or consequential damages arising from platform usage.
              </p>
            </section>

            {/* Clause 7 */}
            <section className="border-b border-gray-200/80 pb-10">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  7
                </span>
                Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any legal action, dispute, or proceeding arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in Kannur, Kerala, India.
              </p>
            </section>

            {/* Clause 8 */}
            <section className="pb-4">
              <h2 className="text-2xl font-semibold text-[#040706] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#22B573]/15 text-[#22B573] text-sm font-bold flex items-center justify-center">
                  8
                </span>
                Contact &amp; Grievance Redressal
              </h2>
              <p className="mb-6">
                If you have questions regarding these Terms or wish to raise a grievance or copyright notice, please contact our designated team:
              </p>

              <div className="bg-[#F8FAF9] border border-gray-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#22B573] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Email</div>
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
                    <div className="text-xs text-gray-500 uppercase font-semibold">Location</div>
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
                Have questions about our editorial standards?
              </h3>
              <p className="text-sm text-white/90">
                Explore our curation philosophy, manuscript review vows, and publishing workflow.
              </p>
            </div>
            <Link href="/editorial-guidelines" className="shrink-0">
              <Button variant="secondary" size="md" className="bg-white text-dark-bg hover:bg-slate-100 font-semibold shadow-xs">
                Editorial Guidelines
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
