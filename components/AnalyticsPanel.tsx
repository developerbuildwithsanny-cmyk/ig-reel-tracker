"use client";

import React, { useState } from "react";
import { Reel, Category } from "@/lib/types";

interface AnalyticsPanelProps {
  reels: Reel[];
}

export default function AnalyticsPanel({ reels }: AnalyticsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate Top 3 Most Viewed
  const topViewed = [...reels]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  // Calculate Top 3 Most Liked
  const topLiked = [...reels]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  // Calculate Top 3 Highest Engagement (likes + comments + shares + saves)
  const safeM = (n: number) => (n === -1 ? 0 : n);
  const getEngagement = (r: Reel) => safeM(r.likes) + safeM(r.comments) + safeM(r.shares) + safeM(r.saves);
  const topEngagement = [...reels]
    .sort((a, b) => getEngagement(b) - getEngagement(a))
    .slice(0, 3);

  // Category counts
  const categories: Category[] = ["BuildWithSanny", "ScaleWithSanny", "JobHunt10x"];
  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: reels.filter((r) => r.category === cat).length,
  }));

  // Today comparison
  const todayStr = new Date().toISOString().split("T")[0];
  const addedToday = reels.filter((r) => r.addedDate && r.addedDate.split("T")[0] === todayStr).length;
  const recordedToday = reels.filter(
    (r) => r.status === "Recorded" && r.addedDate && r.addedDate.split("T")[0] === todayStr
  ).length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  const renderRankedList = (
    title: string,
    items: Reel[],
    metricGetter: (r: Reel) => string,
    icon: string
  ) => (
    <div className="bg-[#0F1117] border border-[#2D3245] rounded-xl p-4 flex flex-col justify-between">
      <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No reels recorded yet.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <a
              key={item.id}
              href={item.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#1A1D27] transition-colors duration-150 group"
            >
              <span className="font-mono text-xs font-bold text-purple-400 w-4">
                #{idx + 1}
              </span>
              <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate group-hover:text-purple-300">
                  @{item.username}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {item.caption || "No caption"}
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-white bg-gray-800/80 px-2 py-1 rounded">
                {metricGetter(item)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full bg-[#1A1D27] border border-[#2D3245] rounded-xl overflow-hidden shadow-xl mb-8">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-[#1A1D27] hover:bg-[#232736] transition-colors duration-150 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-[#7C3AED]"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <h3 className="text-base font-semibold text-white">Analytics Overview</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-6 border-t border-[#2D3245] space-y-6 bg-[#161822]">
          {/* Top 3 Rankings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderRankedList(
              "Top 3 Most Viewed",
              topViewed,
              (r) => `${formatNumber(r.views)} views`,
              "👁"
            )}
            {renderRankedList(
              "Top 3 Most Liked",
              topLiked,
              (r) => `${formatNumber(r.likes)} likes`,
              "❤️"
            )}
            {renderRankedList(
              "Top 3 Highest Engagement",
              topEngagement,
              (r) => `${formatNumber(getEngagement(r))} total`,
              "🔥"
            )}
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div className="bg-[#0F1117] border border-[#2D3245] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Category Distribution
              </h4>
              <div className="space-y-3">
                {categoryCounts.map((cat) => {
                  const pct = reels.length > 0 ? (cat.count / reels.length) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 font-medium">{cat.name}</span>
                        <span className="font-mono text-gray-400">
                          {cat.count} reels ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#1A1D27] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#7C3AED] h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Velocity Stats */}
            <div className="bg-[#0F1117] border border-[#2D3245] rounded-xl p-4 flex flex-col justify-between">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Production Velocity Today
              </h4>
              <div className="grid grid-cols-2 gap-4 flex-1 items-center">
                <div className="bg-[#1A1D27] p-4 rounded-lg border border-[#2D3245] text-center">
                  <span className="text-xs text-gray-400 block mb-1">Added Today</span>
                  <span className="text-3xl font-bold font-mono text-teal-300">
                    {addedToday}
                  </span>
                </div>
                <div className="bg-[#1A1D27] p-4 rounded-lg border border-[#2D3245] text-center">
                  <span className="text-xs text-gray-400 block mb-1">Recorded Today</span>
                  <span className="text-3xl font-bold font-mono text-indigo-300">
                    {recordedToday}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
