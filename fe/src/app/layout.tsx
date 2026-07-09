import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { WebVitals } from "@/components/custom/WebVitals";

// Inter substitutes Haas Grotesk / Haas Groot Disp per DESIGN.md's documented fallback
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "NawaNapam ",
  description: "Instant, anonymous, global video chat rooted in culture.",
  manifest: "/manifest.json",
  openGraph: {
    title: "NawaNapam",
    description: "Instant, anonymous, global video chat rooted in culture.",
    url: "https://nawanapam.com",
    siteName: "NawaNapam",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NawaNapam",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/icons/manifest-icon-192.maskable.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <WebVitals />
        <Provider>
          {children}
          <Analytics />
        </Provider>
        <Toaster position="top-center" theme="system" richColors />
      </body>
    </html>
  );
}
