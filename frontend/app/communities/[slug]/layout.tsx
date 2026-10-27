import type { Metadata, ResolvingMetadata } from "next";
import { API_BASE_URL } from "@/lib/config";

interface CommunityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: CommunityLayoutProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";
  const apiBase =
    process.env.INTERNAL_API_URL ||
    API_BASE_URL ||
    (process.env.NEXT_PUBLIC_SERVER_URL ? `${process.env.NEXT_PUBLIC_SERVER_URL}/api` : "https://api.akamdigital.in/api");

  try {
    const res = await fetch(`${apiBase}/communities/${slug}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const comm = await res.json();
      const title = `${comm.name || slug} — Literary Circle & Community | AKAM Digital`;
      const description =
        comm.description ||
        `Join the ${comm.name || slug} community on AKAM Digital. Participate in discussions with fellow readers, writers, and artists.`;

      const canonicalUrl = `${baseUrl}/communities/${slug}`;
      const ogImageUrl = `${baseUrl}/images/ogImage/ogImage.png`;

      return {
        title,
        description,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title,
          description,
          url: canonicalUrl,
          siteName: "AKAM Digital",
          locale: "ml_IN",
          type: "website",
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${comm.name} Community - AKAM Digital`,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [ogImageUrl],
        },
      };
    }
  } catch (err) {
    console.error("[generateMetadata] Failed to fetch community metadata:", err);
  }

  const fallbackName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${fallbackName} Community | AKAM Digital`,
    description: `Participate in literary discussions and shared stories in the ${fallbackName} circle on AKAM Digital.`,
  };
}

export default function CommunitySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
