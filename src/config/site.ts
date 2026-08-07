import { getSiteUrl } from "@/lib/site/url";

const resolvedUrl = getSiteUrl() || "http://localhost:3000";

export const siteConfig = {
  name: "ЦКР",
  title: "ЦКР — Центр комплексных решений",
  description:
    "ЦКР — Центр комплексных решений. Помогаем предпринимателям развивать бизнес, находить решения, экспертов, партнёров и ресурсы.",
  /** Из NEXT_PUBLIC_SITE_URL (dev fallback — localhost). */
  url: resolvedUrl,
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
