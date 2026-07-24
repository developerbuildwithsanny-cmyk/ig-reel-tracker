# Instagram Reel Tracker Dashboard (MVP)

A production-ready Next.js 14 web application to scrape, track, organize, and analyze Instagram Reels with real-time Firebase Firestore updates.

---

## Features

- **Apify Instagram Scraper Integration**: Enter any public Instagram Reel URL to auto-fetch video thumbnail, username, caption, post timestamp, views, likes, comments, shares, and saves.
- **Real-Time Database Sync**: Subscribes directly to Firebase Firestore via `onSnapshot` so updates reflect instantly.
- **Status & Category Management**:
  - **Statuses**: `Pending` (Amber), `Recording` (Blue), `Recorded` (Indigo), `Posted` (Green), `Archived` (Gray), `Waste` (Red).
  - **Categories**: `BuildWithSanny` (Purple), `ScaleWithSanny` (Teal), `JobHunt10x` (Orange).
- **Inline Editing**: Quick status selector and auto-saving notes textarea (saves on `blur`).
- **Client-Side Search & Filtering**: Instant search across usernames and captions, category & status dropdown filters, and sorting (Newest Added, Highest Views, Highest Likes, Highest Engagement).
- **Interactive Analytics**: Collapsible bottom panel showing Top 3 Most Viewed, Top 3 Most Liked, Top 3 Highest Engagement reels, Category breakdown, and Daily Velocity metrics.
- **Dark Mode UI**: Custom sleek design matching `#0F1117` background with `#7C3AED` electric violet accents.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Scraper**: Apify Instagram Scraper API (`apify/instagram-scraper`)
- **Typography**: Inter via `next/font/google`
- **Language**: TypeScript

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the root directory (copy from `.env.example`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

APIFY_API_TOKEN=your_apify_api_token
```

---

## Apify Actor Configuration Guide

To enable live metadata scraping:

1. Create a free account at [Apify](https://apify.com).
2. Go to **Settings -> Integrations -> API Tokens** and copy your API Token.
3. Add the token to `APIFY_API_TOKEN` in `.env.local`.
4. The dashboard routes requests to Apify's [`apify/instagram-scraper`](https://apify.com/apify/instagram-scraper) actor with the input:
   ```json
   {
     "directUrls": ["https://www.instagram.com/reel/..."],
     "resultsType": "posts",
     "resultsLimit": 1
   }
   ```

---

## Firebase Firestore Collection Setup

1. In your Firebase Console, create a Firestore database.
2. Ensure a collection named `reels` exists (or let the app auto-create it when adding your first reel).
3. Recommended Firestore Rules for single-user MVP:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /reels/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Building for Production

```bash
npm run build
npm run start
```
