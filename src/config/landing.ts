import { brand } from "@/config/brand";

/** Stage 4I — clean public first screen (person → idea → CKR). */
export const LANDING = {
  fullName: brand.fullName.toUpperCase(),
  motto: brand.tagline.toUpperCase(),
  mission: [
    "Мы объединяем людей, идеи и ресурсы, чтобы помогать бизнесу и проектам расти.",
    "ЦКР помогает найти партнёров, инвесторов, покупателей, поставщиков и решения для реализации идеи.",
  ] as const,
  primaryCta: {
    label: "Расскажите нам вашу идею",
    href: "/idea",
  },
  secondaryCta: {
    label: "Войти",
    href: "/login",
  },
  secondaryAuthedCta: {
    label: "Кабинет",
    href: "/dashboard",
  },
  seoDescription:
    "ЦКР — Центр комплексных решений. Расскажите идею без регистрации: мы поможем найти партнёров, инвесторов и ресурсы.",
} as const;
