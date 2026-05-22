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
});

export const metadata: Metadata = siteConfig;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-normal bg-(--background) text-(--foreground) antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
