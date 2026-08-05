import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];
const protectedPrefixes = [
  "/dashboard",
  "/onboarding",
  "/admin",
  "/operator",
  "/partner",
];

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isProtected = protectedPrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isOperatorRoute =
    pathname === "/operator" || pathname.startsWith("/operator/");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "blocked");
      return NextResponse.redirect(url);
    }

    if (isAdminRoute) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);

      if (!roles?.length) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    if (isOperatorRoute) {
      const [{ data: adminRoles }, { data: operatorRoles }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .limit(1),
        supabase
          .from("operator_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("active", true)
          .limit(1),
      ]);

      if (!adminRoles?.length && !operatorRoles?.length) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/operator",
    "/operator/:path*",
    "/partner",
    "/partner/:path*",
    "/onboarding",
    "/login",
    "/register",
  ],
};
