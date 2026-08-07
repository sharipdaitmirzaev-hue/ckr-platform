export const siteConfig = {
  name: "ЦКР",
  title: "ЦКР — Центр комплексных решений",
  description:
    "ЦКР — Центр комплексных решений. Помогаем предпринимателям развивать бизнес, находить решения, экспертов, партнёров и ресурсы.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ru_RU",
  ogLocale: "ru_RU",
  keywords: [
    "ЦКР",
    "Центр комплексных решений",
    "аудит бизнеса",
    "инвестиции",
    "бизнес-проекты",
    "предприниматели",
    "эксперты",
    "возможности",
    "Лия",
    "партнёры",
  ],
} as const;

/** Маркетинговые страницы ролей (каталог экспертов остаётся на /experts). */
export const roleLandingPaths = {
  entrepreneurs: "/entrepreneurs",
  investors: "/investors",
  experts: "/experts",
} as const;
