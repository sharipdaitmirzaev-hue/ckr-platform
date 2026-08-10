import { isStaffAdminPath } from "@/config/staff";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];
const protectedPrefixes = [
  "/dashboard",
  "/onboarding",
  "/admin",
  "/operator",
  "/partner",
  "/messages",
];

const PRODUCTION_ORIGIN = "https://ckr-center.ru";

/**
 * Next.js behind nginx on 127.0.0.1:3000 may build nextUrl with host
 * localhost:3000. Never send users there in production.
 */
function appOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (
    fromEnv &&
    !/localhost/i.test(fromEnv) &&
    !/127\.0\.0\.1/.test(fromEnv)
  ) {
    return fromEnv;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";

  if (
    host &&
    !/localhost/i.test(host) &&
    !/127\.0\.0\.1/.test(host)
  ) {
    return `${proto}://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }

  return request.nextUrl.origin;
}

function redirectPath(
  request: NextRequest,
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const url = new URL(pathname, `${appOrigin(request)}/`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

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
    return redirectPath(request, "/login", { next: pathname });
  }

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      return redirectPath(request, "/login", { error: "blocked" });
    }

    if (isAdminRoute) {
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

      const isAdmin = Boolean(adminRoles?.length);
      const isOperator = Boolean(operatorRoles?.length);

      if (!isAdmin) {
        if (
          isOperator &&
          (pathname === "/admin" || pathname === "/admin/")
        ) {
          return redirectPath(request, "/admin/crm");
        }

        if (!(isOperator && isStaffAdminPath(pathname))) {
          return redirectPath(
            request,
            isOperator ? "/operator" : "/dashboard",
          );
        }
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
        return redirectPath(request, "/dashboard");
      }
    }
  }

  if (user && isAuthRoute) {
    return redirectPath(request, "/dashboard");
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
    "/messages",
    "/messages/:path*",
    "/onboarding",
    "/login",
    "/register",
  ],
};
