import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership & Subscription Plans — AKAM Digital",
  description:
    "Subscribe to AKAM Digital for unlimited reading access to all stories, monthly E-Magazine flipbooks, community discussions, and cultural events.",
  alternates: {
    canonical: "https://akamdigital.in/plans",
  },
  openGraph: {
    title: "Membership & Subscription Plans — AKAM Digital",
    description:
      "Subscribe to AKAM Digital for unlimited access to Malayalam literature and exclusive monthly magazine editions.",
    url: "https://akamdigital.in/plans",
    type: "website",
  },
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
