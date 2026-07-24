"use client";

import React, { useState } from "react";
import { Category, Reel, Status } from "@/lib/types";
import { addReel } from "@/lib/firestore";

interface AddReelFormProps {
  onReelAdded?: () => void;
}

export default function AddReelForm({ onReelAdded }: AddReelFormProps) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category>("BuildWithSanny");
  const [status, setStatus] = useState<Status>("Pending");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const handleAddReel = async () => {
    if (!url.trim()) {
      setErrorMsg("Please paste a valid Instagram Reel URL.");
      setFailedUrl(null);
      return;
    }

    // Basic URL validation
    if (!url.includes("instagram.com")) {
      setErrorMsg("URL must be a valid Instagram link (e.g., https://www.instagram.com/reel/...).");
      setFailedUrl(url);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setFailedUrl(null);

    try {
      // 1. Call API route to fetch scraped data
      const res = await fetch("/api/fetch-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramUrl: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.details || data.error || "Failed to fetch reel data");
      }

      // 2. Build Reel object
      const newReelData: Omit<Reel, "id"> = {
        instagramUrl: url.trim(),
        thumbnail: data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop",
        username: data.username || "unknown",
        caption: data.caption || "",
        postedDate: data.postedDate || "Unknown",
        addedDate: new Date().toISOString(),
        views: Number(data.views) || 0,
        likes: Number(data.likes) || 0,
        comments: Number(data.comments) || 0,
        shares: Number(data.shares) || 0,
        saves: Number(data.saves) || 0,
        category,
        status,
        notes: "",
      };

      // 3. Save to Firestore
      await addReel(newReelData);

      // Reset form on success
      setUrl("");
      setStatus("Pending");
      if (onReelAdded) onReelAdded();
    } catch (err) {
      console.error("Error adding reel:", err);
      setFailedUrl(url);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not fetch reel metrics. Please check the URL and your Apify config."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl p-4 md:p-6 shadow-xl mb-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-[#7C3AED]" />
        Add New Instagram Reel
      </h2>

      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Instagram Reel URL (e.g. https://www.instagram.com/reel/C.../)..."
            disabled={isLoading}
            className="w-full bg-[#0F1117] border border-[#2D3245] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors duration-150"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            disabled={isLoading}
            className="w-full bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-colors duration-150 cursor-pointer"
          >
            <option value="BuildWithSanny">BuildWithSanny</option>
            <option value="ScaleWithSanny">ScaleWithSanny</option>
            <option value="JobHunt10x">JobHunt10x</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            disabled={isLoading}
            className="w-full bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-colors duration-150 cursor-pointer"
          >
            <option value="Pending">Pending</option>
            <option value="Recording">Recording</option>
            <option value="Recorded">Recorded</option>
            <option value="Posted">Posted</option>
            <option value="Archived">Archived</option>
            <option value="Waste">Waste</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleAddReel}
          disabled={isLoading}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md shadow-[#7C3AED]/20"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Add Reel</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <span className="font-semibold">Failed to fetch reel: </span>
            <span>{errorMsg}</span>
            {failedUrl && (
              <div className="mt-1 font-mono text-[11px] opacity-80 break-all">
                Target URL: {failedUrl}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
