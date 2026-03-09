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

export const metadata: Metadata = {
  title: "Podcasts Database",
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
        <Script src="https://www.palmframe.com/embed.js" strategy="lazyOnload" />
        {/* @ts-expect-error -- custom element */}
        <palmframe-widget project="podcastsdatabase" />
      </body>
    </html>
  );
}
