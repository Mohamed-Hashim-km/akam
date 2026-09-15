import { MetadataRoute } from "next";
import { API_BASE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/contact",
    "/events",
    "/emagazine",
    "/media",
    "/works",
    "/submit",
    "/editorial-guidelines",
    "/library",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const res = await fetch(`${API_BASE_URL}/stories?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const stories = data?.data || (Array.isArray(data) ? data : []);
      const storyRoutes: MetadataRoute.Sitemap = stories.map(
        (story: { id: string; updatedAt?: string; createdAt?: string }) => ({
          url: `${baseUrl}/works/${story.id}`,
          lastModified: story.updatedAt ? new Date(story.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
      return [...staticRoutes, ...storyRoutes];
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch stories:", err);
  }

  return staticRoutes;
}
