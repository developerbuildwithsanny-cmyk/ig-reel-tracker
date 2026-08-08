"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Reel, ReelFilterOptions } from "@/lib/types";
import { subscribeReels } from "@/lib/firestore";
import AddReelForm from "@/components/AddReelForm";
import StatsBar from "@/components/StatsBar";
import FilterBar from "@/components/FilterBar";
import ReelsTable from "@/components/ReelsTable";
import ReelCard from "@/components/ReelCard";
import AnalyticsPanel from "@/components/AnalyticsPanel";

export default function DashboardPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Filter and Sort State
  const [filters, setFilters] = useState<ReelFilterOptions>({
    searchQuery: "",
    category: "All",
    status: "All",
    sortBy: "newest",
    dateFilter: "",
  });

  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);

  // Syncing State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const BATCH_SIZE = 30;
  const [showSyncMenu, setShowSyncMenu] = useState<boolean>(false);

  // Compute batches based on all current reels
  const syncBatches = useMemo(() => {
    const batches = [];
    for (let i = 0; i < reels.length; i += BATCH_SIZE) {
      batches.push(reels.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }, [reels]);

  // Real-time Firestore onSnapshot Subscription
  useEffect(() => {
    setIsLoading(true);
    setFirestoreError(null);

    const unsubscribe = subscribeReels(
      (snapshotReels) => {
        setReels(snapshotReels);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        setFirestoreError("Failed to connect to Firestore. Check your Firebase environment configuration.");
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter and Sort Reels client-side on snapshot data
  const filteredAndSortedReels = useMemo(() => {
    let result = [...reels];

    // 1. Search Query Filter (Username + Caption)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.username.toLowerCase().includes(q) ||
          r.caption.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (filters.category !== "All") {
      result = result.filter((r) => r.category === filters.category);
    }

    // 3. Status Filter
    if (filters.status !== "All") {
      result = result.filter((r) => r.status === filters.status);
    }

    // 3.5. Date Filter (matches YYYY-MM-DD on addedDate or postedDate) in Asia/Kolkata timezone
    if (filters.dateFilter) {
      result = result.filter((r) => {
        const addedKolkata = getKolkataDateString(r.addedDate);
        const postedKolkata = getKolkataDateString(r.postedDate);
        return addedKolkata === filters.dateFilter || postedKolkata === filters.dateFilter;
      });
    }

    // 4. Sort Options
    result.sort((a, b) => {
      if (filters.sortBy === "highestViews") {
        return b.views - a.views;
      }
      if (filters.sortBy === "highestLikes") {
        return b.likes - a.likes;
      }
      if (filters.sortBy === "highestEngagement") {
        const safeM = (n: number) => (n === -1 ? 0 : n);
        const engA = safeM(a.likes) + safeM(a.comments) + safeM(a.shares) + safeM(a.saves);
        const engB = safeM(b.likes) + safeM(b.comments) + safeM(b.shares) + safeM(b.saves);
        return engB - engA;
      }
      // Default: "newest" (addedDate descending)
      const dateA = new Date(a.addedDate).getTime();
      const dateB = new Date(b.addedDate).getTime();
      return dateB - dateA;
    });

    return result;
  }, [reels, filters]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      category: "All",
      status: "All",
      sortBy: "newest",
      dateFilter: "",
    });
    setSelectedReelId(null);
  };

  const handleSyncSpecificBatch = async (batchIndex: number) => {
    setIsSyncing(true);
    const batch = syncBatches[batchIndex];
    const start = batchIndex * BATCH_SIZE + 1;
    const end = Math.min((batchIndex + 1) * BATCH_SIZE, reels.length);
    setSyncStatusMsg(`Syncing Batch ${batchIndex + 1} (Reels ${start}-${end})...`);
    
    try {
      const payload = {
        reels: batch.map(r => ({ id: r.id, instagramUrl: r.instagramUrl }))
      };

      const res = await fetch("/api/sync-reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.details || data.error || "Sync failed");
      }
      
      setSyncStatusMsg(`Successfully synced Batch ${batchIndex + 1}! Updated ${data.updated} reels.`);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err) {
      console.error("Batch sync error:", err);
      setSyncStatusMsg(err instanceof Error ? err.message : "Sync failed.");
      setTimeout(() => setSyncStatusMsg(null), 8000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllBatched = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Starting full batched sync...");
    let totalUpdated = 0;
    let totalProcessed = 0;

    try {
      for (let i = 0; i < syncBatches.length; i++) {
        const batch = syncBatches[i];
        const batchNum = i + 1;
        const total = syncBatches.length;
        const start = i * BATCH_SIZE + 1;
        const end = Math.min((i + 1) * BATCH_SIZE, reels.length);
        
        setSyncStatusMsg(`Syncing Batch ${batchNum} of ${total} (Reels ${start}-${end})...`);
        
        const payload = {
          reels: batch.map(r => ({ id: r.id, instagramUrl: r.instagramUrl }))
        };

        const res = await fetch("/api/sync-reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.details || data.error || `Sync failed at Batch ${batchNum}`);
        }
        
        totalUpdated += data.updated;
        totalProcessed += data.processedCount;
      }
      
      setSyncStatusMsg(`Successfully synced all reels! Processed: ${totalProcessed}, Updated: ${totalUpdated}`);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err) {
      console.error("Bulk sync error:", err);
      setSyncStatusMsg(err instanceof Error ? err.message : "Sync failed.");
      setTimeout(() => setSyncStatusMsg(null), 8000);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedReel = useMemo(() => {
    if (!selectedReelId) return null;
    return reels.find((r) => r.id === selectedReelId) || null;
  }, [reels, selectedReelId]);

  return (
    <main className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center">
      {/* 1. TOPBAR */}
      <header className="w-full border-b border-[#2D3245] bg-[#1A1D27]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-purple-400 flex items-center justify-center text-white shadow-lg shadow-[#7C3AED]/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zM10.5 8.25l5.25 3.75-5.25 3.75V8.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ReelTracker
                <span className="text-[10px] font-semibold bg-[#7C3AED]/20 text-purple-300 px-2 py-0.5 rounded-full border border-[#7C3AED]/40 uppercase tracking-widest">
                  MVP
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex rounded-full bg-gradient-to-r from-[#7C3AED] to-purple-500 hover:from-[#6D28D9] hover:to-purple-600 shadow-md shadow-[#7C3AED]/20">
              {/* Main Button: Sync All (Auto-Batched) */}
              <button
                onClick={handleSyncAllBatched}
                disabled={isSyncing || reels.length === 0}
                className="text-white text-xs font-semibold pl-4 pr-3 py-2 rounded-l-full transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-r border-white/10"
                title="Sync all reels in batches of 30 to prevent timeout"
              >
                {isSyncing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span>Sync Reels 🔄</span>
                  </>
                )}
              </button>

              {/* Dropdown Toggle Button */}
              <button
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                disabled={isSyncing || reels.length === 0}
                className="text-white px-2.5 py-2 rounded-r-full transition-all duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-black/10"
                title="Select a specific batch to sync"
              >
                <svg
                  className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showSyncMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showSyncMenu && (
                <>
                  {/* Invisible overlay to close on click outside */}
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowSyncMenu(false)}
                  />
                  <div className="absolute right-0 top-11 mt-1 w-64 bg-[#1A1D27] border border-[#2D3245] rounded-xl shadow-2xl z-50 py-2 divide-y divide-[#2D3245]/50 animate-in fade-in duration-150">
                    <div className="px-3.5 py-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                        Batch Action
                      </span>
                      <button
                        onClick={() => {
                          setShowSyncMenu(false);
                          handleSyncAllBatched();
                        }}
                        className="w-full text-left text-xs text-white hover:text-purple-300 py-1.5 flex items-center justify-between"
                      >
                        <span>Sync All ({reels.length} reels in {syncBatches.length} batches)</span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                          Auto
                        </span>
                      </button>
                    </div>
                    {syncBatches.length > 0 && (
                      <div className="px-3.5 py-2 max-h-60 overflow-y-auto">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Manual Batches ({BATCH_SIZE} per batch)
                        </span>
                        {syncBatches.map((batch, index) => {
                          const start = index * BATCH_SIZE + 1;
                          const end = Math.min((index + 1) * BATCH_SIZE, reels.length);
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                setShowSyncMenu(false);
                                handleSyncSpecificBatch(index);
                              }}
                              className="w-full text-left text-xs text-gray-300 hover:text-white py-1.5 px-1 hover:bg-[#2D3245]/30 rounded transition-colors flex items-center justify-between"
                            >
                              <span>Batch {index + 1}</span>
                              <span className="font-mono text-[10px] text-gray-500">
                                Reels {start} - {end}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="bg-[#0F1117] border border-[#2D3245] rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-400">Total Reels:</span>
              <span className="font-mono font-bold text-white">{reels.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between transition-all duration-300 ${
            syncStatusMsg.toLowerCase().includes("failed") || syncStatusMsg.toLowerCase().includes("error")
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : isSyncing
              ? "bg-purple-500/10 border border-purple-500/30 text-purple-300"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          }`}>
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <span className="text-base">ℹ️</span>
              )}
              <span>{syncStatusMsg}</span>
            </div>
          </div>
        )}
        {/* Connection Error Banner */}
        {firestoreError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{firestoreError}</span>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col">
          {/* 2. ADD REEL PANEL */}
          <AddReelForm />

          {/* 3. STATS BAR */}
          <StatsBar reels={reels} />

          {/* 4. FILTER BAR - Sticky Row Card */}
          <div className="sticky top-16 z-20 bg-[#0F1117] py-2">
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              resultCount={filteredAndSortedReels.length}
              totalCount={reels.length}
            />
          </div>

          {/* 5. REELS TABLE & DETAIL CARD SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 items-start w-full lg:sticky lg:top-[170px] z-10">
            <div className="lg:col-span-3">
              <ReelsTable
                reels={filteredAndSortedReels}
                isLoading={isLoading}
                selectedReelId={selectedReelId}
                onSelectReel={setSelectedReelId}
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
            <div className="lg:col-span-1">
              {selectedReel ? (
                <div className="relative">
                  {/* Deselect / Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedReelId(null)}
                    className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 transition-all"
                    title="Close Details"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ReelCard reel={selectedReel} />
                </div>
              ) : (
                <div className="bg-[#1A1D27]/50 border border-[#2D3245]/50 border-dashed rounded-xl p-8 text-center text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-500 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <h4 className="font-semibold text-white text-sm mb-1">No Reel Selected</h4>
                  <p className="text-xs">
                    Click "View Card" or any row in the table to display metrics, update status, and add notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. ANALYTICS PANEL */}
        <AnalyticsPanel reels={reels} />
      </div>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#2D3245]/60 bg-[#0F1117] py-4 text-center text-xs text-gray-500">
        ReelTracker Dashboard &copy; {new Date().getFullYear()} &bull; Built with Next.js 14, Tailwind & Firebase
      </footer>
    </main>
  );
}

// Helper to convert UTC date strings to Kolkata timezone date string (YYYY-MM-DD)
function getKolkataDateString(isoStr: string): string {
  if (!isoStr || isoStr === "Unknown") return "";
  try {
    const d = new Date(isoStr);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d); // Returns "YYYY-MM-DD"
  } catch {
    return "";
  }
}
