import { MetadataRoute } from "next";
import { API_BASE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";
  const now = new Date();

  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/works`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/emagazine`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/authors`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/media`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
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
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic Content Routes (Stories & Communities)
  try {
    const [storiesRes, communitiesRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/stories?status=APPROVED&limit=500`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${API_BASE_URL}/communities`, {
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
          dynamicRoutes.push({
            url: `${baseUrl}/works/${story.slug || story.id}`,
            lastModified: story.updatedAt ? new Date(story.updatedAt) : now,
            changeFrequency: "weekly",
            priority: 0.75,
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
            priority: 0.7,
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
