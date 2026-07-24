import React from "react";
import { Category } from "@/lib/types";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export const categoryColorMap: Record<Category, { bg: string; text: string; border: string }> = {
  BuildWithSanny: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  ScaleWithSanny: {
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    border: "border-teal-500/30",
  },
  JobHunt10x: {
    bg: "bg-orange-500/15",
    text: "text-orange-300",
    border: "border-orange-500/30",
  },
};

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const styles = categoryColorMap[category] || categoryColorMap.BuildWithSanny;
  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors duration-150 ${styles.bg} ${styles.text} ${styles.border} ${padding}`}
    >
      #{category}
    </span>
  );
}
