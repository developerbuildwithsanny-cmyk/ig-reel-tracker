import React from "react";
import { Status } from "@/lib/types";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export const statusColorMap: Record<Status, { bg: string; text: string; border: string }> = {
  Pending: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Recording: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Recorded: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  Posted: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Archived: {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
  Waste: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const styles = statusColorMap[status] || statusColorMap.Pending;
  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors duration-150 ${styles.bg} ${styles.text} ${styles.border} ${padding}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
}
