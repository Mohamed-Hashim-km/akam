import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const tag = request.nextUrl.searchParams.get("tag");
  const profile = request.nextUrl.searchParams.get("profile") || "max";

  try {
    if (tag) {
      revalidateTag(tag, profile);
    }
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      tag: tag || null,
      profile: tag ? profile : null,
      timestamp: Date.now(),
    });
  } catch (err: any) {
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

    if (tag) {
      revalidateTag(tag, profile);
    }
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      tag: tag || null,
      profile: tag ? profile : null,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err.message || "Failed to revalidate" },
      { status: 500 }
    );
  }
}

