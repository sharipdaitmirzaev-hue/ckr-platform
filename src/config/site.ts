export const siteConfig = {
  name: "ЦКР",
  title: "ЦКР — Центр комплексных решений",
  description:
    "ЦКР соединяет предпринимателей, инвесторов, владельцев активов и экспертов. Идея → анализ → ресурсы → партнёры → реализация.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ru-RU",
} as const;
