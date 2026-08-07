export const siteConfig = {
  name: "ЦКР",
  title: "ЦКР — Центр комплексных решений",
  description:
    "ЦКР — платформа, где идеи встречаются с возможностями и капиталом. Партнёрство. Надёжность. Результат.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ru_RU",
  ogLocale: "ru_RU",
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
