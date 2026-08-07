/**
 * Архитектура Лии для оператора CRM ЦКР (Этап 21).
 *
 * Пока только подготовка: сценарии, запросы к данным и формат ответа.
 * Полный чат-движок и автодействия — следующие этапы.
 * Лия только рекомендует; конвертации и изменения — после подтверждения админа.
 */

import type { CrmLeadStage } from "@/config/crm";
import { crmLeadStageLabels } from "@/config/crm";

export const LIA_CRM_OPERATOR_DISCLAIMER =
  "Рекомендации Лии для оператора ЦКР — ориентир по CRM, не замена решения администратора.";

export type LiaCrmOperatorScenarioId =
  | "leads_need_attention"
  | "projects_without_investor"
  | "stale_contacts"
  | "open_tasks";

export type LiaCrmOperatorScenario = {
  id: LiaCrmOperatorScenarioId;
  label: string;
  examplePrompt: string;
  description: string;
};

/** Примеры запросов оператора — для UI и будущих сценариев. */
export const LIA_CRM_OPERATOR_SCENARIOS: LiaCrmOperatorScenario[] = [
  {
    id: "leads_need_attention",
    label: "Лиды, требующие внимания",
    examplePrompt: "Какие лиды требуют внимания?",
    description:
      "Лиды на этапах new / contacted без активности или давно без движения.",
  },
  {
    id: "projects_without_investor",
    label: "Проекты без инвестора",
    examplePrompt: "Какие проекты сейчас без инвестора?",
    description:
      "Опубликованные проекты без связанных инвестиционных сделок / откликов.",
  },
  {
    id: "stale_contacts",
    label: "Контакты без движения",
    examplePrompt: "Какие контакты давно без активности?",
    description: "Активные контакты без задач и звонков за период.",
  },
  {
    id: "open_tasks",
    label: "Открытые задачи CRM",
    examplePrompt: "Какие задачи CRM сейчас открыты?",
    description: "Сводка открытых задач операторов.",
  },
];

export type LiaCrmLeadAttentionItem = {
  id: string;
  title: string;
  stage: CrmLeadStage;
  stageLabel: string;
  contactName?: string;
  reason: string;
};

export type LiaCrmOperatorInsight = {
  scenarioId: LiaCrmOperatorScenarioId;
  summary: string;
  items: LiaCrmLeadAttentionItem[];
  nextStep: string;
  disclaimer: string;
};

const ATTENTION_STAGES: CrmLeadStage[] = ["new", "contacted", "qualified"];

/**
 * Черновой хелпер: по списку лидов формирует «требуют внимания».
 * Не пишет в БД и не меняет сущности.
 */
export function buildLeadsNeedAttentionInsight(
  leads: Array<{
    id: string;
    title: string;
    stage: CrmLeadStage;
    contactName?: string;
    updatedAt?: string;
  }>,
): LiaCrmOperatorInsight {
  const items: LiaCrmLeadAttentionItem[] = leads
    .filter((lead) => ATTENTION_STAGES.includes(lead.stage))
    .slice(0, 8)
    .map((lead) => ({
      id: lead.id,
      title: lead.title,
      stage: lead.stage,
      stageLabel: crmLeadStageLabels[lead.stage],
      contactName: lead.contactName,
      reason:
        lead.stage === "new"
          ? "Новый лид — нужен первый контакт"
          : lead.stage === "contacted"
            ? "Контакт есть — нужна квалификация"
            : "Квалифицирован — решить конвертацию",
    }));

  return {
    scenarioId: "leads_need_attention",
    summary:
      items.length > 0
        ? `Сейчас ${items.length} лид(ов) на ранних этапах требуют внимания оператора.`
        : "Открытых лидов на ранних этапах не найдено.",
    items,
    nextStep:
      "Проверьте карточку лида, зафиксируйте активность и при необходимости запустите конвертацию с подтверждением.",
    disclaimer: LIA_CRM_OPERATOR_DISCLAIMER,
  };
}

/**
 * Точка расширения будущего движка Лии-оператора.
 * Позже: связать с lib/lia/engine + CRM queries.
 */
export type LiaCrmOperatorContext = {
  adminUserId: string;
  scenarioId?: LiaCrmOperatorScenarioId;
  prompt?: string;
};

export function resolveLiaCrmScenario(
  prompt: string,
): LiaCrmOperatorScenarioId | null {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("лид") && normalized.includes("вниман")) {
    return "leads_need_attention";
  }
  if (normalized.includes("без инвестора") || normalized.includes("инвестор")) {
    return "projects_without_investor";
  }
  if (normalized.includes("контакт") && normalized.includes("активн")) {
    return "stale_contacts";
  }
  if (normalized.includes("задач")) {
    return "open_tasks";
  }
  return null;
}
