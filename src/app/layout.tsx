import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Search } from "./components/search";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.";

export const metadata: Metadata = {
  title: "Podcasts Database",
  description: siteDescription,
  openGraph: {
    title: "Podcasts Database",
    description: siteDescription,
    url: "https://www.podcastsdatabase.com",
    siteName: "Podcasts Database",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Podcasts Database",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased mx-auto max-w-3xl p-8`}
      >
        <div className="flex justify-end mb-2">
          <Search />
        </div>
        {children}
        <Analytics />
        <Script src="https://cdn.palmframe.com/embed.js" strategy="lazyOnload" />
        {/* @ts-expect-error -- custom element */}
        <palmframe-widget project="podcastsdatabase" />
      </body>
    </html>
  );
}
