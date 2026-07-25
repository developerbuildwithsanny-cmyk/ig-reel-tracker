import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy-image?url=<encoded_image_url>
 *
 * Server-side proxy to bypass CORS / hotlink-protection on Instagram CDN
 * thumbnail URLs returned by Apify. The browser fetches this route which
 * in turn fetches the remote image on the server side (no CORS restrictions)
 * and pipes the bytes back to the client with the correct content-type.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Basic safety check – only allow instagram/fbcdn URLs
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  const allowedHosts = [
    "instagram.com",
    "cdninstagram.com",
    "fbcdn.net",
    "scontent",
    "lookaside.fbsbx.com",
  ];

  const isAllowed = allowedHosts.some((host) =>
    parsedUrl.hostname.includes(host)
  );

  if (!isAllowed) {
    return new NextResponse("URL host not allowed", { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Mimic a browser request so CDN serves the asset
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Remote image returned ${response.status}`, {
        status: 502,
      });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour in browser, 24 hours in CDN
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("[proxy-image] Fetch failed:", error);
    return new NextResponse("Failed to fetch remote image", { status: 502 });
  }
}
