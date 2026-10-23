import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Literary Communities & Circles — AKAM Digital",
  description:
    "Join vibrant Malayalam literary communities on AKAM Digital. Discuss stories, poetry, essays, novellas, and cultural movements with fellow readers and writers.",
  alternates: {
    canonical: "https://akamdigital.in/communities",
  },
  openGraph: {
    title: "Literary Communities & Circles — AKAM Digital",
    description:
      "Join vibrant Malayalam literary communities on AKAM Digital. Discuss stories, poetry, essays, novellas, and cultural movements with fellow readers and writers.",
    url: "https://akamdigital.in/communities",
    type: "website",
  },
};

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
