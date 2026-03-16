import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Search } from "./components/search";
import { ThemeToggle } from "./components/theme-toggle";
import { LocaleSwitcher } from "./components/locale-switcher";
import { IntlayerClientProvider } from "next-intlayer";
import { getHTMLTextDir } from "intlayer";
import { getLocale } from "next-intlayer/server";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.podcastsdatabase.com"),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getHTMLTextDir(locale)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");if(t&&t!=="system")document.documentElement.setAttribute("data-theme",t)})()`,
          }}
        />
      </head>
      <IntlayerClientProvider defaultLocale={locale}>
        <body
          className={`${geistMono.variable} antialiased mx-auto max-w-3xl p-8`}
        >
          <div className="flex justify-end mb-2 gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
            <Search />
          </div>
          <main>{children}</main>
          <Analytics />
          <Script src="https://cdn.palmframe.com/embed.js" strategy="lazyOnload" />
          {/* @ts-expect-error -- custom element */}
          <palmframe-widget project="podcastsdatabase" />
        </body>
      </IntlayerClientProvider>
    </html>
  );
}
