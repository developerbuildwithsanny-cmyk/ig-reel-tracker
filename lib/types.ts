export type Category = "BuildWithSanny" | "ScaleWithSanny" | "JobHunt10x";

export type Status = "Pending" | "Recording" | "Recorded" | "Posted" | "Archived" | "Waste";

export interface Reel {
  id: string;
  instagramUrl: string;
  thumbnail: string;
  username: string;
  caption: string;
  postedDate: string;
  addedDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  category: Category;
  status: Status;
  notes: string;
  /** ISO timestamp of the last time metrics were synced from Apify */
  lastRefreshed?: string;
}

export type SortOption = "newest" | "highestViews" | "highestLikes" | "highestEngagement";

export interface ReelFilterOptions {
  searchQuery: string;
  category: Category | "All";
  status: Status | "All";
  sortBy: SortOption;
  dateFilter?: string;
}
