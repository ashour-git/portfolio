import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible_Next, Bodoni_Moda, JetBrains_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { ThemeInit } from "@/components/theme-init";
import { CommandPalette } from "@/components/command-palette";
import { CopilotLoader } from "@/components/copilot-loader";
import { MotionProvider } from "@/components/motion-provider";
import { Footer } from "@/components/footer";
import "./globals.css";

// Prose: Atkinson Hyperlegible keeps identifiers like GPT-4o, l/1/I unambiguous.
const sans = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});

// Plate voice: a modern serif in the line of 19th-century science plates
// and engraved instrument drawings. Headlines only.
const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-bodoni",
  display: "swap",
});

// Measurement voice: code, coordinates, numbers, the terminal.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jbm",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mohamed Ashour | AI Engineer",
    template: "%s · Mohamed Ashour",
  },
  description:
    "Mohamed Ashour, AI Engineer building production LLM applications, RAG systems, recommendation engines, computer vision, and forecasting. Shipped end-to-end, tested, and measured.",
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
    siteName: "Mohamed Ashour | AI Engineer",
    title: "Mohamed Ashour | AI Engineer",
    description:
      "Production AI systems: LLMs, RAG, computer vision, MLOps, and data engineering.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Mohamed Ashour, building production AI systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamed Ashour | AI Engineer",
    description:
      "Production AI systems: LLMs, RAG, computer vision, MLOps, and data engineering.",
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
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg text-ink antialiased">
        <CopilotLoader />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        <MotionProvider>
          <CommandPalette />
          {children}
        </MotionProvider>
        <Footer />
      </body>
    </html>
  );
}