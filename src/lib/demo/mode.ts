/**
 * Demo mode ЦКР — безопасный показ каталогов инвесторам и партнёрам.
 * NEXT_PUBLIC_DEMO_MODE=true включает баннер и маскирование личных данных для гостей.
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/** Использовать встроенный demo-каталог, если БД пуста или нет Supabase. */
export function useDemoCatalogFallback(): boolean {
  return (
    isDemoMode() ||
    process.env.DEMO_CATALOG_FALLBACK !== "false"
  );
}

export const DEMO_PARTICIPANT_LABEL = "Участник ЦКР";

/** Маскирует имя для гостей / demo-показа. */
export function maskDisplayName(
  name: string | null | undefined,
  options?: { isAuthenticated?: boolean; force?: boolean },
): string {
  if (options?.force) return DEMO_PARTICIPANT_LABEL;
  if (options?.isAuthenticated && !isDemoMode()) {
    return name?.trim() || DEMO_PARTICIPANT_LABEL;
  }
  if (isDemoMode() || !options?.isAuthenticated) {
    return DEMO_PARTICIPANT_LABEL;
  }
  return name?.trim() || DEMO_PARTICIPANT_LABEL;
}

export function demoOwnerLabel(): string {
  return DEMO_PARTICIPANT_LABEL;
}
