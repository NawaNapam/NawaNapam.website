"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(metric);
    }

    // Send to analytics in production
    // The Vercel Analytics component will handle this automatically
  });

  return null;
}
