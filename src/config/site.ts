function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Fallback только для локальной разработки. В production URL обязан быть в env
  // (иначе в HTML/OG попадут ссылки на localhost).
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[site] NEXT_PUBLIC_SITE_URL не задан в production — задайте https://ckr-center.ru в /etc/ckr/ckr.env и пересоберите.",
    );
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "ЦКР",
  title: "ЦКР — Центр комплексных решений",
  description:
    "ЦКР — платформа, где идеи встречаются с возможностями и капиталом. Партнёрство. Надёжность. Результат.",
  url: resolveSiteUrl(),
  locale: "ru_RU",
  ogLocale: "ru_RU",
  /** Публичный контакт поддержки (не для секретов). */
  supportEmail: "support@ckr-center.ru",
  keywords: [
    "ЦКР",
    "Центр комплексных решений",
    "инвестиции",
    "бизнес-проекты",
    "предприниматели",
    "эксперты",
    "возможности",
    "Лия",
  ],
} as const;

/** Маркетинговые страницы ролей (каталог экспертов остаётся на /experts). */
export const roleLandingPaths = {
  entrepreneurs: "/entrepreneurs",
  investors: "/investors",
  experts: "/experts",
} as const;
