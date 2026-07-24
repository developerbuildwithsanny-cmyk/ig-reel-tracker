import React from "react";
import { Category, Status, SortOption, ReelFilterOptions } from "@/lib/types";

interface FilterBarProps {
  filters: ReelFilterOptions;
  onFilterChange: (newFilters: ReelFilterOptions) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const isFiltered =
    filters.searchQuery !== "" ||
    filters.category !== "All" ||
    filters.status !== "All" ||
    filters.sortBy !== "newest" ||
    !!filters.dateFilter;

  return (
    <div className="bg-[#1A1D27] border border-[#2D3245] rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search username or caption..."
            className="w-full bg-[#0F1117] border border-[#2D3245] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors duration-150"
          />
        </div>

        {/* Dropdowns & Clear Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) =>
              onFilterChange({ ...filters, category: e.target.value as Category | "All" })
            }
            className="bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer transition-colors duration-150"
          >
            <option value="All">All Categories</option>
            <option value="BuildWithSanny">BuildWithSanny</option>
            <option value="ScaleWithSanny">ScaleWithSanny</option>
            <option value="JobHunt10x">JobHunt10x</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as Status | "All" })
            }
            className="bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer transition-colors duration-150"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Recording">Recording</option>
            <option value="Recorded">Recorded</option>
            <option value="Posted">Posted</option>
            <option value="Archived">Archived</option>
            <option value="Waste">Waste</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={filters.dateFilter || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, dateFilter: e.target.value })
            }
            className="bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer transition-colors duration-150 [color-scheme:dark]"
            title="Filter by Added/Posted Date"
          />

          {/* Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({ ...filters, sortBy: e.target.value as SortOption })
            }
            className="bg-[#0F1117] border border-[#2D3245] rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer transition-colors duration-150"
          >
            <option value="newest">Newest Added</option>
            <option value="highestViews">Highest Views</option>
            <option value="highestLikes">Highest Likes</option>
            <option value="highestEngagement">Highest Engagement</option>
          </select>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400 flex items-center justify-between border-t border-[#2D3245]/50 pt-2">
        <span>
          Showing <strong className="text-white">{resultCount}</strong> of{" "}
          <strong className="text-white">{totalCount}</strong> reels
        </span>
        {isFiltered && (
          <span className="text-purple-400 text-[11px]">Filters applied</span>
        )}
      </div>
    </div>
  );
}
