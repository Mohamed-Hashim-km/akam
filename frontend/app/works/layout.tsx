import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Works & Literature (രചനകൾ) — Stories, Poetry, Essays | AKAM Digital",
  description:
    "Explore a curated collection of Malayalam stories, poems, novellas, essays, audio narratives, and visual arts by talented writers on AKAM Digital.",
  alternates: {
    canonical: "https://akamdigital.in/works",
  },
  openGraph: {
    title: "Works & Literature (രചനകൾ) — Stories, Poetry, Essays | AKAM Digital",
    description:
      "Explore a curated collection of Malayalam stories, poems, novellas, essays, audio narratives, and visual arts on AKAM Digital.",
    url: "https://akamdigital.in/works",
    type: "website",
  },
};

export default function WorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
