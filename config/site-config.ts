import { Metadata } from "next";
import { brand } from "@/config/brand";

const TITLE = brand.tagline ? `${brand.name} — ${brand.tagline}` : brand.name;
const DESCRIPTION = brand.tagline;

/**
 * Canonical origin. Read from the deployment's own URL rather than a
 * hard-coded host, so a self-hosted install does not advertise someone else's
 * domain in its canonical link and OG tags.
 */
const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const PREVIEW_IMAGE_URL = `${BASE_URL.replace(/\/$/, "")}/opengraph-image.png`;
const ALT_TITLE = TITLE;

export const siteConfig: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: brand.name,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: brand.name,
    url: BASE_URL,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: ALT_TITLE,
      },
    ],
  },
  category: "Technology",
  alternates: {
    canonical: BASE_URL,
  },
  // Internal tool: keep it out of search results.
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL(BASE_URL),
};
