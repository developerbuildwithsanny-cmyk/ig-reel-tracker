import React from "react";
import { Reel } from "@/lib/types";

interface StatsBarProps {
  reels: Reel[];
}

export default function StatsBar({ reels }: StatsBarProps) {
  const totalReels = reels.length;
  const pendingCount = reels.filter((r) => r.status === "Pending").length;
  const recordedCount = reels.filter((r) => r.status === "Recorded").length;
  const postedCount = reels.filter((r) => r.status === "Posted").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const addedTodayCount = reels.filter((r) => {
    if (!r.addedDate) return false;
    return r.addedDate.split("T")[0] === todayStr;
  }).length;

  const stats = [
    {
      label: "Total Reels",
      value: totalReels,
      border: "border-l-[#7C3AED]",
      textColor: "text-white",
    },
    {
      label: "Pending",
      value: pendingCount,
      border: "border-l-amber-500",
      textColor: "text-amber-400",
    },
    {
      label: "Recorded",
      value: recordedCount,
      border: "border-l-indigo-500",
      textColor: "text-indigo-400",
    },
    {
      label: "Posted",
      value: postedCount,
      border: "border-l-emerald-500",
      textColor: "text-emerald-400",
    },
    {
      label: "Added Today",
      value: addedTodayCount,
      border: "border-l-teal-400",
      textColor: "text-teal-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`bg-[#1A1D27] border border-[#2D3245] border-l-4 ${stat.border} rounded-xl p-3.5 shadow-md flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-150`}
        >
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {stat.label}
          </span>
          <span className={`text-2xl font-bold font-mono mt-1 ${stat.textColor}`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
