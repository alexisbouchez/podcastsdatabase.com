import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Search } from "./components/search";
import { ThemeToggle } from "./components/theme-toggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://www.podcastsdatabase.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Podcasts Database",
  description: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Podcasts Database",
    description: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
    url: BASE_URL,
    siteName: "Podcasts Database",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Podcasts Database",
    description: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");if(t&&t!=="system")document.documentElement.setAttribute("data-theme",t)})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased mx-auto max-w-3xl p-8`}>
        <div className="flex justify-end mb-2 gap-3">
          <ThemeToggle />
          <Search />
        </div>
        <main>{children}</main>
        <Analytics />
        <Script src="https://cdn.palmframe.com/embed.js" strategy="lazyOnload" />
        {/* @ts-expect-error -- custom element */}
        <palmframe-widget project="podcastsdatabase" />
      </body>
    </html>
  );
}
