import { getCurrentUser } from "@/lib/auth/get-current-user";
import { NextResponse } from "next/server";

/**
 * API-guard для OI. Этап 1: только platform admin.
 * Позже сюда же добавится роль OWNER без смены роутов.
 */
export async function withOiOwner<T>(
  handler: (userId: string) => Promise<T>,
): Promise<NextResponse> {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Требуется вход", stubMode: true },
        { status: 401 },
      );
    }
    if (!current.roles.includes("admin")) {
      // Future: also allow OWNER role
      return NextResponse.json(
        { ok: false, error: "Недостаточно прав (owner/admin)", stubMode: true },
        { status: 403 },
      );
    }
    if (current.profile.is_blocked) {
      return NextResponse.json(
        { ok: false, error: "Аккаунт заблокирован", stubMode: true },
        { status: 403 },
      );
    }

    const data = await handler(current.user.id);
    return NextResponse.json({ ok: true, data, stubMode: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка Opportunity Intelligence";
    return NextResponse.json(
      { ok: false, error: message, stubMode: true },
      { status: 400 },
    );
  }
}
