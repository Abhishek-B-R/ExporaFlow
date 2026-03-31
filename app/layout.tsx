import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/landing/navbar";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site-config";
import { Providers } from "./providers";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = siteConfig;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} font-light`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
