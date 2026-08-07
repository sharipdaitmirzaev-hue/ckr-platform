/**
 * Юридические страницы ЦКР.
 * Черновики — требуют юридической проверки перед публичным запуском.
 */

export const LEGAL_REVIEW_BANNER =
  "Требует юридической проверки перед публичным запуском. Текст ниже — черновик для структуры сайта, а не юридическое заключение.";

export const LEGAL_PAGES = [
  {
    href: "/privacy",
    title: "Политика конфиденциальности",
    short: "Конфиденциальность",
  },
  {
    href: "/terms",
    title: "Пользовательское соглашение",
    short: "Условия",
  },
  {
    href: "/personal-data",
    title: "Обработка персональных данных",
    short: "Персональные данные",
  },
] as const;

export const COOKIE_POLICY = {
  /** Фактически: сессионные cookies Supabase Auth; аналитика — first-party events без сторонних трекеров. */
  usesOptionalThirdPartyCookies: false,
  summary:
    "ЦКР использует необходимые cookies сессии авторизации (Supabase). Отдельный cookie-баннер не показывается, пока не подключены необязательные сторонние трекеры.",
} as const;
