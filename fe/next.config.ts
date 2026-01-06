import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    // Only run ESLint on these directories during builds
    dirs: ["src", "pages", "components", "lib", "app"],
    // Ignore ESLint errors during build (for deployment)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't run TypeScript checking during build if we have type errors
    ignoreBuildErrors: false,
  },
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Experimental features that might help with build performance
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
  // Optimize performance
  compress: true,
  poweredByHeader: false,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://static.cloudflareinsights.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https: blob:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https: wss: ws:; " +
              "media-src 'self' https: blob:; " +
              "object-src 'none'; " +
              "frame-ancestors 'self'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})(nextConfig as any) as NextConfig;
