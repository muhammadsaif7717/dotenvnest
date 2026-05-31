import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/session";

const protectedRoutes = ["/", "/account"]; // Add more if needed
const authRoutes = ["/login", "/signup", "/verify"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isApiAuthRoute = pathname.startsWith("/api/login") || pathname.startsWith("/api/logout") || pathname.startsWith("/api/cli") || pathname.startsWith("/api/signup") || pathname.startsWith("/api/verify");

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

  // 3. Protect API routes (except login/logout)
  if (isApiRoute && !isApiAuthRoute && !isAuthenticated) {
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
