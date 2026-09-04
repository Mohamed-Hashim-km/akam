import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Sparkles,
  CheckCircle2,
  PenTool,
  ArrowRight,
  FileText,
  Users,
  Award,
  HelpCircle,
  Clock,
  Layers,
  Send,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Editorial Guidelines — AKAM Digital",
  description:
    "Learn about AKAM's editorial standards, submission guidelines, curation philosophy, and review process for Malayalam literature, essays, and stories.",
};

export default function EditorialGuidelinesPage() {
  const guidelines = [
    {
      icon: <Award className="w-6 h-6 text-[#22B573]" />,
      title: "Originality & Literary Integrity",
      description:
        "Every submission must be original, authentic, and written by the submitting author. We strictly prohibit plagiarized content, AI-generated filler text, or unauthorized translations. Works previously published on blogs are accepted provided you hold full rights.",
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[#22B573]" />,
      title: "Cultural Nuance & Relevance",
      description:
        "AKAM champions depth over brevity and nuance over noise. We celebrate stories, poetry, and essays that honor Kerala's literary heritage, regional dialects, contemporary socio-cultural commentary, and innovative narrative forms.",
    },
    {
      icon: <FileText className="w-6 h-6 text-[#22B573]" />,
      title: "Formatting & Media Integration",
      description:
        "Structure your work into readable paragraphs with clear headings for serialized pieces. Authors can attach a custom cover image and embed high-resolution inline images to enrich the reading experience.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#22B573]" />,
      title: "Ethical & Inclusive Content",
      description:
        "We uphold an environment of respectful discourse. Content promoting hate speech, defamation, explicit violence, or discrimination will be rejected immediately by the editorial board.",
    },
  ];

  const categories = [
    {
      name: "Fiction & Novels",
      desc: "Serialized novels, short fiction, or multi-part narratives exploring human emotion and societal themes.",
    },
    {
      name: "Poetry Cycles",
      desc: "Classical meters, free verse, or modern experimental poetry celebrating Malayalam's poetic cadence.",
    },
    {
      name: "Cultural Essays",
      desc: "Thought-provoking commentaries on literature, cinema, history, philosophy, and art.",
    },
    {
      name: "Interviews & Memoirs",
      desc: "Personal memoirs, historical recollections, and conversations with eminent thinkers.",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Draft Your Piece",
      description: "Use our integrated Authoring Studio to craft your story, add cover art, and format your paragraphs.",
    },
    {
      step: "02",
      title: "Submit for Review",
      description: "Submit your finished draft to the AKAM Editorial Queue with a single click from your studio.",
    },
    {
      step: "03",
      title: "Editorial Vow Review",
      description: "Our editorial board reviews submissions for literary depth, language precision, and authenticity.",
    },
    {
      step: "04",
      title: "Publication & Reach",
      description: "Once approved, your piece is published to AKAM Digital and featured across our reader community.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins text-gray-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-[#DBF4FF] py-16 sm:py-24 lg:py-28 font-poppins flex items-center justify-center">
        <div className="container px-4 mx-auto text-center relative z-10 max-w-4xl">
       
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#040706] text-center mb-6 leading-[1.25] tracking-tight">
            Editorial Guidelines
          </h1>

          <p className="text-base sm:text-lg text-gray-700 font-normal leading-relaxed text-center max-w-3xl mx-auto">
            Our mission is centered on depth over brevity, nuance over noise, and authenticity over trends. Every submission is carefully evaluated by the AKAM Editorial Board to maintain the highest literary standard.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <main className="flex-1 py-16 lg:py-24">
        <div className="container px-4 mx-auto max-w-6xl space-y-20">

          {/* Pillars of Editorial Review */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#040706] tracking-tight mb-4">
                Pillars of Our Editorial Vow
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                We maintain clear standards to ensure a rich, respectful, and timeless digital literary archive.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {guidelines.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F9FAFB] border border-gray-200 rounded-3xl p-8 hover:border-[#22B573]/50 transition-all shadow-xs hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-xs">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#040706] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

   

          {/* Submission & Review Process Steps */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#040706] tracking-tight mb-4">
                The Editorial Submission Journey
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                From your initial draft to final publication, here is how your work reaches our community.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-3xl p-6 relative flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                >
                  <div>
                    <span className="text-3xl font-bold text-[#22B573] mb-4 block">
                      {step.step}
                    </span>
                    <h4 className="text-lg font-semibold text-[#040706] mb-2">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Call To Action Banner */}
          <div className="bg-[#22B573] rounded-[36px] p-8 sm:p-12 lg:p-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="max-w-2xl space-y-3">
              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Ready to Share Your Voice?
              </h3>
              <p className="text-sm sm:text-base text-white/90 font-normal leading-relaxed">
                Open our Authoring Studio, write your narrative, and submit directly to the AKAM Editorial Board.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link href="/submit">
                <button className="bg-white text-[#040706] hover:bg-slate-100 font-medium px-6 py-3 rounded-full text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md group cursor-pointer">
                  <PenTool className="w-4 h-4 text-[#040706]" />
                  <span>Start Writing Now</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>

              <Link href="/contact">
                <button className="border border-white/80 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-full text-sm sm:text-base transition-all cursor-pointer">
                  Contact Editorial Board
                </button>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
