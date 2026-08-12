import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { IDEA_FORM } from "@/config/idea-first";
import { decodeClaimCookie } from "@/lib/idea-first/security";
import { updatePublicIdeaContact } from "@/lib/idea-first/submit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const jar = cookies();
  const claim = decodeClaimCookie(jar.get(IDEA_FORM.claimCookie)?.value);
  if (!claim) {
    return NextResponse.json(
      { error: "Сессия идеи истекла. Отправьте идею ещё раз." },
      { status: 400 },
    );
  }

  const result = await updatePublicIdeaContact({
    requestId: claim.requestId,
    claimToken: claim.token,
    phone: String(body.phone || ""),
    email: String(body.email || ""),
    telegram: String(body.telegram || ""),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
