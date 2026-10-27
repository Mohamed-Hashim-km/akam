import { MetadataRoute } from "next";
import { API_BASE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";
  const defaultOgImage = `${baseUrl}/images/ogImage/ogImage.png`;
  const now = new Date();

  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/works`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/emagazine`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/authors`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/media`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      images: [defaultOgImage],
    },
    {
      url: `${baseUrl}/plans`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/editorial-guidelines`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Derive active backend API URL (with fallbacks for SSR/build environments)
  const apiBase =
    process.env.INTERNAL_API_URL ||
    API_BASE_URL ||
    (process.env.NEXT_PUBLIC_SERVER_URL ? `${process.env.NEXT_PUBLIC_SERVER_URL}/api` : "https://api.akamdigital.in/api");

  // Dynamic Content Routes (Stories, Communities, Events)
  try {
    const [storiesRes, communitiesRes, eventsRes] = await Promise.allSettled([
      fetch(`${apiBase}/stories?status=APPROVED&limit=1000`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${apiBase}/communities`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${apiBase}/events`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [];

    // Stories / Works routes
    if (storiesRes.status === "fulfilled" && storiesRes.value.ok) {
      const data = await storiesRes.value.json().catch(() => null);
      const stories = data?.data || (Array.isArray(data) ? data : []);
      for (const story of stories) {
        if (story?.slug || story?.id) {
          const storyImages: string[] = [];
          if (story.coverImageUrl) {
            const imgUrl = story.coverImageUrl.startsWith("http")
              ? story.coverImageUrl
              : `${baseUrl}${story.coverImageUrl.startsWith("/") ? "" : "/"}${story.coverImageUrl}`;
            storyImages.push(imgUrl);
          } else {
            storyImages.push(defaultOgImage);
          }

          dynamicRoutes.push({
            url: `${baseUrl}/works/${story.slug || story.id}`,
            lastModified: story.updatedAt ? new Date(story.updatedAt) : now,
            changeFrequency: "weekly",
            priority: 0.8,
            images: storyImages,
          });
        }
      }
    }

    // Communities routes
    if (communitiesRes.status === "fulfilled" && communitiesRes.value.ok) {
      const commData = await communitiesRes.value.json().catch(() => null);
      const communities = Array.isArray(commData) ? commData : (commData?.data || []);
      for (const comm of communities) {
        if (comm?.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/communities/${comm.slug}`,
            lastModified: comm.updatedAt ? new Date(comm.updatedAt) : now,
            changeFrequency: "daily",
            priority: 0.75,
            images: [defaultOgImage],
          });
        }
      }
    }

    // Events routes
    if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
      const eventsData = await eventsRes.value.json().catch(() => null);
      const events = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);
      for (const event of events) {
        if (event?.slug || event?.id) {
          dynamicRoutes.push({
            url: `${baseUrl}/events#${event.slug || event.id}`,
            lastModified: event.updatedAt ? new Date(event.updatedAt) : now,
            changeFrequency: "weekly",
            priority: 0.7,
            images: event.coverImageUrl ? [event.coverImageUrl] : [defaultOgImage],
          });
        }
      }
    }

    return [...staticRoutes, ...dynamicRoutes];
  } catch (err) {
    console.error("[sitemap] Failed to fetch dynamic routes:", err);
  }

  return staticRoutes;
}
