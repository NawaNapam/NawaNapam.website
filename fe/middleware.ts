import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { pageRateLimiter, getClientIdentifier } from "@/lib/rate-limit";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/signup") ||
      req.nextUrl.pathname.startsWith("/complete-profile");

    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const { success, limit, remaining, reset } =
      await pageRateLimiter.limit(identifier);

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }

    // Add rate limit headers to all responses
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    // Redirect authenticated users away from auth pages
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage =
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/signup");

        // Allow access to auth pages if not logged in
        if (isAuthPage) {
          return true;
        }

        // Require token for protected pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/profile/:path*",
    "/dashboard",
    "/chat",
    "/chat/:path*",
    // Add other protected routes
  ],
};
