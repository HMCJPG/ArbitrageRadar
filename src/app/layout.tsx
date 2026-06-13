import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ArbitrageRadar — Product Trend Intelligence",
  description:
    "Cross-platform trend intelligence supercenter. Track demand velocity (Δv) and acceleration (Δ²v) across TikTok, Instagram, Amazon and Google to surface breakout dropshipping products before they saturate.",
  applicationName: "ArbitrageRadar",
  keywords: [
    "dropshipping",
    "product research",
    "trend analysis",
    "ecommerce arbitrage",
    "tiktok trends",
  ],
  authors: [{ name: "ArbitrageRadar" }],
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">{children}</body>
    </html>
  );
}
