import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
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

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mohamed Ashour — AI Engineer",
    template: "%s · Mohamed Ashour",
  },
  description:
    "AI Engineer building production LLM applications, RAG systems, recommendation engines, computer vision, and MLOps pipelines. Proven, shipped, end-to-end AI.",
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
  },
  twitter: {
    card: "summary",
    title: "Mohamed Ashour — AI Engineer",
    description:
      "Building production AI. LLMs · RAG · Computer Vision · MLOps · Data Engineering.",
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg text-ink antialiased">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-glow" aria-hidden="true" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}