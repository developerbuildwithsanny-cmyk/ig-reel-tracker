import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/debug-reel?url=<instagram_url>
 * Returns the full raw Apify response so we can inspect all available fields.
 * REMOVE THIS BEFORE PRODUCTION.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instagramUrl = searchParams.get("url");

  if (!instagramUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "No APIFY_API_TOKEN" }, { status: 500 });
  }

  const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=120`;

  const actorInput = {
    directUrls: [instagramUrl.trim()],
    resultsType: "posts",
    resultsLimit: 1,
  };

  const response = await fetch(apifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(actorInput),
  });

  const items = await response.json();
  // Return the full raw item so we can inspect every field
  return NextResponse.json({
    status: response.status,
    itemCount: Array.isArray(items) ? items.length : 0,
    rawItem: Array.isArray(items) && items.length > 0 ? items[0] : null,
    allKeys: Array.isArray(items) && items.length > 0 ? Object.keys(items[0]) : [],
  });
}
