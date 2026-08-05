import type { AssignableRole } from "@/config/roles";

export type RolePath = {
  role: AssignableRole;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

/** Персональный путь после выбора роли. */
export const rolePaths: Record<AssignableRole, RolePath> = {
  entrepreneur: {
    role: "entrepreneur",
    title: "Создать проект с Лией",
    description:
      "Оформите идею в проект ЦКР — Лия поможет собрать описание и следующие шаги.",
    ctaLabel: "Открыть Лию",
    href: "/lia",
  },
  investor: {
    role: "investor",
    title: "Найти проекты",
    description:
      "Изучите каталог проектов и откликнитесь на те, что соответствуют вашему интересу.",
    ctaLabel: "Каталог проектов",
    href: "/projects",
  },
  expert: {
    role: "expert",
    title: "Создать профиль эксперта",
    description:
      "Опубликуйте компетенции в каталоге доверия ЦКР и принимайте заявки от проектов.",
    ctaLabel: "Профиль эксперта",
    href: "/dashboard/expert",
  },
  company: {
    role: "company",
    title: "Кабинет организации",
    description:
      "Создайте профиль организации, добавьте сотрудников и проекты в партнёрской сети ЦКР.",
    ctaLabel: "Открыть /partner",
    href: "/partner",
  },
};

const ROLE_PRIORITY: AssignableRole[] = [
  "entrepreneur",
  "company",
  "investor",
  "expert",
];

export function pickPrimaryRole(roles: AssignableRole[]): AssignableRole {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return "entrepreneur";
}

export function pathForRoles(roles: AssignableRole[]): RolePath {
  return rolePaths[pickPrimaryRole(roles)];
}
