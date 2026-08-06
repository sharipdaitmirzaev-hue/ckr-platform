import { NextResponse } from "next/server";

/** Единый формат ошибки API ЦКР. */
export type ApiErrorBody = {
  ok: false;
  error: string;
  code?: string;
  disclaimer?: string;
};

export type ApiSuccessBody<T extends Record<string, unknown>> = {
  ok: true;
} & T;

export const API_ERROR_MESSAGES = {
  unauthorized: "Требуется авторизация.",
  forbidden: "Недостаточно прав.",
  blocked: "Аккаунт заблокирован.",
  badRequest: "Некорректный запрос.",
  notFound: "Не найдено.",
  rateLimited: "Слишком много запросов. Повторите позже.",
  unavailable: "Сервис временно недоступен.",
  internal: "Внутренняя ошибка. Попробуйте позже.",
  supabaseMissing: "Supabase не настроен.",
} as const;

export function apiError(
  status: number,
  error: string,
  extras?: { code?: string; disclaimer?: string },
) {
  const body: ApiErrorBody = {
    ok: false,
    error,
    ...(extras?.code ? { code: extras.code } : {}),
    ...(extras?.disclaimer ? { disclaimer: extras.disclaimer } : {}),
  };
  return NextResponse.json(body, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200,
) {
  return NextResponse.json({ ok: true, ...data } satisfies ApiSuccessBody<T>, {
    status,
  });
}

/** Сообщение для UI: без утечки внутренних деталей. */
export function publicErrorMessage(
  fallback = API_ERROR_MESSAGES.internal,
): string {
  return fallback;
}
