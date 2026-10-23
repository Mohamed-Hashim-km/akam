import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOMEPAGE_TAGS = ["homepage", "stories", "categories", "events", "books", "media", "comments", "editors-note", "reviews"];

function performRevalidation(path: string, tag: string | null) {
  const revalidatedTags: string[] = [];

  // 1. Invalidate specific tag immediately
  if (tag) {
    try {
      revalidateTag(tag, { expire: 0 });
      revalidatedTags.push(tag);
    } catch (e) {
      console.error(`revalidateTag failed for ${tag}:`, e);
    }
  }

  // 2. Always revalidate all homepage data tags if revalidating the root path "/" or if no tag was explicitly passed
  if (path === "/" || !tag) {
    for (const t of HOMEPAGE_TAGS) {
      if (!revalidatedTags.includes(t)) {
        try {
          revalidateTag(t, { expire: 0 });
          revalidatedTags.push(t);
        } catch (e) {
          // Ignore if tag revalidation fails
        }
      }
    }
  }

  // 3. Purge path cache for both page and layout to bust static generation & router cache immediately
  if (path) {
    try {
      revalidatePath(path, "page");
      revalidatePath(path, "layout");
    } catch (e) {
      console.error(`revalidatePath failed for ${path}:`, e);
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


