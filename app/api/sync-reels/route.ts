import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { collection, query, orderBy, limit, getDocs, doc, writeBatch } from "firebase/firestore";

// Helper to normalize Instagram URLs (strip query params and trailing slashes)
function normalizeInstagramUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url.trim());
    let pathname = parsed.pathname;
    if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return url.trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured in environment variables." },
        { status: 500 }
      );
    }

    // Check if client sent specific reels to sync
    let targetReels: { id: string; instagramUrl: string }[] = [];
    try {
      const body = await req.json();
      if (body && Array.isArray(body.reels)) {
        targetReels = body.reels;
      }
    } catch {
      // No body or invalid JSON, fall back to default behavior
    }

    // Map of: normalizedUrl -> { id }
    const existingReels = new Map<string, { id: string }>();
    const targetUrls: string[] = [];

    if (targetReels.length > 0) {
      targetReels.forEach((reel) => {
        if (reel.instagramUrl && reel.id) {
          const norm = normalizeInstagramUrl(reel.instagramUrl);
          existingReels.set(norm, { id: reel.id });
          targetUrls.push(reel.instagramUrl.trim());
        }
      });
    } else {
      // 1. Query Firestore for the latest 50 reels (by addedDate descending)
      const reelsCollectionRef = collection(db, "reels");
      const q = query(reelsCollectionRef, orderBy("addedDate", "desc"), limit(50));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return NextResponse.json({
          success: true,
          processedCount: 0,
          added: 0,
          updated: 0,
          message: "No reels in the database to sync.",
        });
      }

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.instagramUrl) {
          const norm = normalizeInstagramUrl(data.instagramUrl);
          existingReels.set(norm, { id: docSnap.id });
          targetUrls.push(data.instagramUrl.trim());
        }
      });
    }

    if (targetUrls.length === 0) {
      return NextResponse.json({
        success: true,
        processedCount: 0,
        added: 0,
        updated: 0,
        message: "No reels with valid URLs to sync.",
      });
    }

    // 2. Apify call to scrape the metrics for these specific reel URLs
    const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=120`;

    const actorInput = {
      directUrls: targetUrls,
      resultsType: "posts",
      resultsLimit: targetUrls.length,
    };

    console.log(`[sync-reels] Launching Apify run for ${targetUrls.length} specific reels.`);
    const apifyRes = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
    });

    if (!apifyRes.ok) {
      const errorText = await apifyRes.text();
      return NextResponse.json(
        { error: `Apify API returned error status ${apifyRes.status}: ${errorText}` },
        { status: 500 }
      );
    }

    const items = await apifyRes.json();
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Apify scraper executed successfully but returned unexpected dataset format." },
        { status: 500 }
      );
    }

    console.log(`[sync-reels] Scraped ${items.length} items from Apify. Processing updates...`);

    // 3. Batch process the updates into Firestore
    let updatedCount = 0;
    const batch = writeBatch(db);

    for (const item of items) {
      const rawUrl = item.instagramUrl || item.url || item.webLink;
      if (!rawUrl) continue;

      const normalizedUrl = normalizeInstagramUrl(rawUrl);

      if (existingReels.has(normalizedUrl)) {
        const match = existingReels.get(normalizedUrl)!;
        const docRef = doc(db, "reels", match.id);

        // Extract thumbnail
        const rawThumbnail =
          item.thumbnailUrl ||
          item.displayUrl ||
          item.imageUrl ||
          item.thumbnail_src ||
          (Array.isArray(item.images) && item.images[0]) ||
          "";

        const thumbnail = rawThumbnail
          ? `/api/proxy-image?url=${encodeURIComponent(rawThumbnail)}`
          : undefined;

        // Extract username
        const username =
          item.ownerUsername ||
          (item.owner && item.owner.username) ||
          item.username;

        // Extract caption
        const caption = item.caption || item.text;

        // Extract timestamp in UTC format
        let postedDate = undefined;
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

        // Extract metrics
        const views = Number(
          item.videoPlayCount ??
          item.playCount ??
          item.videoViewCount ??
          item.viewsCount ??
          0
        );
        const likes = Number(item.likesCount ?? item.likes ?? 0);
        const comments = Number(item.commentsCount ?? item.comments ?? 0);
        const shares = -1; // Sentinel since not public
        const saves = -1;  // Sentinel since not public

        const updateData: any = {
          views,
          likes,
          comments,
          shares,
          saves,
          lastRefreshed: new Date().toISOString(),
        };

        if (thumbnail) updateData.thumbnail = thumbnail;
        if (username) updateData.username = username;
        if (caption) updateData.caption = caption;
        if (postedDate) updateData.postedDate = postedDate;

        batch.update(docRef, updateData);
        updatedCount++;
      }
    }

    // Commit the batch writes
    if (updatedCount > 0) {
      await batch.commit();
    }

    console.log(`[sync-reels] Finished sync! Updated: ${updatedCount} reels.`);

    return NextResponse.json({
      success: true,
      processedCount: items.length,
      added: 0,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Error in /api/sync-reels:", error);
    return NextResponse.json(
      {
        error: "Failed to sync reels",
        details: error instanceof Error ? error.message : "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
