import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALL_DATA_TAGS = [
  "homepage",
  "stories",
  "categories",
  "events",
  "books",
  "media",
  "comments",
  "editors-note",
  "reviews",
  "editions",
  "authors",
  "about",
  "emagazine",
];

const TAG_TO_PATHS: Record<string, string[]> = {
  events: ["/events", "/"],
  media: ["/media", "/"],
  editions: ["/emagazine", "/"],
  emagazine: ["/emagazine", "/"],
  authors: ["/about", "/authors", "/emagazine", "/"],
  about: ["/about", "/authors"],
  stories: ["/"],
  categories: ["/"],
  books: ["/"],
  reviews: ["/"],
  homepage: ["/"],
};

function performRevalidation(path: string, tag: string | null) {
  const revalidatedTags: string[] = [];
  const pathsToRevalidate = new Set<string>();

  // 1. Invalidate specific tag immediately
  if (tag) {
    try {
      revalidateTag(tag, { expire: 0 });
      revalidatedTags.push(tag);
    } catch (e) {
      console.error(`revalidateTag failed for ${tag}:`, e);
    }

    // Auto-map tag to affected paths
    const mapped = TAG_TO_PATHS[tag];
    if (mapped) {
      mapped.forEach((p) => pathsToRevalidate.add(p));
    }
  }

  // 2. If revalidating root "/" or if no tag explicitly passed, revalidate all tags & primary static pages
  if (path === "/" || !tag) {
    for (const t of ALL_DATA_TAGS) {
      if (!revalidatedTags.includes(t)) {
        try {
          revalidateTag(t, { expire: 0 });
          revalidatedTags.push(t);
        } catch (e) {
          // Ignore if tag revalidation fails
        }
      }
    }

    // Also purge all key static pages
    ["/", "/events", "/media", "/emagazine", "/about", "/authors"].forEach((p) =>
      pathsToRevalidate.add(p)
    );
  }

  // 3. Add explicit path if passed
  if (path) {
    pathsToRevalidate.add(path);
  }

  // 4. Purge path cache for page and layout
  for (const p of pathsToRevalidate) {
    try {
      revalidatePath(p, "page");
      revalidatePath(p, "layout");
    } catch (e) {
      console.error(`revalidatePath failed for ${p}:`, e);
    }
  }

  return revalidatedTags;
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const tag = request.nextUrl.searchParams.get("tag");

  try {
    const revalidatedTags = performRevalidation(path, tag);

    return NextResponse.json(
      {
        revalidated: true,
        path,
        tag: tag || null,
        tags: revalidatedTags,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("Revalidate GET error:", err);
    return NextResponse.json(
      { revalidated: false, error: err.message || "Failed to revalidate" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = body.path || request.nextUrl.searchParams.get("path") || "/";
    const tag = body.tag || request.nextUrl.searchParams.get("tag");

    const revalidatedTags = performRevalidation(path, tag);

    return NextResponse.json(
      {
        revalidated: true,
        path,
        tag: tag || null,
        tags: revalidatedTags,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err.message || "Failed to revalidate" },
      { status: 500 }
    );
  }
}


