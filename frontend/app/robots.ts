import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/editorial",
          "/editorial/*",
          "/api/",
          "/profile",
          "/profile/*",
          "/submit",
          "/submit/*",
          "/flipbook-demo",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "ClaudeBot",
          "PerplexityBot",
          "Applebot-Extended",
        ],
        allow: [
          "/",
          "/about",
          "/works",
          "/works/*",
          "/emagazine",
          "/events",
          "/events/*",
          "/communities",
          "/authors",
          "/media",
          "/editorial-guidelines",
          "/llms.txt",
          "/.well-known/llms.txt",
          "/llms-full.txt",
        ],
        disallow: ["/editorial", "/editorial/*", "/api/", "/profile", "/submit"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

