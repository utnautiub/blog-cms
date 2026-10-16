import "@/styles/globals.css";

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";

import { SoundProvider } from "@/components/sound-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  AUTHOR_NAME,
  TWITTER_HANDLE,
} from "@/config/site";

const defaultTitle = `${SITE_NAME} — Góc viết của ${AUTHOR_NAME}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": `${SITE_URL}atom.xml`,
      "application/rss+xml": `${SITE_URL}rss.xml`,
    },
  },
  title: { default: defaultTitle, template: `%s | ${AUTHOR_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "vi_VN",
    type: "website",
    images: [`${SITE_URL}og/home`],
  },
  robots: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  twitter: {
    title: SITE_NAME,
    card: "summary_large_image",
    creator: TWITTER_HANDLE || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <SoundProvider />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
