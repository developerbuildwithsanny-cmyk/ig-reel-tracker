"use client";

import React, { useState } from "react";
import { Reel, Status, Category } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import { updateReelStatus, updateReelNotes, deleteReel } from "@/lib/firestore";

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

  // Synchronize local state if prop changes
  React.useEffect(() => {
    setCurrentStatus(reel.status);
  }, [reel.status]);

  React.useEffect(() => {
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
              src={reel.thumbnail}
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

          {/* Dates Row */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 pb-2.5 border-b border-[#2D3245]/60">
            <span>Posted: {formatDate(reel.postedDate)}</span>
            <span>Added: {formatDate(reel.addedDate)}</span>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-5 gap-1 bg-[#0F1117] rounded-lg p-2 mb-3 border border-[#2D3245]/50 text-center font-mono">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400">👁</span>
              <span className="text-xs font-semibold text-white">{formatNumber(reel.views)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-rose-400">❤️</span>
              <span className="text-xs font-semibold text-rose-300">{formatNumber(reel.likes)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-blue-400">💬</span>
              <span className="text-xs font-semibold text-blue-300">{formatNumber(reel.comments)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-amber-400">🔁</span>
              <span className="text-xs font-semibold text-amber-300">{formatNumber(reel.shares)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-emerald-400">🔖</span>
              <span className="text-xs font-semibold text-emerald-300">{formatNumber(reel.saves)}</span>
            </div>
          </div>
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
