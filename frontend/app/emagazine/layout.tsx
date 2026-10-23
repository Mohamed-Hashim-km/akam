import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Magazine (ഇ-മാസിക) — Digital Literary Editions | AKAM Digital",
  description:
    "Read monthly interactive digital editions of AKAM Magazine. Experience rich Malayalam literature, exclusive essays, poetry, and art in an interactive flipbook.",
  alternates: {
    canonical: "https://akamdigital.in/emagazine",
  },
  openGraph: {
    title: "E-Magazine (ഇ-മാസിക) — Digital Literary Editions | AKAM Digital",
    description:
      "Read monthly interactive digital editions of AKAM Magazine with flipbook view, essays, stories, and art.",
    url: "https://akamdigital.in/emagazine",
    type: "website",
  },
};

export default function EmagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
