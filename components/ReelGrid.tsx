import React from "react";
import { Reel } from "@/lib/types";
import ReelCard from "./ReelCard";

interface ReelGridProps {
  reels: Reel[];
  isLoading: boolean;
  totalReelsCount: number;
  onClearFilters: () => void;
}

export default function ReelGrid({
  reels,
  isLoading,
  totalReelsCount,
  onClearFilters,
}: ReelGridProps) {
  // Initial Loading Skeleton State (6 animated skeleton cards)
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#1A1D27] border border-[#2D3245] rounded-xl overflow-hidden shadow-lg animate-pulse"
          >
            <div className="aspect-video bg-[#2D3245]/60 w-full" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-[#2D3245]/80 rounded w-3/4" />
              <div className="h-3 bg-[#2D3245]/60 rounded w-1/2" />
              <div className="h-10 bg-[#0F1117] rounded-lg border border-[#2D3245]/50" />
              <div className="h-8 bg-[#2D3245]/40 rounded" />
              <div className="h-12 bg-[#2D3245]/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Entire Database is Empty State
  if (totalReelsCount === 0) {
    return (
      <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl p-12 text-center my-8 shadow-xl flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#7C3AED]/15 rounded-full flex items-center justify-center text-[#7C3AED] mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No reels yet</h3>
        <p className="text-sm text-gray-400 max-w-md">
          Paste an Instagram Reel URL in the form above to start tracking views, engagement, and content production status.
        </p>
      </div>
    );
  }

  // Filter Active but No Results Match State
  if (reels.length === 0) {
    return (
      <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl p-12 text-center my-8 shadow-xl flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
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
          Try adjusting your search query or category/status dropdown selections.
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

  // Responsive Grid with Reel Cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
