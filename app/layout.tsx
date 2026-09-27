import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/landing/navbar";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site-config";
import { Providers } from "./providers";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  // No explicit `weight`: that would pull four static cuts instead of the
  // single variable font, which covers the whole 100–900 range in one file.
  display: "swap",
});

export const metadata: Metadata = siteConfig;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} font-normal bg-(--background) text-(--foreground) antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
