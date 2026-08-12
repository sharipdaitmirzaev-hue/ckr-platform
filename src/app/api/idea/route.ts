import { NextResponse } from "next/server";
import { IDEA_FORM } from "@/config/idea-first";
import {
  encodeClaimCookie,
} from "@/lib/idea-first/security";
import {
  submitPublicIdea,
  updatePublicIdeaContact,
} from "@/lib/idea-first/submit";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xf || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const action = String(body.action || "submit");

  if (action === "contact") {
    const requestId = String(body.requestId || "");
    const claimToken = String(body.claimToken || "");
    if (!requestId || !claimToken) {
      return NextResponse.json({ error: "Нет данных обращения." }, { status: 400 });
    }
    const result = await updatePublicIdeaContact({
      requestId,
      claimToken,
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      telegram: String(body.telegram || ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const result = await submitPublicIdea({
    name: String(body.name || ""),
    idea: String(body.idea || ""),
    phone: String(body.phone || ""),
    email: String(body.email || ""),
    telegram: String(body.telegram || ""),
    idempotencyKey: String(body.idempotencyKey || "") || undefined,
    ip: clientIp(req),
  });

  if (!result.ok) {
    const status = result.code === "rate_limited" ? 429 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const res = NextResponse.json({
    ok: true,
    requestId: result.requestId,
    name: result.name,
    alreadyExists: result.alreadyExists,
  });

  // HttpOnly claim cookie — used after registration; token not shown in UI logs
  const cookieVal = encodeClaimCookie({
    requestId: result.requestId,
    token: result.claimToken,
    name: result.name,
  });
  res.cookies.set(IDEA_FORM.claimCookie, cookieVal, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: IDEA_FORM.claimHours * 3600,
  });

  return res;
}
