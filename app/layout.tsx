import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Must follow globals.css: it resets html and body to height auto, which the
// h-full and min-h-full on those elements would otherwise defeat.
import "lenis/dist/lenis.css";
import { SiteShell } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteTransition } from "@/components/motion/route-transition";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0038a8",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Civica: Philippine Government Data, Made Easier to Understand",
    template: "%s · Civica",
  },
  description:
    "Explore Philippine budgets, legislation, and government datasets in one accessible place.",
  metadataBase: SITE_URL,
  openGraph: {
    title: "Civica",
    description: "Philippine government data, made easier to understand.",
    type: "website",
    locale: "en_PH",
    siteName: "Civica",
  },
  twitter: {
    card: "summary",
    title: "Civica",
    description: "Philippine government data, made easier to understand.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen font-sans text-ink">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll />
        <SiteShell>
          <main id="main" tabIndex={-1} className="flex-1">
            <RouteTransition>{children}</RouteTransition>
          </main>
          <Footer />
        </SiteShell>
      </body>
    </html>
  );
}
