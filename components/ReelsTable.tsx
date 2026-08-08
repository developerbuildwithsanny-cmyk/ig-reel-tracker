import React from "react";
import { Reel, SortOption, ReelFilterOptions } from "@/lib/types";
import CategoryBadge from "./CategoryBadge";
import StatusBadge from "./StatusBadge";
import { deleteReel } from "@/lib/firestore";

interface ReelsTableProps {
  reels: Reel[];
  isLoading: boolean;
  selectedReelId: string | null;
  onSelectReel: (id: string) => void;
  filters: ReelFilterOptions;
  onFilterChange: (newFilters: ReelFilterOptions) => void;
  onClearFilters: () => void;
}

export default function ReelsTable({
  reels,
  isLoading,
  selectedReelId,
  onSelectReel,
  filters,
  onFilterChange,
  onClearFilters,
}: ReelsTableProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toLocaleString();
  };

  /** Ensure raw Instagram CDN URLs are served through the server-side proxy */
  const getProxiedThumbnail = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("/api/proxy-image")) return url;
    if (url.startsWith("http")) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  /** Treat -1 (unavailable metric) as 0 for engagement totals */
  const safeMetric = (n: number) => (n === -1 ? 0 : n);
  const getEngagement = (r: Reel) =>
    safeMetric(r.likes) + safeMetric(r.comments) + safeMetric(r.shares) + safeMetric(r.saves);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "Unknown") return "Unknown";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Toggle sorting from column headers
  const handleSortToggle = (option: SortOption) => {
    onFilterChange({
      ...filters,
      sortBy: option,
    });
  };

  // Confirm delete handler
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent row selection
    setIsDeleting(true);
    try {
      await deleteReel(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl overflow-hidden shadow-lg animate-pulse p-4">
        <div className="h-8 bg-[#2D3245]/60 rounded mb-4 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-14 bg-[#2D3245]/30 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No reels match your filters</h3>
        <p className="text-xs text-gray-400 mb-5">
          Try adjusting your search query, date, or dropdown selections.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer shadow-md shadow-[#7C3AED]/20"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl shadow-xl overflow-hidden">
      {/* Scrollable table container with max-height for large dataset scrolling */}
      <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-purple-900/60 scrollbar-track-transparent">
        <table className="w-full border-collapse text-left text-sm text-gray-300">
          <thead>
            <tr className="border-b border-[#2D3245] bg-[#161822] text-xs font-semibold uppercase tracking-wider text-gray-400 select-none">
              <th className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245]">Reel</th>
              <th className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245]">Category</th>
              <th className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245]">Status</th>
              
              {/* Date Added column header with sort */}
              <th 
                className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245] cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSortToggle("newest")}
              >
                <div className="flex items-center gap-1">
                  <span>Added</span>
                  <span className="text-[10px]">
                    {filters.sortBy === "newest" ? "▼" : "⇅"}
                  </span>
                </div>
              </th>

              {/* Views column header with sort */}
              <th 
                className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245] cursor-pointer hover:text-white transition-colors text-right"
                onClick={() => handleSortToggle("highestViews")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Views</span>
                  <span className="text-[10px]">
                    {filters.sortBy === "highestViews" ? "▼" : "⇅"}
                  </span>
                </div>
              </th>

              {/* Engagement column header with sort */}
              <th 
                className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245] cursor-pointer hover:text-white transition-colors text-right"
                onClick={() => handleSortToggle("highestEngagement")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Eng</span>
                  <span className="text-[10px]">
                    {filters.sortBy === "highestEngagement" ? "▼" : "⇅"}
                  </span>
                </div>
              </th>

              <th className="sticky top-0 bg-[#161822] px-2 py-3.5 z-10 border-b border-[#2D3245] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3245]/50">
            {reels.map((reel) => {
              const isSelected = reel.id === selectedReelId;
              const engagement = getEngagement(reel);

              return (
                <tr
                  key={reel.id}
                  onClick={() => onSelectReel(reel.id)}
                  className={`cursor-pointer transition-all duration-150 hover:bg-[#232736]/40 ${
                    isSelected
                      ? "bg-[#7C3AED]/10 border-l-4 border-l-[#7C3AED]"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Reel Info */}
                  <td className="px-2 py-3 min-w-[180px] max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-12 rounded bg-[#0F1117] overflow-hidden shrink-0 border border-[#2D3245]/50 flex items-center justify-center">
                        {reel.thumbnail ? (
                          <img
                            src={getProxiedThumbnail(reel.thumbnail)}
                            alt=""
                            className="h-full w-auto object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white hover:underline truncate">
                          @{reel.username || "unknown"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[150px]" title={reel.caption}>
                          {reel.caption || "No caption"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <CategoryBadge category={reel.category} />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <StatusBadge status={reel.status} />
                  </td>

                  {/* Added Date */}
                  <td className="px-2 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(reel.addedDate)}
                  </td>

                  {/* Views */}
                  <td className="px-2 py-3 text-xs font-semibold font-mono text-white text-right whitespace-nowrap">
                    {formatNumber(reel.views)}
                  </td>

                  {/* Engagement */}
                  <td className="px-2 py-3 text-xs font-semibold font-mono text-[#A78BFA] text-right whitespace-nowrap">
                    {formatNumber(engagement)}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3 text-center whitespace-nowrap">
                    {deleteConfirmId === reel.id ? (
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, reel.id)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-[10px] px-1.5 py-0.5 rounded transition-all"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(reel.id);
                          }}
                          className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                          title="Delete Reel"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
