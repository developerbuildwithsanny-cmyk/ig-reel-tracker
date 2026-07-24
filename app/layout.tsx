import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelTracker - Instagram Reel Tracker Dashboard",
  description: "Production-ready Instagram Reel analytics and production tracking dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[#0F1117] text-white min-h-screen antialiased selection:bg-[#7C3AED]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
