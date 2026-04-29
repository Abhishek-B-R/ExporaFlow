import { Metadata } from "next";

const TITLE = "ExporaFlow - Explore your work, flow faster.";
const DESCRIPTION =
  "A modern issue tracker for teams: projects, issues, boards, and sprint planning—built to keep work flowing.";

// Update these when you deploy ExporaFlow.
const PREVIEW_IMAGE_URL = "https://exporaflow.vercel.app/opengraph-image.png";
const ALT_TITLE = "ExporaFlow - Explore your work, flow faster.";
const BASE_URL = "https://exporaflow.vercel.app";

export const siteConfig: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "ExporaFlow",
  creator: "abhitwt",
  twitter: {
    creator: "@abhitwt",
    title: TITLE,
    description: DESCRIPTION,
    card: "summary_large_image",
    images: [
      {
        url: PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: ALT_TITLE,
      },
    ],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "ExporaFlow",
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
  keywords: [
    "project management",
    "software development",
    "task tracking",
    "issue tracking",
    "agile workflows",
    "roadmap planning",
    "team collaboration",
    "developer tools",
    "modern workflows",
    "productivity tools",
    "sprint planning",
    "scrum management",
    "project dashboards",
    "workflow automation",
    "team communication",
    "kanban boards",
    "software lifecycle management",
    "bug tracking software",
    "resource allocation",
    "timeline management",
  ],
  metadataBase: new URL(BASE_URL),
};
