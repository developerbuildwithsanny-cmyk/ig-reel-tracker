"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Reel, Status, Category } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import { updateReelStatus, updateReelNotes, deleteReel, updateReelMetrics } from "@/lib/firestore";

interface ReelCardProps {
  reel: Reel;
}

export default function ReelCard({ reel }: ReelCardProps) {
  const [currentStatus, setCurrentStatus] = useState<Status>(reel.status);
  const [notesText, setNotesText] = useState<string>(reel.notes || "");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  /** Ensure raw Instagram CDN URLs are always served through the proxy */
  const getProxiedThumbnail = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("/api/proxy-image")) return url;
    if (url.startsWith("http")) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  /** How long ago a date string was (e.g. "2 hrs ago", "5 min ago") */
  const timeAgo = (isoStr: string): string => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  /** Core refresh function — exported so both auto & manual can call it */
  const refreshMetrics = useCallback(async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
      setActionError(null);
      setRefreshSuccess(false);
    } else {
      setIsRefreshing(true); // show subtle spinner even on auto
    }
    try {
      const res = await fetch("/api/fetch-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramUrl: reel.instagramUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.details || data.error || "Failed to refresh");
      }
      await updateReelMetrics(reel.id, {
        views: Number(data.views) || 0,
        likes: Number(data.likes) || 0,
        comments: Number(data.comments) || 0,
        shares: Number(data.shares) || 0,
        saves: Number(data.saves) || 0,
        thumbnail: data.thumbnail || reel.thumbnail,
      });
      if (!silent) {
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to refresh metrics:", err);
      if (!silent) {
        setActionError(err instanceof Error ? err.message : "Refresh failed");
      }
    } finally {
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id, reel.instagramUrl]);

  /**
   * AUTO-REFRESH on open:
   * When this card mounts (i.e. user clicked "View Card"), check if the
   * metrics are stale (no lastRefreshed, or refreshed > 1 hour ago).
   * If stale → silently refresh in the background.
   */
  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const isStale =
      !reel.lastRefreshed ||
      Date.now() - new Date(reel.lastRefreshed).getTime() > ONE_HOUR_MS;

    if (isStale) {
      refreshMetrics(true); // silent = true → no success toast
    }
  // Only run when the reel ID changes (i.e. a different card was opened)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id]);

  // Synchronize local status/notes state when Firestore pushes new data
  useEffect(() => {
    setCurrentStatus(reel.status);
  }, [reel.status]);

  useEffect(() => {
    setNotesText(reel.notes || "");
  }, [reel.notes]);

  const handleStatusChange = async (newStatus: Status) => {
    setCurrentStatus(newStatus);
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      await updateReelStatus(reel.id, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
      setActionError("Failed to save status");
      setCurrentStatus(reel.status); // revert
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleNotesBlur = async () => {
    if (notesText === reel.notes) return; // No change
    setIsSavingNotes(true);
    setActionError(null);
    try {
      await updateReelNotes(reel.id, notesText);
    } catch (err) {
      console.error("Failed to update notes:", err);
      setActionError("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteReel(reel.id);
    } catch (err) {
      console.error("Failed to delete reel:", err);
      setActionError("Failed to delete reel");
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };


  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toLocaleString();
  };

  /**
   * Like formatNumber but shows "—" when value is -1
   * (sentinel used when Instagram doesn't expose the metric publicly)
   */
  const formatMetric = (num: number): string => {
    if (num === -1) return "—";
    return formatNumber(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "Unknown") return "Unknown";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-[#1A1D27] border border-[#2D3245] rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-[#7C3AED]/50 transition-all duration-150 relative group">
      {/* Top Image Section */}
      <div className="relative aspect-video bg-[#0F1117] overflow-hidden group/img cursor-pointer">
        <a
          href={reel.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          {reel.thumbnail ? (
            <img
              src={getProxiedThumbnail(reel.thumbnail)}
              alt={`Reel by @${reel.username}`}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
              onError={(e) => {
                // Fallback image if thumbnail fails to load
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0F1117] text-gray-500 text-xs">
              No Thumbnail Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90" />
        </a>

        {/* Category & Status Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <CategoryBadge category={reel.category || "BuildWithSanny"} />
        </div>

        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={currentStatus} />
        </div>

        {/* Username overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
          <a
            href={reel.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm hover:underline flex items-center gap-1 text-white truncate max-w-[70%]"
          >
            <span>@{reel.username || "unknown"}</span>
          </a>
          <a
            href={reel.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] bg-black/60 hover:bg-[#7C3AED] text-gray-200 hover:text-white px-2 py-0.5 rounded backdrop-blur transition-colors duration-150 flex items-center gap-1"
          >
            Open Reel ↗
          </a>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Caption */}
          <p
            className="text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed"
            title={reel.caption || "No caption"}
          >
            {reel.caption || <span className="italic text-gray-500">No caption available</span>}
          </p>

          {/* Dates Row + Last Synced */}
          <div className="text-[11px] text-gray-400 mb-3 pb-2.5 border-b border-[#2D3245]/60 space-y-1">
            <div className="flex items-center justify-between">
              <span>Posted: {formatDate(reel.postedDate)}</span>
              <span>Added: {formatDate(reel.addedDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-2.5 w-2.5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-purple-400">Syncing live data...</span>
                  </>
                ) : reel.lastRefreshed ? (
                  <span className="text-emerald-500/70">✓ Synced {timeAgo(reel.lastRefreshed)}</span>
                ) : (
                  <span className="text-yellow-500/60">⚠ Not yet synced</span>
                )}
              </span>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-5 gap-1 bg-[#0F1117] rounded-lg p-2 mb-1 border border-[#2D3245]/50 text-center font-mono">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400">👁</span>
              <span className="text-xs font-semibold text-white">{formatMetric(reel.views)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-rose-400">❤️</span>
              <span className="text-xs font-semibold text-rose-300">{formatMetric(reel.likes)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-blue-400">💬</span>
              <span className="text-xs font-semibold text-blue-300">{formatMetric(reel.comments)}</span>
            </div>
            <div className="flex flex-col items-center" title="Shares — not exposed by Instagram publicly">
              <span className="text-[10px] text-amber-400">🔁</span>
              <span className={`text-xs font-semibold ${reel.shares === -1 ? "text-gray-600" : "text-amber-300"}`}>
                {formatMetric(reel.shares)}
              </span>
            </div>
            <div className="flex flex-col items-center" title="Saves — not exposed by Instagram publicly">
              <span className="text-[10px] text-emerald-400">🔖</span>
              <span className={`text-xs font-semibold ${reel.saves === -1 ? "text-gray-600" : "text-emerald-300"}`}>
                {formatMetric(reel.saves)}
              </span>
            </div>
          </div>
          {/* Data source disclaimer */}
          <p className="text-[10px] text-gray-600 mb-3 text-center">
            Via Apify scraper · Shares &amp; Saves not public on Instagram
          </p>
        </div>

        {/* Inline Editing Controls */}
        <div className="mt-2 space-y-2.5">
          {/* Status Dropdown */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-gray-400 shrink-0">Status:</label>
            <div className="relative flex-1">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                disabled={isUpdatingStatus}
                className="w-full bg-[#0F1117] border border-[#2D3245] rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#7C3AED] transition-colors duration-150 cursor-pointer"
              >
                <option value="Pending">Pending (Yellow)</option>
                <option value="Recording">Recording (Blue)</option>
                <option value="Recorded">Recorded (Indigo)</option>
                <option value="Posted">Posted (Green)</option>
                <option value="Archived">Archived (Gray)</option>
                <option value="Waste">Waste (Red)</option>
              </select>
              {isUpdatingStatus && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 animate-pulse">
                  Saving...
                </span>
              )}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="relative">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes (auto-saves on blur)..."
              rows={2}
              className="w-full bg-[#0F1117] border border-[#2D3245] rounded-md p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors duration-150 resize-none"
            />
            {isSavingNotes && (
              <span className="absolute right-2 bottom-2 text-[10px] text-purple-400 animate-pulse">
                Saving notes...
              </span>
            )}
          </div>

          {/* Refresh Metrics Button */}
          <button
            type="button"
            onClick={() => refreshMetrics(false)}
            disabled={isRefreshing}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer border ${
              refreshSuccess
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-[#0F1117] border-[#2D3245] text-gray-400 hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/5"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12 0v4a8 8 0 00-8 8h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Refreshing metrics...</span>
              </>
            ) : refreshSuccess ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Metrics updated!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>Refresh Live Metrics</span>
              </>
            )}
          </button>

          {/* Card Footer: Delete Action & Errors */}
          <div className="flex items-center justify-between pt-1">
            {showConfirmDelete ? (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded p-2 flex items-center justify-between text-xs">
                <span className="text-red-400 font-medium">Delete this reel?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    disabled={isDeleting}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-0.5 rounded text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                {actionError ? (
                  <span className="text-[11px] text-red-400">{actionError}</span>
                ) : (
                  <span className="text-[10px] text-gray-500">ID: {reel.id.slice(0, 8)}...</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  title="Delete Reel"
                  className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

