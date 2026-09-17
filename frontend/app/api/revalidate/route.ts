import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOMEPAGE_TAGS = ["homepage", "stories", "categories", "events", "books", "media", "comments", "editors-note", "reviews"];

function performRevalidation(path: string, tag: string | null, profile: string = "max") {
  const revalidatedTags: string[] = [];

  const targetProfile = profile || "max";

  if (tag) {
    try {
      revalidateTag(tag, targetProfile);
      revalidatedTags.push(tag);
    } catch (e) {
      // Ignore
    }
  }

  // Always revalidate homepage data tags if revalidating the root path "/" or if no tag was explicitly passed
  if (path === "/" || !tag) {
    for (const t of HOMEPAGE_TAGS) {
      if (!revalidatedTags.includes(t)) {
        try {
          revalidateTag(t, targetProfile);
          revalidatedTags.push(t);
        } catch (e) {
          // Ignore if tag revalidation fails
        }
      }
    }
  }

  if (path) {
    try {
      revalidatePath(path);
    } catch (e) {
      // Ignore
    }
  }

  return revalidatedTags;
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const tag = request.nextUrl.searchParams.get("tag");
  const profile = request.nextUrl.searchParams.get("profile") || "max";

  try {
    const revalidatedTags = performRevalidation(path, tag, profile);

    return NextResponse.json(
      {
        revalidated: true,
        path,
        tag: tag || null,
        tags: revalidatedTags,
        profile,
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
    const profile = body.profile || request.nextUrl.searchParams.get("profile") || "max";

    const revalidatedTags = performRevalidation(path, tag, profile);

    return NextResponse.json(
      {
        revalidated: true,
        path,
        tag: tag || null,
        tags: revalidatedTags,
        profile,
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


