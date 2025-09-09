import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths and static assets (allow public GeoJSON and other static files)
  const publicPaths = ["/login", "/signup", "/post-login", "/api/auth", "/", "/forgot-password", "/reset-password", "/select-role"];
  const isStatic = pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(geojson|json|png|svg|jpg|jpeg|gif|css|js|map|ico)$/.test(pathname);

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p)) || isStatic) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === "production" 
        ? "__Secure-electric-grid.session-token" 
        : "electric-grid.session-token"
    });
    
    const role = typeof (token as any)?.role === "string" ? (token as any).role.toLowerCase() : null;
    
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Role-based protection
    // Admin dashboard area
    if (pathname.startsWith("/dashboard/admin")) {
      if (role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard/user";
        return NextResponse.redirect(url);
      }
    }

    // User dashboard area
    if (pathname.startsWith("/dashboard/user")) {
      if (role === "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard/admin";
        return NextResponse.redirect(url);
      }
      if (role !== "user") {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }

    // Root dashboard path: redirect based on role
    if (pathname === "/dashboard") {
      const url = req.nextUrl.clone();
      if (role === "admin") {
        url.pathname = "/dashboard/admin";
      } else {
        url.pathname = "/dashboard/user";
      }
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // If there's an error with the token, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


