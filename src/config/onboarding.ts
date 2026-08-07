import type { AssignableRole } from "@/config/roles";

export type RolePath = {
  role: AssignableRole;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

/** Персональный путь после выбора роли (Product Fix Sprint). */
export const rolePaths: Record<AssignableRole, RolePath> = {
  entrepreneur: {
    role: "entrepreneur",
    title: "Аудит → Проект",
    description:
      "Опишите ситуацию Лие, получите BusinessAuditReport и оформите проект — один понятный следующий шаг.",
    ctaLabel: "Получить аудит бизнеса",
    href:
      "/lia?scenario=business_audit&message=" +
      encodeURIComponent("Аудит моего бизнеса"),
  },
  investor: {
    role: "investor",
    title: "Проекты → Интерес",
    description:
      "Откройте каталог проектов и отметьте интерес к подходящим — так фиксируется ваше первое действие.",
    ctaLabel: "Каталог проектов",
    href: "/projects",
  },
  expert: {
    role: "expert",
    title: "Профиль → Доверие → Запросы",
    description:
      "Заполните профиль эксперта, пройдите проверку доверия и принимайте запросы от проектов.",
    ctaLabel: "Профиль эксперта",
    href: "/dashboard/expert",
  },
  company: {
    role: "company",
    title: "Потребность → Партнёры",
    description:
      "Оформите потребность организации и найдите партнёров в экосистеме ЦКР.",
    ctaLabel: "Кабинет организации",
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
