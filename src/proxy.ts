import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/session";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
let cliRatelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: redisUrl,
      token: redisToken,
    }),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    ephemeralCache: new Map(),
    analytics: true,
  });
  
  cliRatelimit = new Ratelimit({
    redis: new Redis({
      url: redisUrl,
      token: redisToken,
    }),
    limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute for CLI
    ephemeralCache: new Map(),
    analytics: true,
  });
}

const protectedRoutes = ["/", "/account"]; // Add more if needed
const authRoutes = ["/login", "/signup", "/verify"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isApiAuthRoute = pathname.startsWith("/api/login") || pathname.startsWith("/api/logout") || pathname.startsWith("/api/signup") || pathname.startsWith("/api/verify") || pathname.startsWith("/api/resend-code");
  const isCliRoute = pathname.startsWith("/api/cli");

  if (ratelimit && isApiRoute) {
    const isAuthRateLimited = pathname.startsWith("/api/login") || 
                              pathname.startsWith("/api/signup") || 
                              pathname.startsWith("/api/verify") || 
                              pathname.startsWith("/api/resend-code");
                              
    if (isAuthRateLimited) {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
      
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            }
          }
        );
      }
    }
  }

  if (cliRatelimit && isCliRoute) {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    // We can also rate limit based on CLI Token if we want, but IP is easier for now
    const authHeader = request.headers.get("authorization");
    const cliToken = authHeader?.split(" ")[1] || ip;
    const { success, limit, reset, remaining } = await cliRatelimit.limit(`cli_ratelimit_${cliToken}`);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }
  }

  // Get token from cookie
  const token = request.cookies.get("dotenvnest_session")?.value;
  
  // Verify token
  const payload = await verifyJWT(token);
  const isAuthenticated = !!payload;

  // 1. Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from login page
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Protect API routes (except login/logout/cli)
  if (isApiRoute && !isApiAuthRoute && !isCliRoute && !isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
