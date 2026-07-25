import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";
import { Reel, Status } from "./types";

export const db: Firestore = getFirestore(firebaseApp);
export const REELS_COLLECTION = "reels";

/**
 * Subscribes to real-time updates for all reels in Firestore.
 */
export function subscribeReels(
  onNext: (reels: Reel[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const reelsRef = collection(db, REELS_COLLECTION);
    const q = query(reelsRef, orderBy("addedDate", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const reels: Reel[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            instagramUrl: data.instagramUrl || "",
            thumbnail: data.thumbnail || "",
            username: data.username || "unknown",
            caption: data.caption || "",
            postedDate: data.postedDate || "Unknown",
            addedDate: data.addedDate || new Date().toISOString(),
            views: Number(data.views) || 0,
            likes: Number(data.likes) || 0,
            comments: Number(data.comments) || 0,
            shares: Number(data.shares) || 0,
            saves: Number(data.saves) || 0,
            category: data.category || "BuildWithSanny",
            status: data.status || "Pending",
            notes: data.notes || "",
            lastRefreshed: data.lastRefreshed || undefined,
          };
        });
        onNext(reels);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error("Error setting up Firestore listener:", error);
    if (onError && error instanceof Error) onError(error);
    return () => {};
  }
}

/**
 * Adds a new reel to Firestore.
 */
export async function addReel(reelData: Omit<Reel, "id">): Promise<string> {
  try {
    const reelsRef = collection(db, REELS_COLLECTION);
    const docRef = await addDoc(reelsRef, reelData);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add reel to Firestore:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to add reel doc to Firestore"
    );
  }
}

/**
 * Updates status of a reel document in Firestore.
 */
export async function updateReelStatus(id: string, status: Status): Promise<void> {
  try {
    const docRef = doc(db, REELS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Failed to update status in Firestore:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update status in Firestore"
    );
  }
}

/**
 * Updates notes of a reel document in Firestore.
 */
export async function updateReelNotes(id: string, notes: string): Promise<void> {
  try {
    const docRef = doc(db, REELS_COLLECTION, id);
    await updateDoc(docRef, { notes });
  } catch (error) {
    console.error("Failed to update notes in Firestore:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update notes in Firestore"
    );
  }
}

/**
 * Deletes a reel document from Firestore.
 */
export async function deleteReel(id: string): Promise<void> {
  try {
    const docRef = doc(db, REELS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete reel from Firestore:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete reel doc from Firestore"
    );
  }
}

/**
 * Updates live metrics (views, likes, comments, shares, saves, thumbnail, lastRefreshed)
 * for an existing reel document in Firestore.
 */
export async function updateReelMetrics(
  id: string,
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    thumbnail?: string;
    lastRefreshed?: string;
  }
): Promise<void> {
  try {
    const docRef = doc(db, REELS_COLLECTION, id);
    await updateDoc(docRef, {
      ...metrics,
      lastRefreshed: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update reel metrics in Firestore:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update reel metrics in Firestore"
    );
  }
}
