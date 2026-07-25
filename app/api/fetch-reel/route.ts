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

    // Log raw Apify item keys for debugging (server-side only)
    console.log("[fetch-reel] Raw Apify item keys:", Object.keys(item));
    console.log("[fetch-reel] Raw metrics:", {
      videoPlayCount: item.videoPlayCount,
      videoViewCount: item.videoViewCount,
      playCount: item.playCount,
      viewsCount: item.viewsCount,
      likesCount: item.likesCount,
      commentsCount: item.commentsCount,
      sharesCount: item.sharesCount,
      savesCount: item.savesCount,
      displayUrl: item.displayUrl,
      thumbnailUrl: item.thumbnailUrl,
      thumbnail_src: item.thumbnail_src,
      imageUrl: item.imageUrl,
    });

    // --- THUMBNAIL ---
    // Priority: thumbnailUrl (native reel poster) > displayUrl > imageUrl > thumbnail_src > images[0]
    const thumbnail =
      item.thumbnailUrl ||
      item.displayUrl ||
      item.imageUrl ||
      item.thumbnail_src ||
      (Array.isArray(item.images) && item.images[0]) ||
      item.url ||
      "";

    // --- USERNAME ---
    const username =
      item.ownerUsername ||
      (item.owner && item.owner.username) ||
      item.username ||
      "unknown";

    // --- CAPTION ---
    const caption = item.caption || item.text || "";

    // --- POSTED DATE ---
    let postedDate = "Unknown";
    if (item.timestamp) {
      try {
        postedDate = new Date(item.timestamp).toISOString();
      } catch {
        postedDate = String(item.timestamp);
      }
    } else if (item.takenAt) {
      try {
        postedDate = new Date(item.takenAt * 1000).toISOString();
      } catch {
        postedDate = String(item.takenAt);
      }
    }

    // --- METRICS ---
    // Views: videoPlayCount is the correct public metric for reels (videoViewCount is deprecated)
    const views = Number(
      item.videoPlayCount ??
      item.playCount ??
      item.videoViewCount ??
      item.viewsCount ??
      0
    );

    // Likes (confirmed field name: likesCount)
    const likes = Number(item.likesCount ?? item.likes ?? 0);

    // Comments (confirmed field name: commentsCount)
    const comments = Number(item.commentsCount ?? item.comments ?? 0);

    // Shares — Instagram does NOT expose share counts via public web scraping.
    // sharesCount / shares fields are NOT present in Apify's response.
    // We use -1 as a sentinel so the UI can show "—" instead of a misleading "0".
    const sharesRaw = item.sharesCount ?? item.shares ?? null;
    const shares = sharesRaw !== null ? Number(sharesRaw) : -1;

    // Saves — same issue: Instagram does not expose saves to public scrapers.
    const savesRaw = item.savesCount ?? item.saves ?? null;
    const saves = savesRaw !== null ? Number(savesRaw) : -1;

    console.log("[fetch-reel] Parsed metrics:", { views, likes, comments, shares, saves, thumbnail });

    // Wrap thumbnail through server proxy to avoid CORS / hotlink blocks
    const proxiedThumbnail = thumbnail
      ? `/api/proxy-image?url=${encodeURIComponent(thumbnail)}`
      : "";

    return NextResponse.json({
      thumbnail: proxiedThumbnail,
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
