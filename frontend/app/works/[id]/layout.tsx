import type { Metadata, ResolvingMetadata } from "next";
import { API_BASE_URL } from "@/lib/config";

interface WorkLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: WorkLayoutProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";
  const apiBase =
    process.env.INTERNAL_API_URL ||
    API_BASE_URL ||
    (process.env.NEXT_PUBLIC_SERVER_URL ? `${process.env.NEXT_PUBLIC_SERVER_URL}/api` : "https://api.akamdigital.in/api");

  try {
    const res = await fetch(`${apiBase}/stories/${id}`, {
      next: { revalidate: 180 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const story = await res.json();
      const authorText = story.authorName ? ` — ${story.authorName}` : "";
      const title = story.title ? `${story.title}${authorText} | AKAM Digital` : "Work | AKAM Digital";
      const description =
        story.description ||
        (story.content ? story.content.slice(0, 160).replace(/<[^>]*>/g, "").trim() : "") ||
        "Read contemporary Malayalam literature, fiction, and poetry on AKAM Digital.";

      let ogImageUrl = `${baseUrl}/images/ogImage/ogImage.png`;
      if (story.coverImageUrl) {
        ogImageUrl = story.coverImageUrl.startsWith("http")
          ? story.coverImageUrl
          : `${baseUrl}${story.coverImageUrl.startsWith("/") ? "" : "/"}${story.coverImageUrl}`;
      }

      const canonicalUrl = `${baseUrl}/works/${story.slug || story.id}`;

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
          type: "article",
          publishedTime: story.createdAt,
          authors: story.authorName ? [story.authorName] : undefined,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: story.title || "AKAM Digital Story",
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
    console.error("[generateMetadata] Failed to fetch story metadata:", err);
  }

  return {
    title: "Work | AKAM Digital",
    description: "Read contemporary Malayalam literature, stories, and poetry on AKAM Digital.",
  };
}

export default function WorkDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
