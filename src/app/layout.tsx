import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Search } from "./components/search";
import { ThemeToggle } from "./components/theme-toggle";
import { LocaleSwitcher } from "./components/locale-switcher";
import { IntlayerClientProvider } from "next-intlayer";
import { getHTMLTextDir, getIntlayer } from "intlayer";
import { getLocale } from "next-intlayer/server";
export { generateStaticParams } from "next-intlayer";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.podcastsdatabase.com";
const LOCALES = ["en", "fr", "es"] as const;

function hreflangAlternates(path: string) {
  return {
    canonical: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
    languages: Object.fromEntries([
      ...LOCALES.map((l) => [l, `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}locale=${l}`]),
      ["x-default", path === "/" ? BASE_URL : `${BASE_URL}${path}`],
    ]),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = getIntlayer("layout", locale);

  return {
    metadataBase: new URL(BASE_URL),
    title: content.podcastsDatabase,
    description: content.everyEpisodeEveryWordSearchable,
    alternates: hreflangAlternates("/"),
    openGraph: {
      title: content.podcastsDatabase,
      description: content.everyEpisodeEveryWordSearchable,
      url: BASE_URL,
      siteName: "Podcasts Database",
      type: "website",
      locale: locale === "fr" ? "fr_FR" : locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary",
      title: content.podcastsDatabase,
      description: content.everyEpisodeEveryWordSearchable,
    },
  };
}

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
