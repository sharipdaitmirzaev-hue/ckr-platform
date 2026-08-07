/** Wave 2 — Ecosystem Beta (этап 46). */

import { WAVE2_ECOSYSTEM_GOAL_IDS } from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";

export const ECOSYSTEM_WAVE_ID = LAUNCH_WAVE_IDS.wave2;

export const ECOSYSTEM_WAVE_NAME = "Wave 2 — Ecosystem Beta" as const;

export const WAVE2_GOAL_IDS = WAVE2_ECOSYSTEM_GOAL_IDS;

export type EcosystemRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const ECOSYSTEM_ROLE_PLAYBOOKS: Record<
  EcosystemRoleKey,
  {
    label: string;
    goals: string[];
  }
> = {
  entrepreneurs: {
    label: "Entrepreneurs",
    goals: [
      "создание профиля",
      "создание проекта",
      "анализ Лией",
      "поиск решений",
    ],
  },
  experts: {
    label: "Experts",
    goals: [
      "создание профиля",
      "верификация",
      "получение запросов",
    ],
  },
  investors: {
    label: "Investors",
    goals: [
      "просмотр проектов",
      "интерес",
      "заявки",
    ],
  },
  organizations: {
    label: "Organizations",
    goals: [
      "профиль",
      "проекты",
      "партнёрства",
    ],
  },
};

export type EcosystemScenarioKey =
  | "entrepreneur"
  | "investor"
  | "expert";

export const ECOSYSTEM_SCENARIOS: Record<
  EcosystemScenarioKey,
  {
    label: string;
    steps: string[];
  }
> = {
  entrepreneur: {
    label: "Сценарий предпринимателя",
    steps: [
      "Регистрация",
      "Профиль",
      "Лия",
      "Проект",
      "Поиск эксперта",
      "Заявка",
    ],
  },
  investor: {
    label: "Сценарий инвестора",
    steps: [
      "Регистрация",
      "Профиль",
      "Каталог проектов",
      "Интерес",
      "Контакт",
    ],
  },
  expert: {
    label: "Сценарий эксперта",
    steps: [
      "Профиль",
      "Верификация",
      "Получение запроса",
      "Взаимодействие",
    ],
  },
};
