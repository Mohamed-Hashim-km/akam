import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authors & Literary Creators — AKAM Digital",
  description:
    "Discover celebrated and emerging Malayalam authors, poets, essayists, and translators contributing original works on AKAM Digital.",
  alternates: {
    canonical: "https://akamdigital.in/authors",
  },
  openGraph: {
    title: "Authors & Literary Creators — AKAM Digital",
    description:
      "Discover Malayalam authors, poets, essayists, and contributors on AKAM Digital.",
    url: "https://akamdigital.in/authors",
    type: "profile",
  },
};

export default function AuthorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
