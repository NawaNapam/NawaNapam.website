import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { pageRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// Admin route handler
async function handleAdminRoutes(req: NextRequest) {
  const isAdminLoginPage = req.nextUrl.pathname === "/admin/login";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  // Check admin session
  const adminSession = req.cookies.get("admin_session")?.value;

  // If on admin route (not login) without session, redirect to login
  if (isAdminRoute && !isAdminLoginPage && !adminSession) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // If on admin login with session, redirect to dashboard
  if (isAdminLoginPage && adminSession) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return null; // Continue to next middleware
}

export default withAuth(
  async function middleware(req) {
    // Handle admin routes first
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const adminResponse = await handleAdminRoutes(req);
      if (adminResponse) return adminResponse;

      // Apply rate limiting for admin routes
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

      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
      return response;
    }

    // User routes handling
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
        // Skip auth check for admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return true;
        }

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
  },
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
    "/admin/:path*",
    // Add other protected routes
  ],
};
