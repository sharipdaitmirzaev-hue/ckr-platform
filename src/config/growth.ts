/**
 * Growth Engine — этап 60: управляемый рост после Public Launch.
 * Каналы переиспользуют LaunchChannels (public-launch).
 */

import {
  LAUNCH_CHANNELS,
  launchChannelLabels,
  normalizeLaunchChannel,
  type LaunchChannel,
} from "@/config/public-launch";

export type GrowthChannel = LaunchChannel;

export const GROWTH_CHANNELS = LAUNCH_CHANNELS;

export const growthChannelLabels = launchChannelLabels;

export { normalizeLaunchChannel };

/** ProjectGrowthPipeline */
export const PROJECT_GROWTH_STAGES = [
  "found",
  "contact",
  "registration",
  "card_created",
  "published",
  "interactions",
] as const;

export type ProjectGrowthStage = (typeof PROJECT_GROWTH_STAGES)[number];

export const projectGrowthStageLabels: Record<ProjectGrowthStage, string> = {
  found: "Найден проект",
  contact: "Контакт",
  registration: "Регистрация",
  card_created: "Создание карточки",
  published: "Публикация",
  interactions: "Получение взаимодействий",
};

/** ExpertGrowthPipeline */
export const EXPERT_GROWTH_STAGES = [
  "search",
  "invite",
  "registration",
  "profile",
  "verification",
  "requests",
] as const;

export type ExpertGrowthStage = (typeof EXPERT_GROWTH_STAGES)[number];

export const expertGrowthStageLabels: Record<ExpertGrowthStage, string> = {
  search: "Поиск эксперта",
  invite: "Приглашение",
  registration: "Регистрация",
  profile: "Профиль",
  verification: "Верификация",
  requests: "Получение запросов",
};

/** GrowthTasks */
export const GROWTH_TASK_TYPES = [
  "find_partner",
  "invite_experts",
  "attract_projects",
  "prepare_event",
  "create_content",
] as const;

export type GrowthTaskType = (typeof GROWTH_TASK_TYPES)[number];

export const growthTaskTypeLabels: Record<GrowthTaskType, string> = {
  find_partner: "Найти партнёра",
  invite_experts: "Пригласить экспертов",
  attract_projects: "Привлечь проекты",
  prepare_event: "Подготовить мероприятие",
  create_content: "Создать контент",
};

export const GROWTH_TASK_STATUSES = [
  "new",
  "in_progress",
  "completed",
] as const;

export type GrowthTaskStatus = (typeof GROWTH_TASK_STATUSES)[number];

export const growthTaskStatusLabels: Record<GrowthTaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

export function isGrowthTaskType(value: string): value is GrowthTaskType {
  return (GROWTH_TASK_TYPES as readonly string[]).includes(value);
}

export function isGrowthTaskStatus(value: string): value is GrowthTaskStatus {
  return (GROWTH_TASK_STATUSES as readonly string[]).includes(value);
}

export const DEFAULT_GROWTH_TASKS: Array<{
  taskType: GrowthTaskType;
  title: string;
  description: string;
}> = [
  {
    taskType: "find_partner",
    title: "Найти ключевого партнёра",
    description: "Организация / канал для привлечения пользователей.",
  },
  {
    taskType: "invite_experts",
    title: "Пригласить экспертов",
    description: "Набор экспертов через invites и CRM.",
  },
  {
    taskType: "attract_projects",
    title: "Привлечь проекты",
    description: "CRM pipeline: контакт → карточка → публикация.",
  },
  {
    taskType: "prepare_event",
    title: "Подготовить мероприятие",
    description: "Канал events для роста аудитории.",
  },
  {
    taskType: "create_content",
    title: "Создать контент",
    description: "Материалы для канала content / соцсетей.",
  },
] as const;
