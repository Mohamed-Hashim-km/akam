import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url") || "";
  const idParam = request.nextUrl.searchParams.get("id") || "";

  let videoId = idParam.trim();
  if (!videoId && urlParam) {
    const ytMatch = urlParam.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
    );
    if (ytMatch) {
      videoId = ytMatch[1];
    }
  }

  if (!videoId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Only YouTube video links are accepted.",
        isYouTube: false,
      },
      { status: 400 }
    );
  }

  try {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(ytUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        ok: true,
        videoId,
        isYouTube: true,
        durationSeconds: null,
        formattedDuration: null,
        isBelow30Min: true,
        warning: "Could not verify duration remotely. YouTube video accepted.",
      });
    }

    const html = await res.text();

    let durationSeconds: number | null = null;

    // 1. Try itemprop="duration"
    const isoMatch =
      html.match(/itemprop=["']duration["']\s+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["']\s+itemprop=["']duration["']/i);
    if (isoMatch) {
      const parsed = parseIsoDuration(isoMatch[1]);
      if (parsed > 0) durationSeconds = parsed;
    }

    // 2. Try lengthSeconds
    if (durationSeconds === null) {
      const lsMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
      if (lsMatch) {
        const parsed = parseInt(lsMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) durationSeconds = parsed;
      }
    }

    // 3. Try approxDurationMs
    if (durationSeconds === null) {
      const msMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (msMatch) {
        const parsed = Math.round(parseInt(msMatch[1], 10) / 1000);
        if (!isNaN(parsed) && parsed > 0) durationSeconds = parsed;
      }
    }

    if (durationSeconds !== null) {
      const isBelow30Min = durationSeconds <= 1800; // 30 minutes = 1800 seconds
      const formatted = formatSeconds(durationSeconds);

      if (!isBelow30Min) {
        return NextResponse.json({
          ok: false,
          videoId,
          isYouTube: true,
          durationSeconds,
          formattedDuration: formatted,
          isBelow30Min: false,
          error: `This video is ${formatted} long. Only YouTube videos under 30 minutes are accepted.`,
        });
      }

      return NextResponse.json({
        ok: true,
        videoId,
        isYouTube: true,
        durationSeconds,
        formattedDuration: formatted,
        isBelow30Min: true,
      });
    }

    return NextResponse.json({
      ok: true,
      videoId,
      isYouTube: true,
      durationSeconds: null,
      formattedDuration: null,
      isBelow30Min: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: true,
      videoId,
      isYouTube: true,
      durationSeconds: null,
      formattedDuration: null,
      isBelow30Min: true,
      warning: "Could not connect to verify duration.",
    });
  }
}
