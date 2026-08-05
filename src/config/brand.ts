/**
 * ЦКР — фирменные токены и константы бренда.
 * Единый источник правды для UI и документации.
 */
export const brand = {
  name: "ЦКР",
  fullName: "Центр комплексных решений",
  tagline: "Партнёрство. Надёжность. Результат.",
  positioning:
    "Цифровая платформа для поиска возможностей, партнёров и реализации бизнес-проектов.",
  journey: [
    "Идея",
    "Анализ",
    "Поиск ресурсов",
    "Партнёры",
    "Реализация",
  ] as const,
  colors: {
    background: "#071522",
    foreground: "#F2F2F2",
    muted: "#BFC4CA",
    accent: "#C9A227",
    surface: "#0C1E2E",
    surfaceElevated: "#122839",
    border: "rgba(191, 196, 202, 0.18)",
    accentMuted: "rgba(201, 162, 39, 0.14)",
  },
} as const;

export type BrandJourneyStep = (typeof brand.journey)[number];
