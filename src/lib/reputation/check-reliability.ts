/**
 * Сценарий Лии «Проверь надёжность участника».
 * Показывает факты; не выдаёт окончательное решение.
 */

import type { EntityHistoryItem, ReputationProfile, Review, TrustBadgeAward } from "@/types";
import { reputationVerificationLevelLabels, trustBadgeLabels } from "@/config/reputation";

export const LIA_RELIABILITY_DISCLAIMER =
  "Лия показывает факты и ориентиры ЦКР. Это не окончательное решение о надёжности участника.";

export type ReliabilityReport = {
  summary: string;
  facts: string[];
  documentsNote: string;
  historyNote: string;
  recommendation: string;
  disclaimer: string;
};

export function buildReliabilityReport(input: {
  displayName: string;
  reputation: ReputationProfile | null;
  reviews: Review[];
  history: EntityHistoryItem[];
  badges: TrustBadgeAward[];
  platformVerified: boolean;
  documentsPending?: number;
  documentsVerified?: number;
}): ReliabilityReport {
  const score = input.reputation?.score ?? 0;
  const level = input.reputation?.verificationLevel ?? "basic";
  const deals = input.reputation?.completedDeals ?? 0;
  const projects = input.reputation?.completedProjects ?? 0;

  const facts = [
    `Участник: ${input.displayName}`,
    `Уровень доверия профиля: ${reputationVerificationLevelLabels[level]}`,
    `Средняя оценка отзывов: ${score > 0 ? `${score.toFixed(1)} / 5` : "пока нет оценок"} (${input.reviews.length} отзывов)`,
    `Завершённые проекты (опубликованные): ${projects}`,
    `Завершённые сделки: ${deals}`,
    `Верификация платформы: ${input.platformVerified ? "verified" : "не подтверждена"}`,
    input.badges.length
      ? `Бейджи: ${input.badges.map((item) => trustBadgeLabels[item.badge]).join(", ")}`
      : "Бейджи доверия пока не выданы",
  ];

  if (typeof input.documentsVerified === "number") {
    facts.push(
      `Документы: подтверждено ${input.documentsVerified}${
        typeof input.documentsPending === "number"
          ? `, на проверке ${input.documentsPending}`
          : ""
      }`,
    );
  }

  const historyNote =
    input.history.length > 0
      ? `В истории участия ${input.history.length} записей (проекты, сделки, партнёрства, задачи). Последнее: «${input.history[0]?.title}».`
      : "История участия пока пуста или не синхронизирована.";

  const documentsNote =
    "Документы и верификация доступны в соответствующих разделах ЦКР. Лия не подменяет проверку оператора.";

  let recommendation =
    "Изучите отзывы, историю и статус проверки. При необходимости запросите верификацию через ЦКР.";
  if (!input.platformVerified && deals === 0 && score === 0) {
    recommendation =
      "Фактов пока мало: нет подтверждённой проверки и отзывов. Рекомендуется дополнительная осторожность и запрос документов.";
  } else if (level === "trusted" || (score >= 4 && deals >= 2)) {
    recommendation =
      "По доступным фактам участник выглядит активным в экосистеме. Это ориентир, а не гарантия сделки.";
  }

  return {
    summary: `Сводка по надёжности «${input.displayName}» — только факты ЦКР, без вердикта.`,
    facts,
    documentsNote,
    historyNote,
    recommendation,
    disclaimer: LIA_RELIABILITY_DISCLAIMER,
  };
}
