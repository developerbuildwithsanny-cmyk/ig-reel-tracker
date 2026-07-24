import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instagramUrl } = body;

    if (!instagramUrl || typeof instagramUrl !== "string") {
      return NextResponse.json(
        { error: "Failed to fetch reel data", details: "A valid instagramUrl parameter is required." },
        { status: 400 }
      );
    }

    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error: "Failed to fetch reel data",
          details: "APIFY_API_TOKEN is not configured in environment variables.",
        },
        { status: 500 }
      );
    }

    // Call Apify Instagram Scraper actor run-sync endpoint
    const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`;

    const actorInput = {
      directUrls: [instagramUrl.trim()],
      resultsType: "posts",
      resultsLimit: 1,
    };

    const response = await fetch(apifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(actorInput),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        // Keep raw text if not JSON
      }

      return NextResponse.json(
        {
          error: "Failed to fetch reel data",
          details: `Apify API returned HTTP status ${response.status}: ${errorDetails}`,
        },
        { status: 500 }
      );
    }

    const items = await response.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to fetch reel data",
          details: "Apify scraper executed successfully but returned no items for this URL.",
        },
        { status: 500 }
      );
    }

    const item = items[0];

    // Extract values with robust fallback structure
    const thumbnail =
      item.displayUrl ||
      item.url ||
      (Array.isArray(item.images) && item.images[0]) ||
      item.thumbnailUrl ||
      "";

    const username =
      item.ownerUsername ||
      (item.owner && item.owner.username) ||
      item.username ||
      "unknown";

    const caption = item.caption || item.text || "";

    let postedDate = "Unknown";
    if (item.timestamp) {
      try {
        postedDate = new Date(item.timestamp).toISOString();
      } catch {
        postedDate = String(item.timestamp);
      }
    } else if (item.takenAt) {
      try {
        postedDate = new Date(item.takenAt).toISOString();
      } catch {
        postedDate = String(item.takenAt);
      }
    }

    const views = Number(item.videoViewCount ?? item.videoViews ?? item.playCount ?? item.viewsCount ?? 0);
    const likes = Number(item.likesCount ?? item.likes ?? 0);
    const comments = Number(item.commentsCount ?? item.comments ?? 0);
    const shares = Number(item.videoPlayCount ?? item.videoViewCount ?? item.sharesCount ?? 0);
    const saves = Number(item.savesCount ?? item.saves ?? 0);

    return NextResponse.json({
      thumbnail,
      username,
      caption,
      postedDate,
      views,
      likes,
      comments,
      shares,
      saves,
    });
  } catch (error) {
    console.error("Error in /api/fetch-reel:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reel data",
        details: error instanceof Error ? error.message : "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
