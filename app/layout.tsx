import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { ThemeInit } from "@/components/theme-init";
import { CommandPalette } from "@/components/command-palette";
import { CursorGlow } from "@/components/cursor-glow";
import { Splash } from "@/components/splash";
import { Footer } from "@/components/footer";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-serif",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mohamed Ashour — AI Engineer",
    template: "%s · Mohamed Ashour",
  },
  description:
    "Mohamed Ashour — AI Engineer building production LLM applications, RAG systems, recommendation engines, computer vision, and forecasting. Shipped end-to-end, tested, and measured.",
  keywords: [
    "AI Engineer",
    "Machine Learning Engineer",
    "LLM",
    "RAG",
    "MLOps",
    "Computer Vision",
    "Recommendation Systems",
    "Deep Learning",
    "Mohamed Ashour",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Mohamed Ashour — AI Engineer",
    title: "Mohamed Ashour — AI Engineer",
    description:
      "Building production AI. LLMs · RAG · Computer Vision · MLOps · Data Engineering.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Mohamed Ashour — Building production AI systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamed Ashour — AI Engineer",
    description:
      "Building production AI. LLMs · RAG · Computer Vision · MLOps · Data Engineering.",
    images: [`${siteUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mohamed Ashour",
  jobTitle: "AI Engineer",
  url: siteUrl,
  sameAs: [
    "https://www.linkedin.com/in/mohamedashour-ai",
    "https://github.com/ashour-git",
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "Large Language Models",
    "RAG",
    "MLOps",
    "Machine Learning Engineering",
    "Computer Vision",
    "Recommendation Systems",
    "Deep Learning",
    "Data Engineering",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <head>
        <ThemeInit />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg text-ink antialiased">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-glow" aria-hidden="true" />
        <CursorGlow />
        <Splash />
        <CommandPalette />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        {children}
        <Footer />
      </body>
    </html>
  );
}