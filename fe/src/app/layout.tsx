import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // renamed for clarity
import { Cinzel_Decorative } from "next/font/google"; // ← ADD THIS
import "./globals.css";
import Provider from "./Provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// Your existing fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ADD THIS: Cinzel Decorative (perfect for "NawaNapam")
const cinzelDecorative = Cinzel_Decorative({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel", // CSS variable to use anywhere
  display: "swap",
});

export const metadata: Metadata = {
  title: "NawaNapam ",
  description: "Instant, anonymous, global video chat rooted in culture.",
  manifest: "/manifest.json",
  openGraph: {
    title: "NawaNapam ",
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
    icon: "/icons/manifest-icon-192.maskable.png",
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzelDecorative.variable} antialiased font-sans`}
      >
        <Provider>
          {children}
          <Analytics />
        </Provider>
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
