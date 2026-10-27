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
          "OAI-SearchBot",
          "Google-Extended",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Applebot-Extended",
          "Bytespider",
          "cohere-ai",
          "Meta-ExternalAgent",
          "CCBot",
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
          "/communities/*",
          "/authors",
          "/media",
          "/editorial-guidelines",
          "/llms.txt",
          "/.well-known/llms.txt",
          "/llms-full.txt",
          "/.well-known/llms-full.txt",
          "/sitemap.xml",
        ],
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
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

