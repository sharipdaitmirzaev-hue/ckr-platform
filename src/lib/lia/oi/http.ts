import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { NextResponse } from "next/server";

/**
 * Этап 1/2A: platform admin.
 * Future: добавить роль OWNER без смены роутов API/UI.
 */
export function canAccessOiOwner(roles: string[]): boolean {
  return roles.includes("admin");
  // Future: return roles.includes("admin") || roles.includes("owner");
}

/**
 * API-guard для OI. Этап 1/2A: только platform admin.
 * Позже сюда же добавится роль OWNER без смены роутов.
 */
export async function withOiOwner<T>(
  handler: (userId: string) => Promise<T>,
): Promise<NextResponse> {
  const mode = resolveOiSearchMode();
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          error: "Требуется вход",
          stubMode: mode.mode === "stub",
          searchMode: mode.mode,
        },
        { status: 401 },
      );
    }
    if (!canAccessOiOwner(current.roles)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Недостаточно прав (owner/admin)",
          stubMode: mode.mode === "stub",
          searchMode: mode.mode,
        },
        { status: 403 },
      );
    }
    if (current.profile.is_blocked) {
      return NextResponse.json(
        {
          ok: false,
          error: "Аккаунт заблокирован",
          stubMode: mode.mode === "stub",
          searchMode: mode.mode,
        },
        { status: 403 },
      );
    }

    const data = await handler(current.user.id);
    return NextResponse.json({
      ok: true,
      data,
      stubMode: mode.mode === "stub",
      searchMode: mode.mode,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка Opportunity Intelligence";
    // Не включаем сырые секреты в ответ
    const safe =
      message.includes("API") && message.toLowerCase().includes("key")
        ? "Ошибка внешнего поиска"
        : message;
    return NextResponse.json(
      {
        ok: false,
        error: safe,
        stubMode: mode.mode === "stub",
        searchMode: mode.mode,
      },
      { status: 400 },
    );
  }
}
