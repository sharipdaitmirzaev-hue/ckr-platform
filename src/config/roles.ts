import type { UserRole } from "@/types";

export const ASSIGNABLE_ROLES = [
  "entrepreneur",
  "investor",
  "expert",
  "company",
] as const satisfies readonly UserRole[];

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const roleLabels: Record<UserRole, string> = {
  entrepreneur: "Предприниматель",
  investor: "Инвестор",
  expert: "Эксперт",
  company: "Компания",
  admin: "Администратор",
};

export const roleDescriptions: Record<AssignableRole, string> = {
  entrepreneur: "Создаёте проекты и ищете ресурсы для реализации",
  investor: "Ищете проекты и формируете инвестиционные предложения",
  expert: "Предлагаете экспертизу: право, учёт, маркетинг и др.",
  company: "Представляете компанию, активы или комплексные возможности",
};
